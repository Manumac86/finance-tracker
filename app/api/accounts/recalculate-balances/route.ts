import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/db/postgres";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, let's check what accounts tables exist and have data
    console.log("Checking for accounts for user:", userId);
    
    // Check manual_accounts
    const { data: manualAccounts, error: manualError } = await supabase
      .from("manual_accounts")
      .select("id, name")
      .eq("user_id", userId);
    
    console.log("Manual accounts:", { manualAccounts, manualError });

    // Check bank_accounts  
    const { data: bankAccounts, error: bankError } = await supabase
      .from("bank_accounts")
      .select("id, account_name")
      .eq("user_id", userId);
    
    console.log("Bank accounts:", { bankAccounts, bankError });

    if (manualError && bankError) {
      throw new Error("Could not access accounts tables");
    }

    let updatedCount = 0;
    const accounts = manualAccounts || [];

    // Also check what transactions have account_id assigned
    const { data: transactionsWithAccounts } = await supabase
      .from("transactions")
      .select("id, amount, account_id, account_name")
      .eq("user_id", userId)
      .eq("is_active", true)
      .not("account_id", "is", null);
    
    console.log("Transactions with accounts:", transactionsWithAccounts);

    // Recalculate balance for each account
    for (const account of accounts || []) {
      console.log("Processing account:", account);
      
      // Get sum of all active transactions assigned to this account
      const { data: transactionSum } = await supabase
        .from("transactions")
        .select("amount")
        .eq("account_id", account.id)
        .eq("user_id", userId)
        .eq("is_active", true);

      console.log(`Transactions for account ${account.id}:`, transactionSum);
      const totalFromTransactions = transactionSum?.reduce((sum, t) => sum + t.amount, 0) || 0;
      console.log(`Total calculated for account ${account.id}:`, totalFromTransactions);

      // Update the account balance
      const { error: updateError } = await supabase
        .from("manual_accounts")
        .update({
          current_balance: totalFromTransactions,
          updated_at: new Date().toISOString()
        })
        .eq("id", account.id)
        .eq("user_id", userId);

      if (!updateError) {
        updatedCount++;
        console.log(`Successfully updated account ${account.id} with balance ${totalFromTransactions}`);
      } else {
        console.error(`Error updating account ${account.id}:`, updateError);
      }
    }

    return NextResponse.json({ 
      message: "Account balances recalculated successfully",
      updatedAccounts: updatedCount
    });
  } catch (error) {
    console.error("Error recalculating account balances:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}