import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { selectGoals, insertGoal } from "@/lib/db/postgres";
import { 
  cacheUserGoals, 
  getCachedUserGoals, 
  invalidateUserGoalsCache 
} from "@/lib/db/redis";
import { 
  CreateGoalSchema, 
  transformGoalToUI
} from "@/lib/db/schemas/goal";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    // Check cache first (only for non-filtered requests)
    if (!type) {
      const cachedGoals = await getCachedUserGoals(userId);
      if (cachedGoals) {
        return NextResponse.json({ goals: cachedGoals });
      }
    }

    // Fetch from database
    const goals = await selectGoals(userId, type || undefined);

    // Transform to UI format with enriched data
    const enrichedGoals = goals.map(transformGoalToUI);

    // Cache the results (only for non-filtered requests)
    if (!type) {
      await cacheUserGoals(userId, enrichedGoals);
    }

    return NextResponse.json({ goals: enrichedGoals });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
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
    
    // Validate the goal data
    const validationResult = CreateGoalSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const goalData = validationResult.data;

    // Prepare data for insertion
    const insertData = {
      user_id: userId,
      name: goalData.name,
      description: goalData.description || null,
      type: goalData.type,
      target_amount: goalData.target_amount,
      current_amount: goalData.current_amount || 0,
      target_date: goalData.target_date || null,
      category_id: goalData.category_id || null,
      period: goalData.period || null,
      metadata: goalData.metadata || {},
    };

    // Insert goal using Supabase
    const createdGoal = await insertGoal(insertData);

    // Invalidate cache
    await invalidateUserGoalsCache(userId);

    // Transform to UI format with enriched data
    const enrichedGoal = transformGoalToUI(createdGoal);

    return NextResponse.json({ goal: enrichedGoal }, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}