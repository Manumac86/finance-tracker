import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/db/postgres";
import { validateBulkEdit, prepareBulkEditPayload } from "@/lib/services/transaction-search";

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transactionIds, updates } = body;

    // Validate the bulk edit request
    const validation = validateBulkEdit(transactionIds, updates);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Prepare the payload for database update
    const payload = prepareBulkEditPayload(transactionIds, updates);

    // Perform bulk update in database
    const { error } = await supabase
      .from("transactions")
      .update(payload.updates)
      .in("id", transactionIds)
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update transactions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      updatedCount: transactionIds.length,
      transactionIds,
      message: "Transactions updated successfully",
    });
  } catch (error) {
    console.error("Error updating transactions:", error);
    
    return NextResponse.json(
      { error: "Failed to update transactions" },
      { status: 500 }
    );
  }
}