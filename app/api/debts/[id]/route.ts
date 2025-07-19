import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { supabase } from "@/lib/db/postgres";
import { 
  UpdateDebtSchema, 
  transformDebtFromDb,
  transformDebtPaymentFromDb
} from "@/lib/db/schemas/debt";
import { logAuditEvent, AuditSeverity } from "@/lib/security/audit-logger";
import { encrypt, decrypt } from "@/lib/security/encryption";

// GET /api/debts/[id] - Get specific debt with payments
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

    // Get debt details with account info
    interface DebtWithAccount {
      id: string;
      user_id: string;
      name: string;
      debt_type: string;
      original_amount: number;
      current_balance: number;
      interest_rate: number | null;
      minimum_payment: number | null;
      payment_day: number | null;
      due_date?: Date;
      account_id: string | null;
      lender_name: string | null;
      account_number: string | null;
      notes: string | null;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
      account_name?: string;
      account_type?: string;
      [key: string]: unknown;
    }

    const { data: debtData, error: debtError } = await supabase
      .from("debts")
      .select(`
        *,
        bank_accounts!left(
          account_name,
          account_type
        )
      `)
      .eq("id", debtId)
      .eq("user_id", userId)
      .single();

    if (debtError || !debtData) {
      console.error("Error fetching debt:", debtError);
      return NextResponse.json({ error: "Debt not found" }, { status: 404 });
    }

    const debtRow = debtData;
    const debt = transformDebtFromDb(debtRow);

    // Decrypt account number if present
    if (debt.account_number) {
      try {
        debt.account_number = decrypt(debt.account_number);
      } catch (error) {
        console.error("Error decrypting account number:", error);
        debt.account_number = null;
      }
    }

    // Get recent payments (last 10)
    interface DebtPaymentRow {
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
      [key: string]: unknown;
    }

    const { data: paymentRows, error: paymentsError } = await supabase
      .from("debt_payments")
      .select("*")
      .eq("debt_id", debtId)
      .eq("user_id", userId)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);

    if (paymentsError) {
      console.warn("Error fetching debt payments:", paymentsError);
    }

    const recentPayments = (paymentRows || []).map(transformDebtPaymentFromDb);

    // Calculate next payment due date
    let nextPaymentDue = null;
    if (debt.payment_day && debt.is_active) {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Try current month first
      const thisMonthDue = new Date(currentYear, currentMonth, debt.payment_day);
      if (thisMonthDue > today) {
        nextPaymentDue = thisMonthDue.toISOString().split('T')[0];
      } else {
        // Next month
        const nextMonthDue = new Date(currentYear, currentMonth + 1, debt.payment_day);
        nextPaymentDue = nextMonthDue.toISOString().split('T')[0];
      }
    }

    // Calculate payoff timeline (simplified)
    let payoffTimeline = null;
    if (debt.current_balance > 0 && debt.minimum_payment && debt.minimum_payment > 0) {
      const monthsRemaining = Math.ceil(debt.current_balance / debt.minimum_payment);
      const totalInterest = debt.interest_rate ? 
        (debt.current_balance * (debt.interest_rate / 100) * (monthsRemaining / 12)) : 0;
      
      const payoffDate = new Date();
      payoffDate.setMonth(payoffDate.getMonth() + monthsRemaining);
      
      payoffTimeline = {
        months_remaining: monthsRemaining,
        total_interest: totalInterest,
        payoff_date: payoffDate.toISOString().split('T')[0],
      };
    }

    const result = {
      ...debt,
      account: debtRow.bank_accounts?.account_name ? {
        id: debtRow.account_id,
        name: debtRow.bank_accounts.account_name,
        account_type: debtRow.bank_accounts.account_type,
      } : null,
      recent_payments: recentPayments,
      next_payment_due: nextPaymentDue,
      payoff_timeline: payoffTimeline,
    };

    await logAuditEvent({
      user_id: userId,
      event_type: "debt_viewed" as any,
      event_description: "User viewed debt details",
      severity: AuditSeverity.LOW,
      metadata: { debt_id: debtId }
    });

    return NextResponse.json({ debt: result });
  } catch (error) {
    console.error("Error fetching debt:", error);
    return NextResponse.json(
      { error: "Failed to fetch debt" },
      { status: 500 }
    );
  }
}

