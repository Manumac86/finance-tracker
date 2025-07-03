import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { 
  updateTransactionBudgetAssignment,
  deleteTransactionBudgetAssignment
} from "@/lib/db/transaction-budgets";
import { updateTransactionBudgetSchema } from "@/lib/db/schemas/transaction-budget";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();

    // Validate the update data (partial)
    const validationResult = updateTransactionBudgetSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Update the assignment
    const assignment = await updateTransactionBudgetAssignment(
      resolvedParams.id,
      userId,
      updateData
    );

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Error updating transaction-budget assignment:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("access denied")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("exceed") || error.message.includes("Invalid")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;

    // Delete the assignment
    await deleteTransactionBudgetAssignment(resolvedParams.id, userId);

    return NextResponse.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting transaction-budget assignment:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("access denied")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}