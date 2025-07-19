import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { query } from "@/lib/db/postgres";
import { 
  UpdateDebtPaymentSchema, 
  transformDebtPaymentFromDb
} from "@/lib/db/schemas/debt";
import { logAuditEvent, AuditSeverity } from "@/lib/security/audit-logger";

// GET /api/debt-payments/[id] - Get specific payment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: paymentId } = await params;

    interface PaymentWithDetails {
      id: string;
      user_id: string;
      debt_id: string;
      transaction_id: string | null;
      amount: number;
      principal_amount: number;
      interest_amount: number;
      balance_after: number | null;
      payment_type: string;
      payment_date: Date;
      notes: string | null;
      created_at: Date;
      debt_name: string;
      transaction_name: string | null;
      transaction_description: string | null;
      [key: string]: unknown;
    }

    const result = await query<PaymentWithDetails>(`
      SELECT 
        dp.*,
        d.name as debt_name,
        t.name as transaction_name,
        t.description as transaction_description
      FROM debt_payments dp
      LEFT JOIN debts d ON dp.debt_id = d.id
      LEFT JOIN transactions t ON dp.transaction_id = t.id
      WHERE dp.id = $1 AND dp.user_id = $2
    `, [paymentId, userId]);

    if (result.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const row = result[0];
    const payment = transformDebtPaymentFromDb(row);

    const enrichedPayment = {
      ...payment,
      debt: {
        id: row.debt_id,
        name: row.debt_name,
      },
      transaction: row.transaction_name ? {
        id: row.transaction_id,
        name: row.transaction_name,
        description: row.transaction_description,
      } : null,
    };

    await logAuditEvent({
      user_id: userId,
      event_type: "debt_payment_viewed" as any,
      event_description: "User viewed debt payment details",
      severity: AuditSeverity.LOW,
      metadata: { payment_id: paymentId }
    });

    return NextResponse.json({ payment: enrichedPayment });
  } catch (error) {
    console.error("Error fetching debt payment:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 }
    );
  }
}

// PUT /api/debt-payments/[id] - Update payment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: paymentId } = await params;
    const body = await request.json();
    const validatedData = UpdateDebtPaymentSchema.parse({ ...body, id: paymentId });

    // Check if payment exists and belongs to user
    interface ExistingPayment {
      id: string;
      debt_id: string;
      amount: number;
      balance_after: number;
    }

    const existingPaymentResult = await query<ExistingPayment>(
      "SELECT id, debt_id, amount, balance_after FROM debt_payments WHERE id = $1 AND user_id = $2",
      [paymentId, userId]
    );

    if (existingPaymentResult.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const existingPayment = existingPaymentResult[0];
    const oldAmount = existingPayment.amount;
    const oldBalanceAfter = existingPayment.balance_after;

    // Begin transaction
    await query("BEGIN");

    try {
      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let valueIndex = 1;

      const fieldMappings = {
        payment_date: 'payment_date',
        amount: 'amount',
        principal_amount: 'principal_amount',
        interest_amount: 'interest_amount',
        payment_type: 'payment_type',
        transaction_id: 'transaction_id',
        notes: 'notes',
      };

      for (const [key, dbField] of Object.entries(fieldMappings)) {
        if (validatedData[key as keyof typeof validatedData] !== undefined) {
          updateFields.push(`${dbField} = $${valueIndex}`);
          updateValues.push(validatedData[key as keyof typeof validatedData]);
          valueIndex++;
        }
      }

      if (updateFields.length === 0) {
        await query("ROLLBACK");
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
      }

      // If amount changed, recalculate balance after
      let newBalanceAfter = oldBalanceAfter;
      if (validatedData.amount !== undefined && validatedData.amount !== oldAmount) {
        const balanceDifference = validatedData.amount - oldAmount;
        newBalanceAfter = Math.max(0, oldBalanceAfter - balanceDifference);
        
        updateFields.push(`balance_after = $${valueIndex}`);
        updateValues.push(newBalanceAfter);
        valueIndex++;
      }

      updateValues.push(paymentId, userId);

      const sql = `
        UPDATE debt_payments 
        SET ${updateFields.join(', ')}
        WHERE id = $${valueIndex} AND user_id = $${valueIndex + 1}
        RETURNING *
      `;

      interface UpdatedPayment {
        id: string;
        user_id: string;
        debt_id: string;
        transaction_id: string | null;
        amount: number;
        principal_amount: number;
        interest_amount: number;
        balance_after: number | null;
        payment_type: string;
        payment_date: Date;
        notes: string | null;
        created_at: Date;
        [key: string]: unknown;
      }

      const result = await query<UpdatedPayment>(sql, updateValues);

      // Update debt balance if payment amount changed
      if (validatedData.amount !== undefined && validatedData.amount !== oldAmount) {
        await query(
          "UPDATE debts SET current_balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [newBalanceAfter, existingPayment.debt_id]
        );
      }

      await query("COMMIT");

      const payment = transformDebtPaymentFromDb(result[0]);

      await logAuditEvent({
        user_id: userId,
        event_type: "debt_payment_updated" as any,
        event_description: "User updated debt payment information",
        severity: AuditSeverity.MEDIUM,
        metadata: {
          payment_id: paymentId,
          debt_id: existingPayment.debt_id,
          updated_fields: Object.keys(fieldMappings).filter(
            key => validatedData[key as keyof typeof validatedData] !== undefined
          )
        }
      });

      return NextResponse.json({ payment });
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error updating debt payment:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}

// DELETE /api/debt-payments/[id] - Delete payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: paymentId } = await params;

    // Get payment details before deletion
    interface PaymentToDelete {
      debt_id: string;
      amount: number;
      balance_after: number;
    }

    const paymentResult = await query<PaymentToDelete>(
      "SELECT debt_id, amount, balance_after FROM debt_payments WHERE id = $1 AND user_id = $2",
      [paymentId, userId]
    );

    if (paymentResult.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const payment = paymentResult[0];
    const paymentAmount = payment.amount;
    const balanceAfter = payment.balance_after;

    // Begin transaction
    await query("BEGIN");

    try {
      // Delete the payment
      await query(
        "DELETE FROM debt_payments WHERE id = $1 AND user_id = $2",
        [paymentId, userId]
      );

      // Restore debt balance (add back the payment amount)
      const newBalance = balanceAfter + paymentAmount;
      await query(
        "UPDATE debts SET current_balance = $1, is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [newBalance, payment.debt_id]
      );

      await query("COMMIT");

      await logAuditEvent({
        user_id: userId,
        event_type: "debt_payment_deleted" as any,
        event_description: "User deleted debt payment",
        severity: AuditSeverity.HIGH,
        metadata: {
          payment_id: paymentId,
          debt_id: payment.debt_id,
          amount: paymentAmount,
          restored_balance: newBalance
        }
      });

      return NextResponse.json({ 
        message: "Payment deleted",
        restored_balance: newBalance
      });
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error deleting debt payment:", error);
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 }
    );
  }
}