import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  selectRecurringTransactions,
  insertRecurringTransaction,
} from "@/lib/db/postgres";
import { transformRecurringTransactionToUI } from "@/lib/db/schemas/recurring-transaction";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recurringTransactions = await selectRecurringTransactions(userId);
    const uiRecurringTransactions = recurringTransactions.map(
      transformRecurringTransactionToUI
    );

    return NextResponse.json({
      recurringTransactions: uiRecurringTransactions,
    });
  } catch (error) {
    console.error("Error fetching recurring transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch recurring transactions" },
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

    // Transform UI data to DB format
    const transactionData = {
      user_id: userId,
      name: body.name,
      description: body.description,
      amount: parseFloat(body.amount),
      transaction_type: body.transactionType,
      category_id: body.categoryId,
      frequency: body.frequency,
      start_date: body.startDate,
      end_date: body.endDate || null,
      is_bill: body.isBill,
      reminder_days_before: body.reminderDaysBefore,
      auto_create_transaction: body.autoCreateTransaction,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const recurringTransaction = await insertRecurringTransaction(
      transactionData
    );
    const uiRecurringTransaction =
      transformRecurringTransactionToUI(recurringTransaction);

    return NextResponse.json(uiRecurringTransaction, { status: 201 });
  } catch (error) {
    console.error("Error creating recurring transaction:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create recurring transaction" },
      { status: 500 }
    );
  }
}
