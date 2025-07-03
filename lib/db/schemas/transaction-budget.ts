import { z } from "zod";

// PostgreSQL transaction-budget relationship schema (snake_case for database)
export const transactionBudgetDbSchema = z.object({
  id: z.string().uuid().optional(),
  transaction_id: z.string().uuid(),
  budget_id: z.string().uuid(),
  assigned_amount: z.number().positive("Assigned amount must be positive"),
  assigned_percentage: z.number().min(0).max(100).optional(), // percentage of transaction amount
  notes: z.string().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// UI transaction-budget relationship schema (camelCase for frontend)
export const transactionBudgetUISchema = z.object({
  id: z.string().optional(),
  transactionId: z.string().uuid(),
  budgetId: z.string().uuid(),
  assignedAmount: z.number().positive("Assigned amount must be positive"),
  assignedPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Base schema for transaction-budget assignments
const baseTransactionBudgetSchema = z.object({
  transactionId: z.string().uuid(),
  budgetId: z.string().uuid(),
  assignedAmount: z.number().positive("Assigned amount must be positive").optional(),
  assignedPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
});

// API input schema for creating transaction-budget assignments
export const createTransactionBudgetSchema = baseTransactionBudgetSchema.refine(
  (data) => data.assignedAmount !== undefined || data.assignedPercentage !== undefined,
  {
    message: "Either assignedAmount or assignedPercentage must be provided",
    path: ["assignedAmount"],
  }
);

// API input schema for updating transaction-budget assignments
export const updateTransactionBudgetSchema = baseTransactionBudgetSchema.partial();

// Types
export type TransactionBudget = z.infer<typeof transactionBudgetDbSchema>;
export type UITransactionBudget = z.infer<typeof transactionBudgetUISchema>;
export type CreateTransactionBudgetInput = z.infer<typeof createTransactionBudgetSchema>;

// Enhanced transaction type with budget assignments
export interface TransactionWithBudgets {
  id: string;
  userId: string;
  amount: number;
  transactionType: "income" | "expense";
  name: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  transactionDate: string;
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
  budgetAssignments?: UITransactionBudget[];
}

// Transform functions between DB and UI formats
export function transformTransactionBudgetToUI(tb: TransactionBudget): UITransactionBudget {
  return {
    id: tb.id,
    transactionId: tb.transaction_id,
    budgetId: tb.budget_id,
    assignedAmount: tb.assigned_amount,
    assignedPercentage: tb.assigned_percentage,
    notes: tb.notes,
    createdAt: tb.created_at,
    updatedAt: tb.updated_at,
  };
}

export function transformTransactionBudgetToDB(tb: Partial<UITransactionBudget>): Partial<TransactionBudget> {
  return {
    id: tb.id,
    transaction_id: tb.transactionId,
    budget_id: tb.budgetId,
    assigned_amount: tb.assignedAmount,
    assigned_percentage: tb.assignedPercentage,
    notes: tb.notes,
    created_at: tb.createdAt,
    updated_at: tb.updatedAt,
  };
}