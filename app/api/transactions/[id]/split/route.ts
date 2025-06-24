import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/db/postgres";
import { selectTransactions } from "@/lib/db/postgres";
import { transformTransactionToUI } from "@/lib/db/schemas/transaction";
import { validateSplitTransaction, prepareSplitTransactionPayload } from "@/lib/services/transaction-search";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await context.params;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { splits } = body;

    // Get the original transaction
    const transactions = await selectTransactions(userId, 1000);
    const originalTransaction = transactions.find(t => t.id === id);
    
    if (!originalTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const uiOriginalTransaction = transformTransactionToUI(originalTransaction);

    // Validate the split request
    const validation = validateSplitTransaction(uiOriginalTransaction, splits);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Prepare the split transaction payload
    const payload = prepareSplitTransactionPayload(uiOriginalTransaction, splits);

    // Start a transaction to ensure atomicity
    const { data: splitTransactions, error: insertError } = await supabase
      .from("transactions")
      .insert(payload.splitTransactions.map((st) => ({
        ...st,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      })))
      .select();

    if (insertError) {
      console.error("Error creating split transactions:", insertError);
      return NextResponse.json(
        { error: "Failed to create split transactions" },
        { status: 500 }
      );
    }

    // Mark the original transaction as split (soft delete or flag)
    const { error: updateError } = await supabase
      .from("transactions")
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString(),
        metadata: { ...originalTransaction.metadata, is_split: true }
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating original transaction:", updateError);
      // Could rollback split transactions here if needed
      return NextResponse.json(
        { error: "Failed to update original transaction" },
        { status: 500 }
      );
    }

    // Transform split transactions to UI format
    const uiSplitTransactions = splitTransactions?.map(transformTransactionToUI) || [];

    return NextResponse.json({
      splitTransactions: uiSplitTransactions,
      originalTransactionId: id,
      message: "Transaction split successfully",
    });
  } catch (error) {
    console.error("Error splitting transaction:", error);
    
    return NextResponse.json(
      { error: "Failed to split transaction" },
      { status: 500 }
    );
  }
}