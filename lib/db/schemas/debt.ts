import { z } from "zod";

// Debt type enumeration
export const DebtTypeEnum = z.enum([
  "credit_card",
  "loan", 
  "mortgage",
  "student_loan",
  "other"
]);

// Payment type enumeration
export const PaymentTypeEnum = z.enum([
  "minimum",
  "extra", 
  "payoff",
  "regular"
]);

// Strategy type enumeration
export const StrategyTypeEnum = z.enum([
  "avalanche",
  "snowball",
  "custom"
]);

// Base debt schema
export const DebtSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  name: z.string().min(1, "Debt name is required").max(100, "Name too long"),
  debt_type: DebtTypeEnum,
  original_amount: z.number().positive("Original amount must be positive"),
  current_balance: z.number().min(0, "Balance cannot be negative"),
  interest_rate: z.number().min(0).max(100).nullable(),
  minimum_payment: z.number().min(0).nullable(),
  payment_day: z.number().min(1).max(31).nullable(),
  due_date: z.string().nullable(), // ISO date string
  account_id: z.string().uuid().nullable(),
  lender_name: z.string().max(100).nullable(),
  account_number: z.string().max(50).nullable(),
  notes: z.string().max(500).nullable(),
  is_active: z.boolean().default(true),
  created_at: z.string(), // ISO timestamp
  updated_at: z.string(), // ISO timestamp
});

// Create debt schema (without generated fields)
export const CreateDebtSchema = z.object({
  name: z.string().min(1, "Debt name is required").max(100, "Name too long"),
  debt_type: DebtTypeEnum,
  original_amount: z.number().positive("Original amount must be positive"),
  current_balance: z.number().min(0, "Balance cannot be negative"),
  interest_rate: z.number().min(0).max(100).nullable().optional(),
  minimum_payment: z.number().min(0).nullable().optional(),
  payment_day: z.number().min(1).max(31).nullable().optional(),
  due_date: z.string().nullable().optional(), // ISO date string
  account_id: z.string().uuid().nullable().optional(),
  lender_name: z.string().max(100).nullable().optional(),
  account_number: z.string().max(50).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  is_active: z.boolean().default(true).optional(),
});

// Update debt schema
export const UpdateDebtSchema = CreateDebtSchema.partial().extend({
  id: z.string().uuid(),
});

// Debt payment schema
export const DebtPaymentSchema = z.object({
  id: z.string().uuid(),
  debt_id: z.string().uuid(),
  user_id: z.string(),
  payment_date: z.string(), // ISO date string
  amount: z.number().positive("Payment amount must be positive"),
  principal_amount: z.number().min(0).default(0),
  interest_amount: z.number().min(0).default(0),
  balance_after: z.number().min(0).nullable(),
  payment_type: PaymentTypeEnum.nullable(),
  transaction_id: z.string().uuid().nullable(),
  notes: z.string().max(500).nullable(),
  created_at: z.string(), // ISO timestamp
});

// Base debt payment schema without validation
const BaseDebtPaymentSchema = z.object({
  debt_id: z.string().uuid(),
  payment_date: z.string(), // ISO date string
  amount: z.number().positive("Payment amount must be positive"),
  principal_amount: z.number().min(0).default(0),
  interest_amount: z.number().min(0).default(0),
  balance_after: z.number().min(0).nullable().optional(),
  payment_type: PaymentTypeEnum.default("regular"),
  transaction_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

// Create debt payment schema with validation
export const CreateDebtPaymentSchema = BaseDebtPaymentSchema.refine((data) => {
  // Ensure principal + interest equals total amount
  return data.principal_amount + data.interest_amount === data.amount;
}, {
  message: "Principal and interest amounts must equal total payment amount",
  path: ["amount"]
});

// Update debt payment schema
export const UpdateDebtPaymentSchema = BaseDebtPaymentSchema.extend({
  id: z.string().uuid(),
}).partial().omit({ id: true }).extend({
  id: z.string().uuid(),
});

// Debt payoff strategy schema
export const DebtPayoffStrategySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  name: z.string().min(1, "Strategy name is required").max(100, "Name too long"),
  strategy_type: StrategyTypeEnum,
  target_date: z.string().nullable(), // ISO date string
  extra_payment_amount: z.number().min(0).default(0),
  debt_order: z.array(z.string().uuid()).nullable(), // Array of debt IDs
  is_active: z.boolean().default(true),
  created_at: z.string(), // ISO timestamp
  updated_at: z.string(), // ISO timestamp
});

// Create debt payoff strategy schema
export const CreateDebtPayoffStrategySchema = z.object({
  name: z.string().min(1, "Strategy name is required").max(100, "Name too long"),
  strategy_type: StrategyTypeEnum,
  target_date: z.string().nullable().optional(), // ISO date string
  extra_payment_amount: z.number().min(0).default(0),
  debt_order: z.array(z.string().uuid()).nullable().optional(),
  is_active: z.boolean().default(true).optional(),
});

// Update debt payoff strategy schema
export const UpdateDebtPayoffStrategySchema = CreateDebtPayoffStrategySchema.partial().extend({
  id: z.string().uuid(),
});

// Debt summary schema
export const DebtSummarySchema = z.object({
  total_debt: z.number(),
  total_minimum_payments: z.number(),
  total_interest_rate: z.number(), // Weighted average
  active_debts_count: z.number(),
  monthly_interest_cost: z.number(),
  debt_to_income_ratio: z.number().nullable(),
  estimated_payoff_date: z.string().nullable(),
  total_interest_to_pay: z.number(),
});

