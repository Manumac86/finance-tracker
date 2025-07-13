import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  selectBudgets,
  insertBudgetWithCategories,
  getBudgetCategories,
} from "@/lib/db/postgres";
import {
  cacheUserBudgets,
  getCachedUserBudgets,
  invalidateUserBudgetsCache,
} from "@/lib/db/redis";
import {
  CreateBudgetSchema,
  transformBudgetToUI,
} from "@/lib/db/schemas/budget";
import { calculateCustomBudgetSpending, updateCustomBudgetSpending } from "@/lib/services/custom-budget-calculator";

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

    // Fetch from database with categories
    const budgets = await selectBudgets(userId, period || undefined);

    // Transform to UI format with enriched data and populate category IDs
    const enrichedBudgets = await Promise.all(
      budgets.map(async (budget) => {
        const uiBudget = transformBudgetToUI(budget);
        // Get category IDs from budget_categories junction table
        const budgetCategories = await getBudgetCategories(budget.id);
        uiBudget.categoryIds = budgetCategories.map((bc) => bc.category_id);
        
        // Recalculate spending for custom budgets to ensure accuracy
        if (budget.budget_type === "custom") {
          try {
            const currentSpent = await calculateCustomBudgetSpending(uiBudget, userId);
            
            // Update database if spending has changed significantly (more than $0.01 difference)
            if (Math.abs(currentSpent - budget.current_spent) > 0.01) {
              await updateCustomBudgetSpending(budget.id, userId, currentSpent);
              uiBudget.currentSpent = currentSpent;
              uiBudget.percentageUsed = budget.amount > 0 ? (currentSpent / budget.amount) * 100 : 0;
              uiBudget.remaining = budget.amount - currentSpent;
            }
          } catch (error) {
            console.warn("Error recalculating custom budget spending:", error);
          }
        }
        
        return uiBudget;
      })
    );

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

    // Extract category IDs from the request
    const categoryIds = budgetData.categoryIds || [];

    // Validate category requirements for category budgets
    if (budgetData.budget_type === "category" && categoryIds.length === 0) {
      return NextResponse.json(
        { error: "At least one category is required for category budgets" },
        { status: 400 }
      );
    }

    // Prepare data for insertion
    const insertData = {
      user_id: userId,
      name: budgetData.name,
      description: budgetData.description || null,
      // category_id removed - handled through budget_categories junction table
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

    // Insert budget with categories using new multi-category function
    const createdBudget = await insertBudgetWithCategories(
      insertData,
      categoryIds
    );

    // Calculate and update spending for custom budgets
    if (budgetData.budget_type === "custom") {
      try {
        console.log("Calculating custom budget spending for:", createdBudget.id);
        const uiBudgetForCalculation = transformBudgetToUI(createdBudget);
        uiBudgetForCalculation.categoryIds = categoryIds;
        
        const currentSpent = await calculateCustomBudgetSpending(uiBudgetForCalculation, userId);
        console.log("Calculated spending:", currentSpent);
        
        await updateCustomBudgetSpending(createdBudget.id, userId, currentSpent);
        
        // Update the created budget object with the calculated spending
        createdBudget.current_spent = currentSpent;
        createdBudget.last_calculated_at = new Date().toISOString();
      } catch (error) {
        console.error("Error calculating custom budget spending:", error);
        // Don't fail budget creation if calculation fails
      }
    }

    // Invalidate cache
    await invalidateUserBudgetsCache(userId);

    // Transform to UI format with enriched data and category IDs
    const enrichedBudget = transformBudgetToUI(createdBudget);
    enrichedBudget.categoryIds = categoryIds;

    return NextResponse.json({ budget: enrichedBudget }, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    );
  }
}
