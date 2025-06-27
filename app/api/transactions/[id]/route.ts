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
        categories!inner(name, icon)
      `)
      .eq("id", id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();
    
    if (error || !data) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    
    // Transform the data to match our schema
    const transactionData = {
      ...data,
      category_name: data.categories.name,
      category_icon: data.categories.icon,
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

    // Check if transaction exists and belongs to user
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
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
    
    // Update the transaction
    const { data: updated, error } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select(`
        *,
        categories!inner(name, icon)
      `)
      .single();
    
    if (error) {
      console.error("Error updating transaction:", error);
      return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
    }
    
    // Transform the data to match our schema
    const transactionData = {
      ...updated,
      category_name: updated.categories?.name || updated.category_name,
      category_icon: updated.categories?.icon || updated.category_icon,
    };
    
    const updatedTransaction = transformTransactionToUI(transactionData);
    
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
    
    return NextResponse.json({ 
      message: "Transaction deleted successfully",
      id: id
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}