// Debt with account info (for UI)
export const DebtWithAccountSchema = DebtSchema.extend({
  account: z.object({
    id: z.string().uuid(),
    name: z.string(),
    account_type: z.string(),
  }).nullable(),
  recent_payments: z.array(DebtPaymentSchema).optional(),
  next_payment_due: z.string().nullable(), // ISO date
  payoff_timeline: z.object({
    months_remaining: z.number(),
    total_interest: z.number(),
    payoff_date: z.string(),
  }).nullable(),
});

// Payoff calculation result
export const PayoffCalculationSchema = z.object({
  debt_id: z.string().uuid(),
  debt_name: z.string(),
  current_balance: z.number(),
  minimum_payment: z.number(),
  suggested_payment: z.number(),
  months_to_payoff: z.number(),
  total_interest: z.number(),
  payoff_date: z.string(),
  order_in_strategy: z.number(),
});

// Complete payoff strategy calculation
export const StrategyCalculationSchema = z.object({
  strategy_id: z.string().uuid(),
  total_months: z.number(),
  total_interest_saved: z.number(),
  total_payments: z.number(),
  completion_date: z.string(),
  debt_calculations: z.array(PayoffCalculationSchema),
  monthly_breakdown: z.array(z.object({
    month: z.number(),
    date: z.string(),
    total_payment: z.number(),
    remaining_balance: z.number(),
    debts_paid_off: z.array(z.string()),
  })),
});

// Simple payment recording schema for UI
export const RecordPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be positive"),
  payment_date: z.string(), // ISO date string
  notes: z.string().max(500).nullable().optional(),
});

// Type exports
export type Debt = z.infer<typeof DebtSchema>;
export type CreateDebt = z.infer<typeof CreateDebtSchema>;
export type UpdateDebt = z.infer<typeof UpdateDebtSchema>;
export type DebtPayment = z.infer<typeof DebtPaymentSchema>;
export type CreateDebtPayment = z.infer<typeof CreateDebtPaymentSchema>;
export type UpdateDebtPayment = z.infer<typeof UpdateDebtPaymentSchema>;
export type DebtPayoffStrategy = z.infer<typeof DebtPayoffStrategySchema>;
export type CreateDebtPayoffStrategy = z.infer<typeof CreateDebtPayoffStrategySchema>;
export type UpdateDebtPayoffStrategy = z.infer<typeof UpdateDebtPayoffStrategySchema>;
export type DebtSummary = z.infer<typeof DebtSummarySchema>;
export type DebtWithAccount = z.infer<typeof DebtWithAccountSchema>;
export type PayoffCalculation = z.infer<typeof PayoffCalculationSchema>;
export type StrategyCalculation = z.infer<typeof StrategyCalculationSchema>;
export type RecordPayment = z.infer<typeof RecordPaymentSchema>;
export type DebtType = z.infer<typeof DebtTypeEnum>;
export type PaymentType = z.infer<typeof PaymentTypeEnum>;
export type StrategyType = z.infer<typeof StrategyTypeEnum>;

// Database transformation utilities
interface DbDebt {
  created_at: Date | string;
  updated_at: Date | string;
  due_date?: Date | string;
  [key: string]: unknown;
}

export const transformDebtFromDb = (dbDebt: DbDebt): Debt => {
  // Handle both Date objects and ISO strings
  const formatTimestamp = (timestamp: Date | string): string => {
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    return timestamp.toISOString();
  };

  const formatDate = (date: Date | string | undefined | null): string | null => {
    if (!date) return null;
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    return date.toISOString().split('T')[0];
  };

  return {
    ...dbDebt,
    created_at: formatTimestamp(dbDebt.created_at),
    updated_at: formatTimestamp(dbDebt.updated_at),
    due_date: formatDate(dbDebt.due_date),
  } as Debt;
};

interface DbDebtPayment {
  payment_date: Date | string;
  created_at: Date | string;
  [key: string]: unknown;
}

export const transformDebtPaymentFromDb = (dbPayment: DbDebtPayment): DebtPayment => {
  // Handle both Date objects and ISO strings
  const formatTimestamp = (timestamp: Date | string): string => {
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    return timestamp.toISOString();
  };

  const formatDate = (date: Date | string): string => {
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    return date.toISOString().split('T')[0];
  };

  return {
    ...dbPayment,
    payment_date: formatDate(dbPayment.payment_date),
    created_at: formatTimestamp(dbPayment.created_at),
  } as DebtPayment;
};

interface DbDebtPayoffStrategy {
  id: string;
  user_id: string;
  name: string;
  strategy_type: string;
  target_date?: Date | string;
  extra_payment_amount: number;
  debt_order: string[] | null;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  [key: string]: unknown;
}

export const transformStrategyFromDb = (dbStrategy: DbDebtPayoffStrategy): DebtPayoffStrategy => {
  // Handle both Date objects and ISO strings
  const formatTimestamp = (timestamp: Date | string): string => {
    if (typeof timestamp === 'string') {
      return timestamp;
    }
    return timestamp.toISOString();
  };

  const formatDate = (date: Date | string | undefined | null): string | null => {
    if (!date) return null;
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    return date.toISOString().split('T')[0];
  };

  return {
    ...dbStrategy,
    target_date: formatDate(dbStrategy.target_date),
    created_at: formatTimestamp(dbStrategy.created_at),
    updated_at: formatTimestamp(dbStrategy.updated_at),
  } as DebtPayoffStrategy;
};