import { z } from "zod";

export const BudgetCategorySchema = z.object({
  id: z.string().uuid().optional(),
  budget_id: z.string().uuid(),
  category_id: z.string().uuid(),
  created_at: z.string().optional(),
});

export const CreateBudgetCategorySchema = BudgetCategorySchema.omit({
  id: true,
  created_at: true,
});

export type BudgetCategory = z.infer<typeof BudgetCategorySchema>;
export type CreateBudgetCategory = z.infer<typeof CreateBudgetCategorySchema>;

// UI-compatible type with camelCase properties
export interface UIBudgetCategory {
  id?: string;
  budgetId: string;
  categoryId: string;
  createdAt?: string;
}

// Transform database BudgetCategory to UI format
export function transformBudgetCategoryToUI(budgetCategory: BudgetCategory): UIBudgetCategory {
  return {
    id: budgetCategory.id,
    budgetId: budgetCategory.budget_id,
    categoryId: budgetCategory.category_id,
    createdAt: budgetCategory.created_at,
  };
}

// Transform UI format to database format
export function transformUIToBudgetCategory(uiBudgetCategory: Partial<UIBudgetCategory>): Partial<BudgetCategory> {
  return {
    id: uiBudgetCategory.id,
    budget_id: uiBudgetCategory.budgetId,
    category_id: uiBudgetCategory.categoryId,
    created_at: uiBudgetCategory.createdAt,
  };
}