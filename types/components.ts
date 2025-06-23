// Component prop types and interfaces

import type { ReactNode } from "react";
import type { UIGoal } from "@/lib/db/schemas/goal";
import type { UIBudget } from "@/lib/db/schemas/budget";
import type { UITransaction } from "@/lib/db/schemas/transaction";
import type { UICategory } from "@/lib/db/schemas/category";
import type { BudgetAnalysis } from "@/types/context";

// Modal component interfaces
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface CreateModalProps<T> extends BaseModalProps {
  onSave: (data: T) => void;
}

export interface EditModalProps<T, U> extends BaseModalProps {
  onSave: (id: string, data: T) => void;
  item: U | null;
}

// Card component interfaces
export interface GoalCardProps {
  goal: UIGoal;
  onEdit: (goal: UIGoal) => void;
  onDelete: (goalId: string) => void;
}

export interface BudgetCardProps {
  budget: UIBudget;
  analysis?: BudgetAnalysis;
  onEdit: (budget: UIBudget) => void;
  onDelete: (budgetId: string) => void;
}

export interface TransactionCardProps {
  transaction: UITransaction;
  onEdit: (transaction: UITransaction) => void;
  onDelete: (transactionId: string) => void;
}

export interface CategoryCardProps {
  category: UICategory;
  onEdit: (category: UICategory) => void;
  onDelete: (categoryId: string) => void;
}

// List component interfaces
export interface BaseListProps {
  isLoading?: boolean;
  error?: Error | null;
}

export interface GoalsListProps extends BaseListProps {
  goals: UIGoal[];
  onEditGoal: (goal: UIGoal) => void;
  onDeleteGoal: (goalId: string) => void;
}

export interface BudgetsListProps extends BaseListProps {
  budgets: UIBudget[];
  onEditBudget: (budget: UIBudget) => void;
  onDeleteBudget: (budgetId: string) => void;
}

export interface TransactionsListProps extends BaseListProps {
  transactions: UITransaction[];
  onEditTransaction: (transaction: UITransaction) => void;
  onDeleteTransaction: (transactionId: string) => void;
  loadMore?: () => void;
  hasMore?: boolean;
}

// Filter component interfaces
export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterProps {
  options: FilterOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

// Dashboard component interfaces
export interface DashboardStatProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export interface DashboardChartProps {
  title: string;
  data: Record<string, unknown>[];
  type: 'line' | 'bar' | 'pie' | 'area';
}

// Form validation interfaces
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

export interface ValidationRules {
  [fieldName: string]: ValidationRule;
}

// Authentication wrapper interfaces
export interface AuthWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}