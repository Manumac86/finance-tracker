import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { supabase } from "@/lib/db/postgres";
import { 
  RecordPaymentSchema,
  transformDebtPaymentFromDb
} from "@/lib/db/schemas/debt";
import { logAuditEvent, AuditSeverity } from "@/lib/security/audit-logger";

// GET /api/debts/[id]/payments - Get payments for a specific debt
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: debtId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Verify debt belongs to user
    const { data: debtRows, error: debtError } = await supabase
      .from("debts")
      .select("id")
      .eq("id", debtId)
      .eq("user_id", userId);

    if (debtError || !debtRows || debtRows.length === 0) {
      return NextResponse.json({ error: "Debt not found" }, { status: 404 });
    }

    // Get payments for this debt
    interface PaymentWithTransaction {
      id: string;
      debt_id: string;
      user_id: string;
      payment_date: Date;
      amount: number;
      principal_amount: number;
      interest_amount: number;
      balance_after: number | null;
      payment_type: string;
      transaction_id: string | null;
      notes: string | null;
      created_at: Date;
      updated_at: Date;
      transaction_name?: string;
      transaction_description?: string;
      [key: string]: unknown;
    }

    const { data: paymentRows, error: paymentsError } = await supabase
      .from("debt_payments")
      .select(`
        *,
        transactions:transaction_id (
          id,
          name,
          description
        )
      `)
      .eq("debt_id", debtId)
      .eq("user_id", userId)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (paymentsError) {
      throw paymentsError;
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from("debt_payments")
      .select("*", { count: "exact", head: true })
      .eq("debt_id", debtId)
      .eq("user_id", userId);

    if (countError) {
      throw countError;
    }

    const payments = (paymentRows || []).map((row) => {
      const payment = transformDebtPaymentFromDb(row);
      const transaction = row.transactions as any;
      return {
        ...payment,
        transaction: transaction ? {
          id: transaction.id,
          name: transaction.name,
          description: transaction.description,
        } : null,
      };
    });

    const total = count || 0;

    await logAuditEvent({
      user_id: userId,
      event_type: "debt_payments_viewed" as any,
      event_description: "User viewed debt payments",
      severity: AuditSeverity.LOW,
      metadata: { debt_id: debtId, count: payments.length }
    });

    return NextResponse.json({
      payments,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + payments.length < total
      }
    });
  } catch (error) {
    console.error("Error fetching debt payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch debt payments" },
      { status: 500 }
    );
  }
}

// POST /api/debts/[id]/payments - Record a new payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: debtId } = await params;
    const body = await request.json();
    const validatedData = RecordPaymentSchema.parse(body);

    // Verify debt belongs to user and get current balance with interest rate
    const { data: debtRows, error: debtError } = await supabase
      .from("debts")
      .select("id, current_balance, interest_rate, name")
      .eq("id", debtId)
      .eq("user_id", userId)
      .eq("is_active", true);

    if (debtError || !debtRows || debtRows.length === 0) {
      return NextResponse.json({ error: "Debt not found or inactive" }, { status: 404 });
    }

    const debt = debtRows[0];
    const currentBalance = parseFloat(debt.current_balance);
    const interestRate = debt.interest_rate ? parseFloat(debt.interest_rate) : 0;

    // Validate payment amount
    if (validatedData.amount > currentBalance) {
      return NextResponse.json(
        { error: "Payment amount cannot exceed current balance" },
        { status: 400 }
      );
    }

    // Calculate interest and principal portions
    const monthlyInterestRate = interestRate / 100 / 12;
    const interestAmount = currentBalance * monthlyInterestRate;
    const principalAmount = Math.max(0, validatedData.amount - interestAmount);
    const actualInterestAmount = Math.min(validatedData.amount, interestAmount);

    // Calculate new balance after payment
    const newBalance = Math.max(0, currentBalance - validatedData.amount);

    try {
      // Insert payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from("debt_payments")
        .insert({
          debt_id: debtId,
          user_id: userId,
          payment_date: validatedData.payment_date,
          amount: validatedData.amount,
          principal_amount: principalAmount,
          interest_amount: actualInterestAmount,
          balance_after: newBalance,
          payment_type: "regular",
          transaction_id: null,
          notes: validatedData.notes || null
        })
        .select()
        .single();

      if (paymentError) {
        throw paymentError;
      }

      // Update debt balance
      const updateData: any = {
        current_balance: newBalance,
        updated_at: new Date().toISOString()
      };

      // If debt is paid off, mark as inactive
      if (newBalance === 0) {
        updateData.is_active = false;
      }

      const { error: updateError } = await supabase
        .from("debts")
        .update(updateData)
        .eq("id", debtId);

      if (updateError) {
        // Try to rollback by deleting the payment
        await supabase
          .from("debt_payments")
          .delete()
          .eq("id", paymentData.id);
        throw updateError;
      }

      const payment = transformDebtPaymentFromDb(paymentData);

      await logAuditEvent({
        user_id: userId,
        event_type: "debt_payment_recorded" as any,
        event_description: "User recorded debt payment",
        severity: AuditSeverity.MEDIUM,
        metadata: {
          debt_id: debtId,
          payment_id: payment.id,
          amount: payment.amount,
          new_balance: newBalance,
          paid_off: newBalance === 0
        }
      });

      return NextResponse.json({ 
        payment,
        debt_balance: newBalance,
        paid_off: newBalance === 0
      }, { status: 201 });
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error recording debt payment:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}