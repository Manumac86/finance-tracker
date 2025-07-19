import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase, selectCategoryById } from "@/lib/db/postgres";
import { transformTransactionToUI, updateTransactionSchema } from "@/lib/db/schemas/transaction";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        categories (
          id,
          name,
          icon,
          color,
          category_type
        )
      `)
      .eq("id", id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();
    
    if (error || !data) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    
    // Merge category data if join was successful, otherwise use denormalized data
    const transactionData = {
      ...data,
      category_name: data.categories?.name || data.category_name,
      category_icon: data.categories?.icon || data.category_icon,
    };
    
    const transaction = transformTransactionToUI(transactionData);
    
    return NextResponse.json({ transaction });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = await params;
    
    // Validate input
    const validation = updateTransactionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Check if transaction exists and belongs to user, and get current values
    const { data: existing } = await supabase
      .from("transactions")
      .select("id, amount, account_id")
      .eq("id", id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();
    
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    
    // If category is being updated, verify it exists
    if (validation.data.categoryId) {
      try {
        const category = await selectCategoryById(validation.data.categoryId);
        if (!category) {
          return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
    }
    
    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (validation.data.amount !== undefined) {
      updateData.amount = validation.data.transactionType === 'expense' 
        ? -Math.abs(validation.data.amount) 
        : Math.abs(validation.data.amount);
    }
    
    if (validation.data.transactionType !== undefined) {
      updateData.transaction_type = validation.data.transactionType;
      // If changing type, recalculate amount sign
      if (validation.data.amount !== undefined) {
        updateData.amount = validation.data.transactionType === 'expense' 
          ? -Math.abs(validation.data.amount) 
          : Math.abs(validation.data.amount);
      }
    }
    
    if (validation.data.name !== undefined) {
      updateData.name = validation.data.name;
    }
    
    if (validation.data.description !== undefined) {
      updateData.description = validation.data.description || null;
    }
    
    if (validation.data.categoryId !== undefined) {
      updateData.category_id = validation.data.categoryId;
      
      // Update category name and icon
      try {
        const category = await selectCategoryById(validation.data.categoryId);
        if (category) {
          updateData.category_name = category.name;
          updateData.category_icon = category.icon;
        }
      } catch {
        console.warn("Could not fetch category info");
      }
    }
    
    if (validation.data.transactionDate !== undefined) {
      updateData.transaction_date = validation.data.transactionDate;
    }

    if (validation.data.accountId !== undefined) {
      if (validation.data.accountId) {
        // Verify account exists and belongs to user
        const { data: account, error: accountError } = await supabase
          .from("manual_accounts")
          .select("id, name, color")
          .eq("id", validation.data.accountId)
          .eq("user_id", userId)
          .single();

        if (accountError || !account) {
          return NextResponse.json({ error: "Invalid account" }, { status: 400 });
        }

        updateData.account_id = validation.data.accountId;
        updateData.account_name = account.name;
        updateData.account_color = account.color;
      } else {
        // Remove account assignment
        updateData.account_id = null;
        updateData.account_name = null;
        updateData.account_color = null;
      }
    }
    
    // Update the transaction
    const { data: updated, error } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*")
      .single();
    
    if (error) {
      console.error("Error updating transaction:", error);
      return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
    }

    // Update account balances if account assignment changed
    const oldAccountId = existing.account_id;
    const newAccountId = updated.account_id;

    // Function to recalculate account balance from all transactions
    const recalculateAccountBalance = async (accountId: string) => {
      // Get sum of all active transactions assigned to this account
      const { data: transactionSum } = await supabase
        .from("transactions")
        .select("amount")
        .eq("account_id", accountId)
        .eq("user_id", userId)
        .eq("is_active", true);

      const totalFromTransactions = transactionSum?.reduce((sum, t) => sum + t.amount, 0) || 0;

      // Update the account balance to reflect the actual sum
      await supabase
        .from("manual_accounts")
        .update({
          balance: totalFromTransactions,
          updated_at: new Date().toISOString()
        })
        .eq("id", accountId)
        .eq("user_id", userId);
    };

    // If account assignment changed, recalculate balances for affected accounts
    if (oldAccountId !== newAccountId) {
      if (oldAccountId) {
        await recalculateAccountBalance(oldAccountId);
      }
      if (newAccountId) {
        await recalculateAccountBalance(newAccountId);
      }
    } else if (oldAccountId && existing.amount !== updated.amount) {
      // Same account but amount changed, recalculate
      await recalculateAccountBalance(oldAccountId);
    }
    
    // The category_name and category_icon are already denormalized in the table
    const updatedTransaction = transformTransactionToUI(updated);
    
    return NextResponse.json({ 
      transaction: updatedTransaction,
      message: "Transaction updated successfully" 
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // Get transaction data before deleting to update account balance
    const { data: transactionToDelete } = await supabase
      .from("transactions")
      .select("amount, account_id")
      .eq("id", id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();
    
    // Soft delete the transaction
    const { data, error } = await supabase
      .from("transactions")
      .update({ 
        is_active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .select("id")
      .single();
    
    if (error || !data) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Recalculate account balance if transaction had an account assigned
    if (transactionToDelete?.account_id) {
      // Get sum of all remaining active transactions assigned to this account
      const { data: transactionSum } = await supabase
        .from("transactions")
        .select("amount")
        .eq("account_id", transactionToDelete.account_id)
        .eq("user_id", userId)
        .eq("is_active", true);

      const totalFromTransactions = transactionSum?.reduce((sum, t) => sum + t.amount, 0) || 0;

      // Update the account balance to reflect the actual sum
      await supabase
        .from("manual_accounts")
        .update({
          balance: totalFromTransactions,
          updated_at: new Date().toISOString()
        })
        .eq("id", transactionToDelete.account_id)
        .eq("user_id", userId);
    }
    
    return NextResponse.json({ 
      message: "Transaction deleted successfully",
      id: id
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}