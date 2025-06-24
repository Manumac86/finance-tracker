import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/db/postgres";
import {
  recurringTransactionSchema,
  transformRecurringTransactionToUI,
  transformUIToRecurringTransaction,
} from "@/lib/db/schemas/recurring-transaction";
import { calculateNextDueDate } from "@/lib/utils/recurring-dates";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("recurring_transactions")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Recurring transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      recurringTransaction: transformRecurringTransactionToUI(data),
    });
  } catch (error) {
    console.error("Error fetching recurring transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const uiData = {
      ...body,
      updatedAt: new Date().toISOString(),
    };

    // If frequency or start date changed, recalculate next due date
    if (body.frequency || body.startDate) {
      const { data: existing } = await supabase
        .from("recurring_transactions")
        .select("start_date, frequency")
        .eq("id", id)
        .single();

      if (existing) {
        const startDate = body.startDate || existing.start_date;
        const frequency = body.frequency || existing.frequency;
        uiData.nextDueDate = calculateNextDueDate(startDate, frequency);
      }
    }

    const dbData = transformUIToRecurringTransaction(uiData);

    // Validate partial update
    const validated = recurringTransactionSchema.partial().parse(dbData);

    const { data, error } = await supabase
      .from("recurring_transactions")
      .update(validated)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update recurring transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      recurringTransaction: transformRecurringTransactionToUI(data),
    });
  } catch (error) {
    console.error("Error updating recurring transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("recurring_transactions")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to delete recurring transaction" },
        { status: 500 }
      );
    }

    // Also deactivate any pending reminders
    await supabase
      .from("bill_reminders")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("recurring_transaction_id", id)
      .eq("status", "pending");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting recurring transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}