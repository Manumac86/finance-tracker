import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/db/postgres";
import {
  recurringTransactionSchema,
  transformRecurringTransactionToUI,
  transformUIToRecurringTransaction,
} from "@/lib/db/schemas/recurring-transaction";
import { calculateNextDueDate } from "@/lib/utils/recurring-dates";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get("active") !== "false";
    const isBill = searchParams.get("bills") === "true";

    let query = supabase
      .from("recurring_transactions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", isActive)
      .order("next_due_date", { ascending: true });

    if (isBill) {
      query = query.eq("is_bill", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch recurring transactions" },
        { status: 500 }
      );
    }

    const transactions = (data || []).map(transformRecurringTransactionToUI);

    return NextResponse.json({ recurringTransactions: transactions });
  } catch (error) {
    console.error("Error fetching recurring transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const uiData = {
      ...body,
      userId,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Calculate next due date based on frequency and start date
    if (!uiData.nextDueDate) {
      uiData.nextDueDate = calculateNextDueDate(
        uiData.startDate,
        uiData.frequency
      );
    }

    const dbData = transformUIToRecurringTransaction(uiData);

    // Validate with schema
    const validated = recurringTransactionSchema.parse(dbData);

    const { data, error } = await supabase
      .from("recurring_transactions")
      .insert(validated)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create recurring transaction" },
        { status: 500 }
      );
    }

    // If it's a bill, create the first reminder
    if (validated.is_bill && validated.reminder_days_before > 0) {
      const reminderDate = new Date(validated.next_due_date);
      reminderDate.setDate(reminderDate.getDate() - validated.reminder_days_before);

      await supabase.from("bill_reminders").insert({
        id: uuidv4(),
        user_id: userId,
        recurring_transaction_id: validated.id,
        reminder_date: reminderDate.toISOString(),
        due_date: validated.next_due_date,
        amount: validated.amount,
        name: validated.name,
        status: "pending",
        notification_method: "both",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      recurringTransaction: transformRecurringTransactionToUI(data),
    });
  } catch (error) {
    console.error("Error creating recurring transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}