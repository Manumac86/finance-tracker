import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { selectTransactions, insertTransaction, selectCategoryById } from "@/lib/db/postgres";
import { createTransactionSchema, transformTransactionToUI } from "@/lib/db/schemas/transaction";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const transactions = await selectTransactions(userId, limit);
    const uiTransactions = transactions.map(transformTransactionToUI);
    
    return NextResponse.json({ transactions: uiTransactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
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
    
    // Validate input data
    const validation = createTransactionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { amount, transactionType, name, description, categoryId, transactionDate } = validation.data;

    // Get category information from PostgreSQL
    let categoryName = "General";
    let categoryIcon = "DollarSign";
    
    try {
      const category = await selectCategoryById(categoryId);
      if (category) {
        categoryName = category.name;
        categoryIcon = category.icon;
      }
    } catch (categoryError) {
      console.warn("Could not fetch category info, using defaults:", categoryError);
    }

    // Prepare transaction data for database
    const transactionData = {
      user_id: userId,
      amount: transactionType === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      transaction_type: transactionType,
      name,
      description: description || '',
      category_id: categoryId,
      category_name: categoryName,
      category_icon: categoryIcon,
      transaction_date: transactionDate || new Date().toISOString(),
    };

    const createdTransaction = await insertTransaction(transactionData);
    const uiTransaction = transformTransactionToUI(createdTransaction);
    
    return NextResponse.json({ transaction: uiTransaction }, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
