import { z } from "zod";

export const BudgetTypeEnum = z.enum(["category", "total", "custom"]);
export const BudgetPeriodEnum = z.enum(["weekly", "monthly", "quarterly", "yearly"]);
export const RolloverTypeEnum = z.enum(["none", "surplus", "deficit", "both"]);
export const AlertTypeEnum = z.enum(["threshold_warning", "overspend_warning", "budget_exceeded"]);

export const BudgetSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string(),
  name: z.string().min(1, "Budget name is required"),
  description: z.string().optional(),
  category_id: z.string().uuid().optional(),
  budget_type: BudgetTypeEnum,
  amount: z.number().positive("Budget amount must be positive"),
  period: BudgetPeriodEnum,
  start_date: z.string(), // ISO date string
  end_date: z.string().optional(),
  
  // Alert settings
  alert_threshold_percentage: z.number().min(1).max(100).default(80),
  alert_enabled: z.boolean().default(true),
  overspend_alert_enabled: z.boolean().default(true),
  
  // Rollover settings
  rollover_enabled: z.boolean().default(false),
  rollover_type: RolloverTypeEnum.default("none"),
  
  // Current period tracking
  current_spent: z.number().default(0),
  last_calculated_at: z.string().optional(),
  
  // Status and metadata
  is_active: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const CreateBudgetSchema = BudgetSchema.omit({
  id: true,
  user_id: true,
  current_spent: true,
  last_calculated_at: true,
  created_at: true,
  updated_at: true,
});

export const UpdateBudgetSchema = BudgetSchema.partial().omit({
  id: true,
  user_id: true,
  created_at: true,
});

export const BudgetAlertSchema = z.object({
  id: z.string().uuid().optional(),
  budget_id: z.string().uuid(),
  user_id: z.string(),
  alert_type: AlertTypeEnum,
  message: z.string(),
  percentage_used: z.number().optional(),
  amount_spent: z.number(),
  budget_amount: z.number(),
  period_start: z.string(),
  period_end: z.string(),
  sent_at: z.string().optional(),
  acknowledged: z.boolean().default(false),
  acknowledged_at: z.string().optional(),
});

export const BudgetHistorySchema = z.object({
  id: z.string().uuid().optional(),
  budget_id: z.string().uuid(),
  user_id: z.string(),
  period_start: z.string(),
  period_end: z.string(),
  budget_amount: z.number(),
  actual_spent: z.number(),
  variance: z.number().optional(), // Computed field
  variance_percentage: z.number().optional(), // Computed field
  rollover_from_previous: z.number().default(0),
  rollover_to_next: z.number().default(0),
  created_at: z.string().optional(),
});

export type Budget = z.infer<typeof BudgetSchema>;
export type CreateBudget = z.infer<typeof CreateBudgetSchema>;
export type UpdateBudget = z.infer<typeof UpdateBudgetSchema>;
export type BudgetAlert = z.infer<typeof BudgetAlertSchema>;
export type BudgetHistory = z.infer<typeof BudgetHistorySchema>;

// UI-compatible type with camelCase properties for frontend components
export interface UIBudget {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  categoryId?: string;
  budgetType: "category" | "total" | "custom";
  amount: number;
  period: "weekly" | "monthly" | "quarterly" | "yearly";
  startDate: string;
  endDate?: string;
  
  // Alert settings
  alertThresholdPercentage: number;
  alertEnabled: boolean;
  overspendAlertEnabled: boolean;
  
  // Rollover settings
  rolloverEnabled: boolean;
  rolloverType: "none" | "surplus" | "deficit" | "both";
  
  // Current period tracking
  currentSpent: number;
  lastCalculatedAt?: string;
  
  // Status and metadata
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  
  // Computed fields for UI
  percentageUsed?: number;
  remaining?: number;
  status?: "on_track" | "warning" | "overspent";
  daysRemaining?: number;
}

