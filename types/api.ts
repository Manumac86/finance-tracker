// API response types for consistent typing across the application

// Import UI types for reference
import type { UIGoal } from "@/lib/db/schemas/goal";
import type { UIBudget } from "@/lib/db/schemas/budget";
import type { UITransaction } from "@/lib/db/schemas/transaction";
import type { UICategory } from "@/lib/db/schemas/category";

export interface BaseApiResponse {
  success: boolean;
  message?: string;
}

export interface ErrorApiResponse extends BaseApiResponse {
  success: false;
  error: string;
  details?: string;
}

export interface SuccessApiResponse<T> extends BaseApiResponse {
  success: true;
  data?: T;
}

export interface ListApiResponse<T> extends SuccessApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Goal-specific API responses
export interface GoalApiResponse extends SuccessApiResponse<UIGoal> {}
export interface GoalsListApiResponse extends ListApiResponse<UIGoal[]> {}

// Budget-specific API responses
export interface BudgetApiResponse extends SuccessApiResponse<UIBudget> {}
export interface BudgetsListApiResponse extends ListApiResponse<UIBudget[]> {}

// Transaction-specific API responses
export interface TransactionApiResponse extends SuccessApiResponse<UITransaction> {}
export interface TransactionsListApiResponse extends ListApiResponse<UITransaction[]> {}

// Category-specific API responses
export interface CategoryApiResponse extends SuccessApiResponse<UICategory> {}
export interface CategoriesListApiResponse extends ListApiResponse<UICategory[]> {}