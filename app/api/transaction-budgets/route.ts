import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { 
  createTransactionBudgetAssignment,
  getTransactionBudgetAssignments,
  getBudgetTransactionAssignments
} from "@/lib/db/transaction-budgets";
import { createTransactionBudgetSchema } from "@/lib/db/schemas/transaction-budget";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");
    const budgetId = searchParams.get("budgetId");

    if (transactionId) {
      // Get assignments for a specific transaction
      const assignments = await getTransactionBudgetAssignments(transactionId, userId);
      return NextResponse.json({ assignments });
    } else if (budgetId) {
      // Get assignments for a specific budget
      const assignments = await getBudgetTransactionAssignments(budgetId, userId);
      return NextResponse.json({ assignments });
    } else {
      return NextResponse.json(
        { error: "Either transactionId or budgetId parameter is required" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error fetching transaction-budget assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
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

    // Validate the assignment data
    const validationResult = createTransactionBudgetSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const assignmentData = validationResult.data;

    // Create the assignment
    const assignment = await createTransactionBudgetAssignment({
      ...assignmentData,
      userId,
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("Error creating transaction-budget assignment:", error);
    
    if (error instanceof Error) {
      // Handle specific error messages
      if (error.message.includes("already assigned")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes("not found") || error.message.includes("access denied")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("exceed") || error.message.includes("Invalid")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}