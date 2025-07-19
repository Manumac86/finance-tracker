import { selectTransactions, updateBudget } from "@/lib/db/postgres";
import { CustomBudgetRules, evaluateCustomBudgetRules } from "@/lib/types/custom-budget-rules";
import { UIBudget } from "@/lib/db/schemas/budget";

/**
 * Calculate current spending for a custom budget based on its rules
 */
export async function calculateCustomBudgetSpending(
  budget: UIBudget,
  userId: string
): Promise<number> {
  if (budget.budgetType !== "custom") {
    throw new Error("This function is only for custom budgets");
  }

  // Get custom rules from metadata
  const customRules = budget.metadata?.customRules as CustomBudgetRules;
  if (!customRules || !customRules.rules || customRules.rules.length === 0) {
    return 0; // No rules means no spending
  }

  // Get all user transactions
  const transactions = await selectTransactions(userId, 10000); // Get a large number to ensure we get all

  // Filter transactions based on budget period
  const startDate = new Date(budget.startDate);
  const endDate = budget.endDate 
    ? new Date(budget.endDate) 
    : calculatePeriodEndDate(startDate, budget.period);

  const periodTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.transactionDate);
    const isInPeriod = transactionDate >= startDate && transactionDate <= endDate;
    const isExpense = transaction.transactionType === 'expense';
    return isInPeriod && isExpense;
  });

  // Filter transactions that match custom rules
  const matchingTransactions = periodTransactions.filter(transaction => {
    try {
      return evaluateCustomBudgetRules(customRules, {
        amount: transaction.amount,
        name: transaction.name,
        description: transaction.description,
        categoryId: transaction.categoryId,
        transactionDate: transaction.transactionDate,
        accountId: transaction.accountId,
        accountName: transaction.accountName,
      });
    } catch (error) {
      console.warn('Error evaluating custom budget rule:', error);
      return false;
    }
  });

  // Calculate total spending
  const totalSpent = matchingTransactions.reduce((sum, transaction) => {
    return sum + Math.abs(transaction.amount);
  }, 0);

  return totalSpent;
}

/**
 * Helper function to calculate period end date - copied from budget schema
 */
function calculatePeriodEndDate(
  startDate: Date,
  period: "weekly" | "monthly" | "quarterly" | "yearly"
): Date {
  const endDate = new Date(startDate);

  switch (period) {
    case "weekly":
      endDate.setDate(startDate.getDate() + 6);
      break;
    case "monthly":
      endDate.setMonth(startDate.getMonth() + 1);
      endDate.setDate(endDate.getDate() - 1);
      break;
    case "quarterly":
      endDate.setMonth(startDate.getMonth() + 3);
      endDate.setDate(endDate.getDate() - 1);
      break;
    case "yearly":
      endDate.setFullYear(startDate.getFullYear() + 1);
      endDate.setDate(endDate.getDate() - 1);
      break;
  }

  return endDate;
}

/**
 * Update the current_spent value for a custom budget in the database
 */
export async function updateCustomBudgetSpending(
  budgetId: string,
  userId: string,
  newSpentAmount: number
): Promise<void> {
  await updateBudget(budgetId, userId, {
    current_spent: newSpentAmount,
    last_calculated_at: new Date().toISOString(),
  });
}