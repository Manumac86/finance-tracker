import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { selectBudgets, insertBudget } from "@/lib/db/postgres";
import {
  cacheUserBudgets,
  getCachedUserBudgets,
  invalidateUserBudgetsCache,
} from "@/lib/db/redis";
import {
  CreateBudgetSchema,
  transformBudgetToUI,
} from "@/lib/db/schemas/budget";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");

    // Check cache first (only for non-filtered requests)
    if (!period) {
      const cachedBudgets = await getCachedUserBudgets(userId);
      if (cachedBudgets) {
        return NextResponse.json({ budgets: cachedBudgets });
      }
    }

    // Fetch from database
    const budgets = await selectBudgets(userId, period || undefined);

    // Transform to UI format with enriched data
    const enrichedBudgets = budgets.map(transformBudgetToUI);

    // Cache the results (only for non-filtered requests)
    if (!period) {
      await cacheUserBudgets(userId, enrichedBudgets);
    }

    return NextResponse.json({ budgets: enrichedBudgets });
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
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

    // Validate the budget data
    const validationResult = CreateBudgetSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const budgetData = validationResult.data;

    // Prepare data for insertion
    const insertData = {
      user_id: userId,
      name: budgetData.name,
      description: budgetData.description || null,
      // category_id: budgetData.category_id || null,
      budget_type: budgetData.budget_type,
      amount: budgetData.amount,
      period: budgetData.period,
      start_date: budgetData.start_date,
      end_date: budgetData.end_date || null,
      alert_threshold_percentage: budgetData.alert_threshold_percentage || 80,
      alert_enabled: budgetData.alert_enabled ?? true,
      overspend_alert_enabled: budgetData.overspend_alert_enabled ?? true,
      rollover_enabled: budgetData.rollover_enabled ?? false,
      rollover_type: budgetData.rollover_type || "none",
      metadata: budgetData.metadata || {},
    };

    // Insert budget using Supabase
    const createdBudget = await insertBudget(insertData);

    // Invalidate cache
    await invalidateUserBudgetsCache(userId);

    // Transform to UI format with enriched data
    const enrichedBudget = transformBudgetToUI(createdBudget);

    return NextResponse.json({ budget: enrichedBudget }, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    );
  }
}
