import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { query } from "@/lib/db/postgres";
import { 
  CreateDebtPayoffStrategySchema, 
  transformStrategyFromDb
} from "@/lib/db/schemas/debt";
import { logAuditEvent, AuditSeverity } from "@/lib/security/audit-logger";

// GET /api/debt-strategies - Get all payoff strategies for user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get("active_only") === "true";
    const strategyType = searchParams.get("strategy_type");

    let sql = `
      SELECT 
        ds.*,
        COUNT(d.id) as debt_count,
        SUM(d.current_balance) as total_debt_amount
      FROM debt_payoff_strategies ds
      LEFT JOIN debts d ON d.id = ANY(
        SELECT jsonb_array_elements_text(ds.debt_order)::UUID
      ) AND d.user_id = ds.user_id AND d.is_active = true
      WHERE ds.user_id = $1
    `;
    
    const params = [userId];
    let paramIndex = 2;

    if (activeOnly) {
      sql += ` AND ds.is_active = true`;
    }

    if (strategyType) {
      sql += ` AND ds.strategy_type = $${paramIndex}`;
      params.push(strategyType);
      paramIndex++;
    }

    sql += ` GROUP BY ds.id ORDER BY ds.created_at DESC`;

    interface StrategyRow {
      id: string;
      user_id: string;
      name: string;
      strategy_type: string;
      target_date?: Date;
      extra_payment_amount: number;
      debt_order: string[] | null;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
      debt_count: string;
      total_debt_amount: string;
      [key: string]: unknown;
    }

    const result = await query<StrategyRow>(sql, params);

    const strategies = result.map((row: StrategyRow) => {
      const strategy = transformStrategyFromDb(row);
      return {
        ...strategy,
        debt_count: parseInt(row.debt_count) || 0,
        total_debt_amount: parseFloat(row.total_debt_amount) || 0,
      };
    });

    await logAuditEvent({
      user_id: userId,
      event_type: "debt_strategies_viewed" as any,
      event_description: "User viewed debt strategies list",
      severity: AuditSeverity.LOW,
      metadata: { count: strategies.length }
    });

    return NextResponse.json({ strategies });
  } catch (error) {
    console.error("Error fetching debt strategies:", error);
    return NextResponse.json(
      { error: "Failed to fetch strategies" },
      { status: 500 }
    );
  }
}

// POST /api/debt-strategies - Create new payoff strategy
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateDebtPayoffStrategySchema.parse(body);

    // If creating an avalanche or snowball strategy, auto-calculate debt order
    let debtOrder = validatedData.debt_order;
    
    if (validatedData.strategy_type === "avalanche" || validatedData.strategy_type === "snowball") {
      // Get user's active debts
      interface DebtForStrategy {
        id: string;
        current_balance: string;
        interest_rate: string | null;
        minimum_payment: string | null;
      }

      const debtsResult = await query<DebtForStrategy>(
        "SELECT id, current_balance, interest_rate, minimum_payment FROM debts WHERE user_id = $1 AND is_active = true",
        [userId]
      );

      const debts = debtsResult;
      
      if (debts.length === 0) {
        return NextResponse.json(
          { error: "No active debts found to create strategy" },
          { status: 400 }
        );
      }

      // Sort debts based on strategy type
      if (validatedData.strategy_type === "avalanche") {
        // Highest interest rate first
        debts.sort((a, b) => parseFloat(b.interest_rate || '0') - parseFloat(a.interest_rate || '0'));
      } else if (validatedData.strategy_type === "snowball") {
        // Lowest balance first
        debts.sort((a, b) => parseFloat(a.current_balance) - parseFloat(b.current_balance));
      }

      debtOrder = debts.map(debt => debt.id);
    }

    // Validate debt order contains valid debt IDs
    if (debtOrder && debtOrder.length > 0) {
      const validDebtsResult = await query(
        "SELECT id FROM debts WHERE id = ANY($1) AND user_id = $2 AND is_active = true",
        [debtOrder, userId]
      );

      if (validDebtsResult.length !== debtOrder.length) {
        return NextResponse.json(
          { error: "Invalid debt IDs in strategy" },
          { status: 400 }
        );
      }
    }

    // Deactivate other strategies if this one is active
    if (validatedData.is_active) {
      await query(
        "UPDATE debt_payoff_strategies SET is_active = false WHERE user_id = $1",
        [userId]
      );
    }

    const sql = `
      INSERT INTO debt_payoff_strategies (
        user_id, name, strategy_type, target_date, extra_payment_amount, 
        debt_order, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const params = [
      userId,
      validatedData.name,
      validatedData.strategy_type,
      validatedData.target_date,
      validatedData.extra_payment_amount,
      JSON.stringify(debtOrder),
      validatedData.is_active ?? true,
    ];

    interface DbStrategyResult {
      id: string;
      user_id: string;
      name: string;
      strategy_type: string;
      target_date?: Date;
      extra_payment_amount: number;
      debt_order: string[] | null;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
      [key: string]: unknown;
    }

    const result = await query<DbStrategyResult>(sql, params);
    const strategy = transformStrategyFromDb(result[0]);

    await logAuditEvent({
      user_id: userId,
      event_type: "debt_strategy_created" as any,
      event_description: "User created debt strategy",
      severity: AuditSeverity.MEDIUM,
      metadata: {
        strategy_id: strategy.id,
        strategy_type: strategy.strategy_type,
        debt_count: debtOrder?.length || 0
      }
    });

    return NextResponse.json({ strategy }, { status: 201 });
  } catch (error) {
    console.error("Error creating debt strategy:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create strategy" },
      { status: 500 }
    );
  }
}