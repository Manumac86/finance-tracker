import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase, selectManualAccountById, updateAccountBalance } from "@/lib/db/postgres";
import { auditLogger } from "@/lib/security/audit-logger";

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transactionIds } = body;

    // Validate input
    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: "Transaction IDs array is required" },
        { status: 400 }
      );
    }

    // Get the transactions before deletion to handle account balance updates
    const { data: transactionsToDelete, error: fetchError } = await supabase
      .from("transactions")
      .select("id, amount, transaction_type, account_id")
      .in("id", transactionIds)
      .eq("user_id", userId)
      .eq("is_active", true);

    if (fetchError) {
      console.error("Error fetching transactions for deletion:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    if (!transactionsToDelete || transactionsToDelete.length === 0) {
      return NextResponse.json(
        { error: "No valid transactions found to delete" },
        { status: 404 }
      );
    }

    // Perform soft delete on transactions
    const { error: deleteError } = await supabase
      .from("transactions")
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .in("id", transactionIds)
      .eq("user_id", userId)
      .eq("is_active", true);

    if (deleteError) {
      console.error("Error deleting transactions:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete transactions" },
        { status: 500 }
      );
    }

    // Update account balances for transactions that have accounts
    const accountUpdates = new Map<string, number>();
    
    for (const transaction of transactionsToDelete) {
      if (transaction.account_id) {
        const currentAdjustment = accountUpdates.get(transaction.account_id) || 0;
        // Reverse the transaction's effect on the account balance
        const balanceAdjustment = transaction.transaction_type === 'expense' 
          ? Math.abs(transaction.amount)  // Add back the expense amount
          : -Math.abs(transaction.amount); // Subtract back the income amount
        
        accountUpdates.set(transaction.account_id, currentAdjustment + balanceAdjustment);
      }
    }

    // Apply account balance updates
    const accountUpdatePromises = Array.from(accountUpdates.entries()).map(async ([accountId, adjustment]) => {
      try {
        const account = await selectManualAccountById(accountId, userId);
        if (account) {
          const newBalance = account.current_balance + adjustment;
          await updateAccountBalance(accountId, userId, newBalance);
        }
      } catch (error) {
        console.warn(`Could not update account ${accountId} balance:`, error);
      }
    });

    await Promise.all(accountUpdatePromises);

    // Log audit event
    await auditLogger.transactionBulkDeleted(
      userId, 
      transactionsToDelete.map(t => t.id), 
      transactionsToDelete.length
    );

    return NextResponse.json({
      deletedCount: transactionsToDelete.length,
      transactionIds: transactionsToDelete.map(t => t.id),
      message: "Transactions deleted successfully",
    });
  } catch (error) {
    console.error("Error in bulk delete:", error);
    
    return NextResponse.json(
      { error: "Failed to delete transactions" },
      { status: 500 }
    );
  }
}