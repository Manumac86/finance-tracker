import { z } from "zod";

// Database schema (PostgreSQL snake_case)
export const recurringTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  transaction_type: z.enum(["income", "expense"]),
  category_id: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"]),
  start_date: z.string(),
  end_date: z.string().optional(),
  next_due_date: z.string(),
  is_bill: z.boolean().default(false),
  reminder_days_before: z.number().min(0).max(30).default(3),
  auto_create_transaction: z.boolean().default(true),
  is_active: z.boolean().default(true),
  last_processed_date: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type RecurringTransaction = z.infer<typeof recurringTransactionSchema>;

// UI schema (camelCase)
export interface UIRecurringTransaction {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  amount: number;
  transactionType: "income" | "expense";
  categoryId?: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  isBill: boolean;
  reminderDaysBefore: number;
  autoCreateTransaction: boolean;
  isActive: boolean;
  lastProcessedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Transform functions
export function transformRecurringTransactionToUI(
  transaction: RecurringTransaction
): UIRecurringTransaction {
  return {
    id: transaction.id,
    userId: transaction.user_id,
    name: transaction.name,
    description: transaction.description,
    amount: transaction.amount,
    transactionType: transaction.transaction_type,
    categoryId: transaction.category_id,
    frequency: transaction.frequency,
    startDate: transaction.start_date,
    endDate: transaction.end_date,
    nextDueDate: transaction.next_due_date,
    isBill: transaction.is_bill,
    reminderDaysBefore: transaction.reminder_days_before,
    autoCreateTransaction: transaction.auto_create_transaction,
    isActive: transaction.is_active,
    lastProcessedDate: transaction.last_processed_date,
    createdAt: transaction.created_at,
    updatedAt: transaction.updated_at,
  };
}

export function transformUIToRecurringTransaction(
  uiTransaction: Partial<UIRecurringTransaction>
): Partial<RecurringTransaction> {
  return {
    id: uiTransaction.id,
    user_id: uiTransaction.userId,
    name: uiTransaction.name,
    description: uiTransaction.description,
    amount: uiTransaction.amount,
    transaction_type: uiTransaction.transactionType,
    category_id: uiTransaction.categoryId,
    frequency: uiTransaction.frequency,
    start_date: uiTransaction.startDate,
    end_date: uiTransaction.endDate,
    next_due_date: uiTransaction.nextDueDate,
    is_bill: uiTransaction.isBill,
    reminder_days_before: uiTransaction.reminderDaysBefore,
    auto_create_transaction: uiTransaction.autoCreateTransaction,
    is_active: uiTransaction.isActive,
    last_processed_date: uiTransaction.lastProcessedDate,
  };
}