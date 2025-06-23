import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateGoal, deleteGoal } from "@/lib/db/postgres";
import { 
  cacheGoalDetail, 
  getCachedGoalDetail, 
  invalidateGoalCache 
} from "@/lib/db/redis";
import { supabase } from "@/lib/db/postgres";
import {
  UpdateGoalSchema,
  transformGoalToUI,
  isGoalAchieved
} from "@/lib/db/schemas/goal";

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
    const cachedGoal = await getCachedGoalDetail(resolvedParams.id);
    if (cachedGoal) {
      return NextResponse.json({ goal: cachedGoal });
    }

    // Fetch from database
    const { data: goal, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Transform to UI format with enriched data
    const enrichedGoal = transformGoalToUI(goal);

    // Cache the result
    await cacheGoalDetail(resolvedParams.id, enrichedGoal);

    return NextResponse.json({ goal: enrichedGoal });
  } catch (error) {
    console.error("Error fetching goal:", error);
    return NextResponse.json(
      { error: "Failed to fetch goal" },
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
    const validationResult = UpdateGoalSchema.safeParse(body);
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

    // Get current goal to check achievement status
    const { data: currentGoal, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', resolvedParams.id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (fetchError || !currentGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Check if goal was just achieved
    const wasAchieved = isGoalAchieved(currentGoal);
    
    // Prepare update data
    const updatePayload = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    // Update the goal using helper function
    const updatedGoal = await updateGoal(resolvedParams.id, userId, updatePayload);

    const isNowAchieved = isGoalAchieved(updatedGoal);
    const justAchieved = !wasAchieved && isNowAchieved;

    // If goal was just achieved, mark it
    if (justAchieved) {
      await updateGoal(resolvedParams.id, userId, { 
        achieved_at: new Date().toISOString() 
      });
      updatedGoal.achieved_at = new Date().toISOString();
    }

    // Invalidate caches
    await invalidateGoalCache(resolvedParams.id, userId);

    // Transform to UI format with enriched data
    const enrichedGoal = transformGoalToUI(updatedGoal);

    // Cache the updated goal
    await cacheGoalDetail(resolvedParams.id, enrichedGoal);

    const response = { goal: enrichedGoal, celebration: false };
    if (justAchieved) {
      response.celebration = true;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
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
    const success = await deleteGoal(resolvedParams.id, userId);

    if (!success) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Invalidate caches
    await invalidateGoalCache(resolvedParams.id, userId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
