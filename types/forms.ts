// Form data interfaces for consistent typing across components

export interface GoalFormData {
  name: string;
  description: string;
  type: "savings" | "debt_payoff" | "spending_limit";
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  categoryId: string;
  period?: "weekly" | "monthly" | "yearly" | "quarterly";
}

export interface BudgetFormData {
  name: string;
  description: string;
  budgetType: "category" | "total" | "custom";
  categoryIds: string[]; // Changed from categoryId to support multiple categories
  amount: string;
  period: "weekly" | "monthly" | "quarterly" | "yearly";
  startDate: string;
  endDate: string;
  alertThresholdPercentage: number;
  alertEnabled: boolean;
  overspendAlertEnabled: boolean;
  rolloverEnabled: boolean;
  rolloverType: "none" | "surplus" | "deficit" | "both";
}

export interface TransactionFormData {
  name: string;
  amount: string;
  transactionType: "income" | "expense";
  categoryId: string;
  description?: string;
  transactionDate: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface FormUpdateHandler {
  (field: string, value: string | number | boolean): void;
}