// PUT /api/debts/[id] - Update debt
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    interface DebtWithAccount {
      id: string;
      user_id: string;
      name: string;
      debt_type: string;
      original_amount: number;
      current_balance: number;
      interest_rate: number | null;
      minimum_payment: number | null;
      payment_day: number | null;
      due_date?: Date;
      account_id: string | null;
      lender_name: string | null;
      account_number: string | null;
      notes: string | null;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
      account_name?: string;
      account_type?: string;
      [key: string]: unknown;
    }

    const { id: debtId } = await params;
    const body = await request.json();
    const validatedData = UpdateDebtSchema.parse({ ...body, id: debtId });

    // Check if debt exists and belongs to user
    const { data: existingDebt, error: existsError } = await supabase
      .from("debts")
      .select("id")
      .eq("id", debtId)
      .eq("user_id", userId)
      .single();

    if (existsError || !existingDebt) {
      return NextResponse.json({ error: "Debt not found" }, { status: 404 });
    }

    // If account_id is provided, verify it exists
    if (validatedData.account_id) {
      const { data: accountExists, error: accountError } = await supabase
        .from("bank_accounts")
        .select("id")
        .eq("id", validatedData.account_id)
        .eq("user_id", userId)
        .single();

      if (accountError || !accountExists) {
        console.log(`Account ${validatedData.account_id} not found for user ${userId}, setting to null`);
        validatedData.account_id = null;
      }
    }

    // Encrypt account number if provided
    let encryptedAccountNumber = undefined;
    if (validatedData.account_number !== undefined) {
      encryptedAccountNumber = validatedData.account_number ? 
        encrypt(validatedData.account_number) : null;
    }

    // Prepare update data
    const updateData: Record<string, any> = {};

    const fieldMappings = {
      name: 'name',
      debt_type: 'debt_type',
      original_amount: 'original_amount',
      current_balance: 'current_balance',
      interest_rate: 'interest_rate',
      minimum_payment: 'minimum_payment',
      payment_day: 'payment_day',
      due_date: 'due_date',
      account_id: 'account_id',
      lender_name: 'lender_name',
      notes: 'notes',
      is_active: 'is_active',
    };

    for (const [key, dbField] of Object.entries(fieldMappings)) {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        updateData[dbField] = validatedData[key as keyof typeof validatedData];
      }
    }

    if (encryptedAccountNumber !== undefined) {
      updateData.account_number = encryptedAccountNumber;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Perform the update
    const { data: updateResult, error: updateError } = await supabase
      .from("debts")
      .update(updateData)
      .eq("id", debtId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError || !updateResult) {
      throw new Error(`Failed to update debt: ${updateError?.message}`);
    }

    const debt = transformDebtFromDb(updateResult);

    await logAuditEvent({
      user_id: userId,
      event_type: "debt_updated" as any,
      event_description: "User updated debt information",
      severity: AuditSeverity.MEDIUM,
      metadata: {
        debt_id: debtId,
        updated_fields: Object.keys(fieldMappings).filter(
          key => validatedData[key as keyof typeof validatedData] !== undefined
        )
      }
    });

    return NextResponse.json({ debt });
  } catch (error) {
    console.error("Error updating debt:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update debt" },
      { status: 500 }
    );
  }
}

// DELETE /api/debts/[id] - Delete debt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: debtId } = await params;

    // Check if debt exists and belongs to user
    const { data: existingDebt, error: existsError } = await supabase
      .from("debts")
      .select("id, name")
      .eq("id", debtId)
      .eq("user_id", userId)
      .single();

    if (existsError || !existingDebt) {
      return NextResponse.json({ error: "Debt not found" }, { status: 404 });
    }

    const debtName = existingDebt.name;

    // Check if there are any payments associated with this debt
    const { count: paymentCount, error: countError } = await supabase
      .from("debt_payments")
      .select("*", { count: "exact", head: true })
      .eq("debt_id", debtId);

    if (countError) {
      console.warn("Error checking payment count:", countError);
    }

    const hasPayments = (paymentCount || 0) > 0;

    if (hasPayments) {
      // If there are payments, mark as inactive instead of deleting
      const { error: updateError } = await supabase
        .from("debts")
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", debtId)
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error deactivating debt:", updateError);
        throw new Error(`Failed to deactivate debt: ${updateError.message}`);
      }
    } else {
      // If no payments, safe to delete
      const { error: deleteError } = await supabase
        .from("debts")
        .delete()
        .eq("id", debtId)
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Error deleting debt:", deleteError);
        throw new Error(`Failed to delete debt: ${deleteError.message}`);
      }
    }

    await logAuditEvent({
      user_id: userId,
      event_type: (hasPayments ? "debt_deactivated" : "debt_deleted") as any,
      event_description: hasPayments ? "User deactivated debt with payments" : "User deleted debt",
      severity: AuditSeverity.HIGH,
      metadata: {
        debt_id: debtId,
        debt_name: debtName,
        payment_count: paymentCount || 0
      }
    });

    return NextResponse.json({ 
      message: hasPayments ? "Debt deactivated" : "Debt deleted",
      deactivated: hasPayments
    });
  } catch (error) {
    console.error("Error deleting debt:", error);
    return NextResponse.json(
      { error: "Failed to delete debt" },
      { status: 500 }
    );
  }
}