export interface UIBudgetAlert {
  id?: string;
  budgetId: string;
  userId: string;
  alertType: "threshold_warning" | "overspend_warning" | "budget_exceeded";
  message: string;
  percentageUsed?: number;
  amountSpent: number;
  budgetAmount: number;
  periodStart: string;
  periodEnd: string;
  sentAt?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export interface UIBudgetHistory {
  id?: string;
  budgetId: string;
  userId: string;
  periodStart: string;
  periodEnd: string;
  budgetAmount: number;
  actualSpent: number;
  variance?: number;
  variancePercentage?: number;
  rolloverFromPrevious: number;
  rolloverToNext: number;
  createdAt?: string;
}

// Transform database Budget to UI-compatible format
export function transformBudgetToUI(budget: Budget): UIBudget {
  const percentageUsed = budget.amount > 0 ? (budget.current_spent / budget.amount) * 100 : 0;
  const remaining = budget.amount - budget.current_spent;
  
  let status: "on_track" | "warning" | "overspent" = "on_track";
  if (percentageUsed >= 100) {
    status = "overspent";
  } else if (percentageUsed >= budget.alert_threshold_percentage) {
    status = "warning";
  }
  
  // Calculate days remaining in current period
  const startDate = new Date(budget.start_date);
  const endDate = budget.end_date ? new Date(budget.end_date) : calculatePeriodEndDate(startDate, budget.period);
  const today = new Date();
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  return {
    id: budget.id,
    userId: budget.user_id,
    name: budget.name,
    description: budget.description,
    categoryId: budget.category_id,
    budgetType: budget.budget_type,
    amount: budget.amount,
    period: budget.period,
    startDate: budget.start_date,
    endDate: budget.end_date,
    alertThresholdPercentage: budget.alert_threshold_percentage,
    alertEnabled: budget.alert_enabled,
    overspendAlertEnabled: budget.overspend_alert_enabled,
    rolloverEnabled: budget.rollover_enabled,
    rolloverType: budget.rollover_type,
    currentSpent: budget.current_spent,
    lastCalculatedAt: budget.last_calculated_at,
    isActive: budget.is_active,
    metadata: budget.metadata,
    createdAt: budget.created_at,
    updatedAt: budget.updated_at,
    percentageUsed: Math.round(percentageUsed * 100) / 100,
    remaining,
    status,
    daysRemaining,
  };
}

// Transform UI format to database format
export function transformUIToBudget(uiBudget: Partial<UIBudget>): Partial<Budget> {
  return {
    id: uiBudget.id,
    user_id: uiBudget.userId,
    name: uiBudget.name,
    description: uiBudget.description,
    category_id: uiBudget.categoryId,
    budget_type: uiBudget.budgetType,
    amount: uiBudget.amount,
    period: uiBudget.period,
    start_date: uiBudget.startDate,
    end_date: uiBudget.endDate,
    alert_threshold_percentage: uiBudget.alertThresholdPercentage,
    alert_enabled: uiBudget.alertEnabled,
    overspend_alert_enabled: uiBudget.overspendAlertEnabled,
    rollover_enabled: uiBudget.rolloverEnabled,
    rollover_type: uiBudget.rolloverType,
    current_spent: uiBudget.currentSpent,
    last_calculated_at: uiBudget.lastCalculatedAt,
    is_active: uiBudget.isActive,
    metadata: uiBudget.metadata,
    created_at: uiBudget.createdAt,
    updated_at: uiBudget.updatedAt,
  };
}

// Transform budget alert to UI format
export function transformBudgetAlertToUI(alert: BudgetAlert): UIBudgetAlert {
  return {
    id: alert.id,
    budgetId: alert.budget_id,
    userId: alert.user_id,
    alertType: alert.alert_type,
    message: alert.message,
    percentageUsed: alert.percentage_used,
    amountSpent: alert.amount_spent,
    budgetAmount: alert.budget_amount,
    periodStart: alert.period_start,
    periodEnd: alert.period_end,
    sentAt: alert.sent_at,
    acknowledged: alert.acknowledged,
    acknowledgedAt: alert.acknowledged_at,
  };
}

// Helper function to calculate period end date
function calculatePeriodEndDate(startDate: Date, period: "weekly" | "monthly" | "quarterly" | "yearly"): Date {
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

// Budget calculation utilities
export function calculateBudgetStatus(currentSpent: number, budgetAmount: number, thresholdPercentage: number) {
  const percentageUsed = budgetAmount > 0 ? (currentSpent / budgetAmount) * 100 : 0;
  
  if (percentageUsed >= 100) {
    return {
      status: "overspent" as const,
      severity: "high" as const,
      message: "Budget exceeded"
    };
  } else if (percentageUsed >= thresholdPercentage) {
    return {
      status: "warning" as const,
      severity: "medium" as const,
      message: `${Math.round(percentageUsed)}% of budget used`
    };
  } else {
    return {
      status: "on_track" as const,
      severity: "low" as const,
      message: "On track"
    };
  }
}

export function shouldTriggerAlert(
  currentSpent: number, 
  budgetAmount: number, 
  thresholdPercentage: number,
  lastAlertPercentage?: number
): { shouldAlert: boolean; alertType: "threshold_warning" | "overspend_warning" | "budget_exceeded" } | null {
  const percentageUsed = budgetAmount > 0 ? (currentSpent / budgetAmount) * 100 : 0;
  
  // Don't trigger duplicate alerts
  if (lastAlertPercentage && percentageUsed <= lastAlertPercentage) {
    return null;
  }
  
  if (percentageUsed >= 100) {
    return { shouldAlert: true, alertType: "budget_exceeded" };
  } else if (percentageUsed >= thresholdPercentage) {
    return { shouldAlert: true, alertType: "threshold_warning" };
  }
  
  return null;
}