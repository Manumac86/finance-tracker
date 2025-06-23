// Context provider types for state management

import type { ReactNode } from "react";
import type { UIGoal } from "@/lib/db/schemas/goal";
import type { UIBudget } from "@/lib/db/schemas/budget";
import type { UITransaction } from "@/lib/db/schemas/transaction";
import type { UICategory } from "@/lib/db/schemas/category";

// Base context interface
export interface BaseContextInterface<T> {
  data: T[] | null;
  error: Error | null;
  isLoading: boolean;
  mutate: () => void;
}

// Provider props interface
export interface BaseProviderProps {
  children: ReactNode;
}

// Goals context
export interface GoalsContextInterface extends BaseContextInterface<UIGoal> {
  createGoal: (goalData: Record<string, unknown>) => Promise<void>;
  updateGoal: (goalId: string, updateData: Record<string, unknown>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
}

export interface GoalsProviderProps extends BaseProviderProps {}

// Budgets context
export interface BudgetsContextInterface extends BaseContextInterface<UIBudget> {
  createBudget: (budgetData: Record<string, unknown>) => Promise<void>;
  updateBudget: (budgetId: string, updateData: Record<string, unknown>) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  getBudgetAnalysis: (budgetId: string) => Promise<BudgetAnalysis | null>;
}

export interface BudgetsProviderProps extends BaseProviderProps {}

// Transactions context
export interface TransactionsContextInterface extends BaseContextInterface<UITransaction> {
  createTransaction: (transactionData: Record<string, unknown>) => Promise<void>;
  updateTransaction: (transactionId: string, updateData: Record<string, unknown>) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  refreshTransactions: () => void;
}

export interface TransactionsProviderProps extends BaseProviderProps {}

// Categories context
export interface CategoriesContextInterface extends BaseContextInterface<UICategory> {
  createCategory: (categoryData: Record<string, unknown>) => Promise<void>;
  updateCategory: (categoryId: string, updateData: Record<string, unknown>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
}

export interface CategoriesProviderProps extends BaseProviderProps {}

// Budget analysis interface (imported from services)
export interface BudgetAnalysis {
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  isExceeded: boolean;
  daysRemaining: number;
  dailySpendingRate: number;
  projectedSpending: number;
}