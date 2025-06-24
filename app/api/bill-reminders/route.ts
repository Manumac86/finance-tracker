import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/db/postgres";
import { transformBillReminderToUI } from "@/lib/db/schemas/bill-reminder";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming") === "true";

    let query = supabase
      .from("bill_reminders")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("due_date", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    if (upcoming) {
      // Get reminders for the next 30 days
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      query = query
        .gte("due_date", new Date().toISOString())
        .lte("due_date", thirtyDaysFromNow.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch bill reminders" },
        { status: 500 }
      );
    }

    const reminders = (data || []).map(transformBillReminderToUI);

    return NextResponse.json({ billReminders: reminders });
  } catch (error) {
    console.error("Error fetching bill reminders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reminderId, status } = body;

    if (!reminderId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("bill_reminders")
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", reminderId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update bill reminder" },
        { status: 500 }
      );
    }

    // If marked as paid, create the actual transaction
    if (status === "paid") {
      const { data: recurringTx } = await supabase
        .from("recurring_transactions")
        .select("*")
        .eq("id", data.recurring_transaction_id)
        .single();

      if (recurringTx && recurringTx.auto_create_transaction) {
        await supabase.from("transactions").insert({
          user_id: userId,
          name: recurringTx.name,
          description: `Auto-created from recurring: ${recurringTx.description || ''}`,
          amount: recurringTx.amount,
          transaction_type: recurringTx.transaction_type,
          category_id: recurringTx.category_id,
          transaction_date: data.due_date,
          is_recurring: true,
          recurring_transaction_id: recurringTx.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      billReminder: transformBillReminderToUI(data),
    });
  } catch (error) {
    console.error("Error updating bill reminder:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}