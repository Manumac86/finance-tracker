import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { query } from "@/lib/db/postgres";
import { 
  UpdateDebtPayoffStrategySchema, 
  transformStrategyFromDb
} from "@/lib/db/schemas/debt";
import { logAuditEvent, AuditSeverity } from "@/lib/security/audit-logger";

// GET /api/debt-strategies/[id] - Get specific strategy
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: strategyId } = await params;

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

    const strategyResult = await query<DbStrategyResult>(
      "SELECT * FROM debt_payoff_strategies WHERE id = $1 AND user_id = $2",
      [strategyId, userId]
    );

    if (strategyResult.length === 0) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    const strategy = transformStrategyFromDb(strategyResult[0]);

    // Get debt details for this strategy
    interface DbDebtResult {
      id: string;
      name: string;
      current_balance: string;
      interest_rate: string | null;
      minimum_payment: string | null;
      debt_type: string;
    }

    let debts: DbDebtResult[] = [];
    if (strategy.debt_order && strategy.debt_order.length > 0) {
      const debtsResult = await query<DbDebtResult>(`
        SELECT 
          id, name, current_balance, interest_rate, minimum_payment, debt_type
        FROM debts 
        WHERE id = ANY($1) AND user_id = $2 AND is_active = true
        ORDER BY array_position($1, id)
      `, [strategy.debt_order, userId]);

      debts = debtsResult;
    }

    const enrichedStrategy = {
      ...strategy,
      debts,
      debt_count: debts.length,
      total_debt_amount: debts.reduce((sum, debt) => sum + parseFloat(debt.current_balance), 0)
    };

    await logAuditEvent({
      user_id: userId,
      event_type: "debt_strategy_viewed" as any,
      event_description: "User viewed debt strategy details",
      severity: AuditSeverity.LOW,
      metadata: { strategy_id: strategyId }
    });

    return NextResponse.json({ strategy: enrichedStrategy });
  } catch (error) {
    console.error("Error fetching debt strategy:", error);
    return NextResponse.json(
      { error: "Failed to fetch strategy" },
      { status: 500 }
    );
  }
}

// PUT /api/debt-strategies/[id] - Update strategy
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const { id: strategyId } = await params;
    const body = await request.json();
    const validatedData = UpdateDebtPayoffStrategySchema.parse({ ...body, id: strategyId });

    // Check if strategy exists and belongs to user
    const existingStrategyResult = await query(
      "SELECT id FROM debt_payoff_strategies WHERE id = $1 AND user_id = $2",
      [strategyId, userId]
    );

    if (existingStrategyResult.length === 0) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    // Validate debt order if provided
    if (validatedData.debt_order && validatedData.debt_order.length > 0) {
      const validDebtsResult = await query(
        "SELECT id FROM debts WHERE id = ANY($1) AND user_id = $2 AND is_active = true",
        [validatedData.debt_order, userId]
      );

      if (validDebtsResult.length !== validatedData.debt_order.length) {
        return NextResponse.json(
          { error: "Invalid debt IDs in strategy" },
          { status: 400 }
        );
      }
    }

    // If setting as active, deactivate other strategies
    if (validatedData.is_active === true) {
      await query(
        "UPDATE debt_payoff_strategies SET is_active = false WHERE user_id = $1 AND id != $2",
        [userId, strategyId]
      );
    }

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let valueIndex = 1;

    const fieldMappings = {
      name: 'name',
      strategy_type: 'strategy_type',
      target_date: 'target_date',
      extra_payment_amount: 'extra_payment_amount',
      is_active: 'is_active',
    };

    for (const [key, dbField] of Object.entries(fieldMappings)) {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        updateFields.push(`${dbField} = $${valueIndex}`);
        updateValues.push(validatedData[key as keyof typeof validatedData]);
        valueIndex++;
      }
    }

    if (validatedData.debt_order !== undefined) {
      updateFields.push(`debt_order = $${valueIndex}`);
      updateValues.push(JSON.stringify(validatedData.debt_order));
      valueIndex++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updateValues.push(strategyId, userId);

    const sql = `
      UPDATE debt_payoff_strategies 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${valueIndex} AND user_id = $${valueIndex + 1}
      RETURNING *
    `;

    const result = await query<DbStrategyResult>(sql, updateValues);
    const strategy = transformStrategyFromDb(result[0]);

    await logAuditEvent({
      user_id: userId,
      event_type: "debt_strategy_updated" as any,
      event_description: "User updated debt strategy",
      severity: AuditSeverity.MEDIUM,
      metadata: {
        strategy_id: strategyId,
        updated_fields: Object.keys(fieldMappings).filter(
          key => validatedData[key as keyof typeof validatedData] !== undefined
        )
      }
    });

    return NextResponse.json({ strategy });
  } catch (error) {
    console.error("Error updating debt strategy:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update strategy" },
      { status: 500 }
    );
  }
}

// DELETE /api/debt-strategies/[id] - Delete strategy
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: strategyId } = await params;

    // Check if strategy exists and belongs to user
    interface ExistingStrategy {
      id: string;
      name: string;
    }

    const existingStrategyResult = await query<ExistingStrategy>(
      "SELECT id, name FROM debt_payoff_strategies WHERE id = $1 AND user_id = $2",
      [strategyId, userId]
    );

    if (existingStrategyResult.length === 0) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    const strategyName = existingStrategyResult[0].name;

    await query(
      "DELETE FROM debt_payoff_strategies WHERE id = $1 AND user_id = $2",
      [strategyId, userId]
    );

    await logAuditEvent({
      user_id: userId,
      event_type: "debt_strategy_deleted" as any,
      event_description: "User deleted debt strategy",
      severity: AuditSeverity.HIGH,
      metadata: {
        strategy_id: strategyId,
        strategy_name: strategyName
      }
    });

    return NextResponse.json({ message: "Strategy deleted" });
  } catch (error) {
    console.error("Error deleting debt strategy:", error);
    return NextResponse.json(
      { error: "Failed to delete strategy" },
      { status: 500 }
    );
  }
}