import { z } from "zod";

// PostgreSQL transaction schema (snake_case for database)
export const transactionDbSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().min(1),
  amount: z.number(),
  transaction_type: z.enum(['income', 'expense']),
  name: z.string().min(1, "Transaction name is required"),
  description: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  category_name: z.string().min(1),
  category_icon: z.string().min(1),
  account_id: z.string().uuid().optional(), // Account the transaction affects
  account_name: z.string().optional(), // Denormalized for performance
  account_color: z.string().optional(), // Denormalized for performance
  transaction_date: z.string().datetime(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  is_active: z.boolean().default(true),
});

// UI transaction schema (camelCase for frontend)
export const transactionUISchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  amount: z.number(),
  transactionType: z.enum(['income', 'expense']),
  name: z.string().min(1, "Transaction name is required"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  categoryName: z.string().min(1),
  categoryIcon: z.string().min(1),
  accountId: z.string().uuid().optional(), // Account the transaction affects
  accountName: z.string().optional(), // Denormalized for performance
  accountColor: z.string().optional(), // Denormalized for performance
  transactionDate: z.string().datetime(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

// API input schema for creating transactions
export const createTransactionSchema = z.object({
  amount: z.number().refine((val) => val !== 0, "Amount cannot be zero"),
  transactionType: z.enum(['income', 'expense']),
  name: z.string().min(1, "Transaction name is required"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  accountId: z.string().uuid().optional(), // Optional account assignment
  transactionDate: z.string().datetime().optional(),
});

// API input schema for updating transactions
export const updateTransactionSchema = z.object({
  amount: z.number().refine((val) => val !== 0, "Amount cannot be zero").optional(),
  transactionType: z.enum(['income', 'expense']).optional(),
  name: z.string().min(1, "Transaction name is required").optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required").optional(),
  accountId: z.string().uuid().optional(), // Optional account assignment
  transactionDate: z.string().datetime().optional(),
});

// Types
export type Transaction = z.infer<typeof transactionDbSchema>;
export type UITransaction = z.infer<typeof transactionUISchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;

// Transform functions between DB and UI formats
export function transformTransactionToUI(transaction: Transaction): UITransaction {
  return {
    id: transaction.id,
    userId: transaction.user_id,
    amount: transaction.amount,
    transactionType: transaction.transaction_type,
    name: transaction.name,
    description: transaction.description,
    categoryId: transaction.category_id,
    categoryName: transaction.category_name,
    categoryIcon: transaction.category_icon,
    accountId: transaction.account_id,
    accountName: transaction.account_name,
    accountColor: transaction.account_color,
    transactionDate: transaction.transaction_date,
    createdAt: transaction.created_at,
    updatedAt: transaction.updated_at,
    isActive: transaction.is_active,
  };
}

export function transformTransactionToDB(transaction: Partial<UITransaction>): Partial<Transaction> {
  return {
    id: transaction.id,
    user_id: transaction.userId,
    amount: transaction.amount,
    transaction_type: transaction.transactionType,
    name: transaction.name,
    description: transaction.description,
    category_id: transaction.categoryId,
    category_name: transaction.categoryName,
    category_icon: transaction.categoryIcon,
    account_id: transaction.accountId,
    account_name: transaction.accountName,
    account_color: transaction.accountColor,
    transaction_date: transaction.transactionDate,
    created_at: transaction.createdAt,
    updated_at: transaction.updatedAt,
    is_active: transaction.isActive,
  };
}