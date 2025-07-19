import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { supabase } from "@/lib/db/postgres";
import {
  CreateDebtSchema,
  transformDebtFromDb,
} from "@/lib/db/schemas/debt";
import { logAuditEvent, AuditSeverity } from "@/lib/security/audit-logger";
import { encrypt } from "@/lib/security/encryption";

// GET /api/debts - Get all debts for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get("include_inactive") === "true";
    const debtType = searchParams.get("debt_type");

    // Build Supabase query
    let supabaseQuery = supabase
      .from("debts")
      .select(`
        *,
        bank_accounts!left(
          account_name,
          account_type
        )
      `)
      .eq("user_id", userId);

    if (!includeInactive) {
      supabaseQuery = supabaseQuery.eq("is_active", true);
    }

    if (debtType) {
      supabaseQuery = supabaseQuery.eq("debt_type", debtType);
    }

    supabaseQuery = supabaseQuery.order("created_at", { ascending: false });

    const { data: rows, error: queryError } = await supabaseQuery;

    if (queryError) {
      console.error("Supabase query error:", queryError);
      throw new Error(`Failed to fetch debts: ${queryError.message}`);
    }

    interface DebtRow {
      id: string;
      user_id: string;
      name: string;
      debt_type: string;
      original_amount: number;
      current_balance: number;
      interest_rate: number | null;
      minimum_payment: number | null;
      payment_day: number | null;
      due_date?: Date | string;
      account_id: string | null;
      lender_name: string | null;
      account_number: string | null;
      notes: string | null;
      is_active: boolean;
      created_at: Date | string;
      updated_at: Date | string;
      bank_accounts?: {
        account_name?: string;
        account_type?: string;
      } | null;
      [key: string]: unknown;
    }

    const debts = (rows || []).map((row) => {
      const debt = transformDebtFromDb(row);
      return {
        ...debt,
        account: row.bank_accounts?.account_name
          ? {
              id: row.account_id,
              name: row.bank_accounts.account_name,
              account_type: row.bank_accounts.account_type,
            }
          : null,
      };
    });

    await logAuditEvent({
      user_id: userId,
      event_type: "debt_list_viewed" as any,
      event_description: "User viewed debt list",
      severity: AuditSeverity.LOW,
      metadata: { count: debts.length },
    });

    return NextResponse.json({ debts });
  } catch (error) {
    console.error("Error fetching debts:", error);
    return NextResponse.json(
      { error: "Failed to fetch debts" },
      { status: 500 }
    );
  }
}

// POST /api/debts - Create a new debt
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateDebtSchema.parse(body);

    // Encrypt account number if provided
    let encryptedAccountNumber = null;
    if (validatedData.account_number) {
      try {
        encryptedAccountNumber = encrypt(validatedData.account_number);
      } catch (error) {
        console.error('Encryption error:', error);
        return NextResponse.json({ error: "Failed to encrypt account number" }, { status: 500 });
      }
    }

    // Validate account_id if provided
    let accountId = validatedData.account_id ?? null;
    if (accountId) {
      const { data: account, error: accountError } = await supabase
        .from("bank_accounts")
        .select("id")
        .eq("id", accountId)
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (accountError || !account) {
        console.warn(`Account ${accountId} not found for user ${userId}, setting to null`);
        accountId = null;
      }
    }

    // Prepare debt data for Supabase insert
    const debtData = {
      user_id: userId,
      name: validatedData.name,
      debt_type: validatedData.debt_type,
      original_amount: validatedData.original_amount,
      current_balance: validatedData.current_balance,
      interest_rate: validatedData.interest_rate ?? null,
      minimum_payment: validatedData.minimum_payment ?? null,
      payment_day: validatedData.payment_day ?? null,
      due_date: validatedData.due_date ?? null,
      account_id: accountId,
      lender_name: validatedData.lender_name ?? null,
      account_number: encryptedAccountNumber,
      notes: validatedData.notes ?? null,
      is_active: validatedData.is_active ?? true,
    };

    // Use Supabase's direct insert method instead of the custom execute_sql function
    const { data, error } = await supabase
      .from("debts")
      .insert(debtData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Failed to create debt: ${error.message}`);
    }

    interface DbDebtResult {
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
      [key: string]: unknown;
    }

    const debt = transformDebtFromDb(data as DbDebtResult);

    await logAuditEvent({
      user_id: userId,
      event_type: "debt_created" as any,
      event_description: "User created new debt",
      severity: AuditSeverity.MEDIUM,
      metadata: {
        debt_id: debt.id,
        debt_type: debt.debt_type,
        amount: debt.original_amount,
      },
    });

    return NextResponse.json({ debt }, { status: 201 });
  } catch (error) {
    console.error("Error creating debt:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create debt" },
      { status: 500 }
    );
  }
}
