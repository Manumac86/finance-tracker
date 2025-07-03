import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateBudget, deleteBudget } from "@/lib/db/postgres";
import { 
  cacheBudgetDetail, 
  getCachedBudgetDetail, 
  invalidateBudgetCache 
} from "@/lib/db/redis";
import { supabase } from "@/lib/db/postgres";
import {
  UpdateBudgetSchema,
  transformBudgetToUI
} from "@/lib/db/schemas/budget";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;

    // Check cache first
    const cachedBudget = await getCachedBudgetDetail(resolvedParams.id);
    if (cachedBudget) {
      return NextResponse.json({ budget: cachedBudget });
    }

    // Fetch from database
    const { data: budget, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    // Transform to UI format with enriched data
    const enrichedBudget = transformBudgetToUI(budget);

    // Cache the result
    await cacheBudgetDetail(resolvedParams.id, enrichedBudget);

    return NextResponse.json({ budget: enrichedBudget });
  } catch (error) {
    console.error("Error fetching budget:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget" },
      { status: 500 }
    );
  }
}

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

    // Validate the update data
    const validationResult = UpdateBudgetSchema.safeParse(body);
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

    // Prepare update data (transform camelCase to snake_case)
    const updatePayload = {
      name: updateData.name,
      description: updateData.description,
      category_id: updateData.category_id,
      budget_type: updateData.budget_type,
      amount: updateData.amount,
      period: updateData.period,
      start_date: updateData.start_date,
      end_date: updateData.end_date === "" || updateData.end_date === undefined ? null : updateData.end_date,
      alert_threshold_percentage: updateData.alert_threshold_percentage,
      alert_enabled: updateData.alert_enabled,
      overspend_alert_enabled: updateData.overspend_alert_enabled,
      rollover_enabled: updateData.rollover_enabled,
      rollover_type: updateData.rollover_type,
      metadata: updateData.metadata,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key as keyof typeof updatePayload] === undefined) {
        delete updatePayload[key as keyof typeof updatePayload];
      }
    });

    // Update the budget using helper function
    const updatedBudget = await updateBudget(resolvedParams.id, userId, updatePayload);

    // Invalidate caches
    await invalidateBudgetCache(resolvedParams.id, userId);

    // Transform to UI format with enriched data
    const enrichedBudget = transformBudgetToUI(updatedBudget);

    // Cache the updated budget
    await cacheBudgetDetail(resolvedParams.id, enrichedBudget);

    return NextResponse.json({ budget: enrichedBudget });
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { error: "Failed to update budget" },
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

    // Soft delete using helper function
    const success = await deleteBudget(resolvedParams.id, userId);

    if (!success) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    // Invalidate caches
    await invalidateBudgetCache(resolvedParams.id, userId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json(
      { error: "Failed to delete budget" },
      { status: 500 }
    );
  }
}