import { z } from "zod";

export const GoalTypeEnum = z.enum([
  "savings",
  "debt_payoff",
  "spending_limit",
]);
export const GoalPeriodEnum = z.enum([
  "weekly",
  "monthly",
  "yearly",
  "quarterly",
]);

export const GoalSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string(), // Snake case for PostgreSQL
  name: z.string().min(1, "Goal name is required"),
  description: z.string().optional(),
  type: GoalTypeEnum,
  target_amount: z.number().positive("Target amount must be positive"), // Snake case
  current_amount: z.number().default(0), // Snake case
  target_date: z.string().optional(), // Snake case
  category_id: z.string().uuid().optional(), // Snake case
  period: GoalPeriodEnum.optional(),
  progress: z.number().min(0).max(100).optional(), // Computed field
  achieved_at: z.string().optional(), // Snake case
  is_active: z.boolean().default(true), // Snake case
  metadata: z.record(z.any()).optional(),
  created_at: z.string().optional(), // Snake case
  updated_at: z.string().optional(), // Snake case
});

export const CreateGoalSchema = GoalSchema.omit({
  id: true,
  user_id: true,
  progress: true,
  achieved_at: true,
  created_at: true,
  updated_at: true,
});

export const UpdateGoalSchema = GoalSchema.partial().omit({
  id: true,
  user_id: true,
  created_at: true,
});

export type Goal = z.infer<typeof GoalSchema>;
export type CreateGoal = z.infer<typeof CreateGoalSchema>;
export type UpdateGoal = z.infer<typeof UpdateGoalSchema>;

// UI-compatible type with camelCase properties for frontend components
export interface UIGoal {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  type: "savings" | "debt_payoff" | "spending_limit";
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  categoryId?: string;
  period?: "weekly" | "monthly" | "yearly" | "quarterly";
  progress?: number;
  achievedAt?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  // Computed fields for UI
  isAchieved?: boolean;
  deadlineStatus?: {
    status: "on_track" | "approaching" | "overdue";
    daysRemaining: number;
  };
}

// Transform database Goal to UI-compatible format
export function transformGoalToUI(goal: Goal): UIGoal {
  return {
    id: goal.id,
    userId: goal.user_id,
    name: goal.name,
    description: goal.description,
    type: goal.type,
    targetAmount: goal.target_amount,
    currentAmount: goal.current_amount,
    targetDate: goal.target_date,
    categoryId: goal.category_id,
    period: goal.period,
    progress: goal.progress,
    achievedAt: goal.achieved_at,
    isActive: goal.is_active,
    metadata: goal.metadata,
    createdAt: goal.created_at,
    updatedAt: goal.updated_at,
    isAchieved: isGoalAchieved(goal),
    deadlineStatus: getGoalDeadlineStatus(goal),
  };
}

// Transform UI format to database format
export function transformUIToGoal(uiGoal: Partial<UIGoal>): Partial<Goal> {
  return {
    id: uiGoal.id,
    user_id: uiGoal.userId,
    name: uiGoal.name,
    description: uiGoal.description,
    type: uiGoal.type,
    target_amount: uiGoal.targetAmount,
    current_amount: uiGoal.currentAmount,
    target_date: uiGoal.targetDate,
    category_id: uiGoal.categoryId,
    period: uiGoal.period,
    progress: uiGoal.progress,
    achieved_at: uiGoal.achievedAt,
    is_active: uiGoal.isActive,
    metadata: uiGoal.metadata,
    created_at: uiGoal.createdAt,
    updated_at: uiGoal.updatedAt,
  };
}

// Goal progress calculation utilities
export function calculateGoalProgress(goal: Goal): number {
  if (goal.type === "debt_payoff") {
    // For debt payoff, progress is amount paid off
    return Math.round(
      ((goal.target_amount - goal.current_amount) / goal.target_amount) * 100
    );
  }

  // For savings and spending limits, progress is current/target
  return Math.round((goal.current_amount / goal.target_amount) * 100);
}

export function isGoalAchieved(goal: Goal): boolean {
  if (goal.type === "debt_payoff") {
    return goal.current_amount <= 0;
  }

  if (goal.type === "spending_limit") {
    return goal.current_amount <= goal.target_amount;
  }

  // For savings goals
  return goal.current_amount >= goal.target_amount;
}

export function getGoalDeadlineStatus(goal: Goal): {
  status: "on_track" | "approaching" | "overdue";
  daysRemaining: number;
} {
  if (!goal.target_date) {
    return { status: "on_track", daysRemaining: 0 };
  }

  const now = new Date();
  const targetDate = new Date(goal.target_date);
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: "overdue", daysRemaining: Math.abs(diffDays) };
  } else if (diffDays <= 7) {
    return { status: "approaching", daysRemaining: diffDays };
  } else {
    return { status: "on_track", daysRemaining: diffDays };
  }
}
