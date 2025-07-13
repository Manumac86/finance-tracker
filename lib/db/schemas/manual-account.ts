import { z } from "zod";

// Simplified account types for manual management
export const AccountType = z.enum(['checking', 'savings', 'credit', 'cash', 'investment']);
export const AccountStatus = z.enum(['active', 'closed', 'frozen']);

// Database schema for manual accounts (snake_case)
export const ManualAccountSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().min(1),
  
  // Basic account information
  name: z.string().min(1).max(100),
  account_type: AccountType,
  institution_name: z.string().max(100).optional(),
  
  // Balance information
  currency_code: z.string().length(3).default("USD"),
  initial_balance: z.number().default(0),
  current_balance: z.number().default(0),
  
  // Account details
  account_number_last_4: z.string().max(4).refine((val) => !val || /^\d{4}$/.test(val), {
    message: "Account number must be exactly 4 digits"
  }).optional(), // Only last 4 digits
  description: z.string().max(500).optional(),
  
  // Status and settings
  is_active: z.boolean().default(true),
  include_in_totals: z.boolean().default(true), // Include in dashboard calculations
  
  // Display settings
  color: z.string().max(7).regex(/^#[0-9A-F]{6}$/i).optional(), // Hex color for UI
  icon: z.string().max(50).optional(), // Icon identifier
  
  // Metadata
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Account balance history for tracking changes
export const AccountBalanceHistorySchema = z.object({
  id: z.string().uuid().optional(),
  account_id: z.string().uuid(),
  user_id: z.string().min(1),
  
  // Balance change details
  previous_balance: z.number(),
  new_balance: z.number(),
  balance_change: z.number(),
  
  // Change source
  transaction_id: z.string().uuid().optional(), // If caused by a transaction
  change_type: z.enum(['transaction', 'manual_adjustment', 'correction', 'initial']),
  description: z.string().max(255).optional(),
  
  // Metadata
  created_at: z.string().datetime().optional(),
});

// Create/Update schemas
export const CreateManualAccountSchema = ManualAccountSchema.omit({
  id: true,
  current_balance: true, // Set automatically from initial_balance
  created_at: true,
  updated_at: true,
});

export const UpdateManualAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  account_type: AccountType.optional(),
  institution_name: z.string().max(100).optional(),
  currency_code: z.string().length(3).optional(),
  account_number_last_4: z.string().max(4).refine((val) => !val || /^\d{4}$/.test(val), {
    message: "Account number must be exactly 4 digits"
  }).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
  include_in_totals: z.boolean().optional(),
  color: z.string().max(7).regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().max(50).optional(),
});

export const ManualBalanceAdjustmentSchema = z.object({
  new_balance: z.number(),
  description: z.string().max(255).optional(),
});

// Type exports
export type ManualAccount = z.infer<typeof ManualAccountSchema>;
export type AccountBalanceHistory = z.infer<typeof AccountBalanceHistorySchema>;
export type CreateManualAccount = z.infer<typeof CreateManualAccountSchema>;
export type UpdateManualAccount = z.infer<typeof UpdateManualAccountSchema>;
export type ManualBalanceAdjustment = z.infer<typeof ManualBalanceAdjustmentSchema>;

// UI-compatible types with camelCase properties
export interface UIManualAccount {
  id?: string;
  userId: string;
  
  // Basic info
  name: string;
  accountType: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
  institutionName?: string;
  
  // Balance info
  currencyCode: string;
  initialBalance: number;
  currentBalance: number;
  
  // Details
  accountNumberLast4?: string;
  description?: string;
  
  // Status
  isActive: boolean;
  includeInTotals: boolean;
  
  // Display
  color?: string;
  icon?: string;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  
  // Extended UI properties
  formattedBalance?: string;
  balanceChange?: number;
  accountTypeLabel?: string;
  iconComponent?: string;
}

// Account type display configurations
export const ACCOUNT_TYPE_CONFIG = {
  checking: {
    label: 'Checking',
    icon: 'CreditCard',
    defaultColor: '#3B82F6', // Blue
    description: 'Everyday spending account'
  },
  savings: {
    label: 'Savings',
    icon: 'PiggyBank',
    defaultColor: '#10B981', // Green
    description: 'Savings and emergency funds'
  },
  credit: {
    label: 'Credit Card',
    icon: 'CreditCard',
    defaultColor: '#EF4444', // Red
    description: 'Credit card account'
  },
  cash: {
    label: 'Cash',
    icon: 'Banknote',
    defaultColor: '#F59E0B', // Amber
    description: 'Physical cash on hand'
  },
  investment: {
    label: 'Investment',
    icon: 'TrendingUp',
    defaultColor: '#8B5CF6', // Purple
    description: 'Investment and brokerage accounts'
  }
} as const;

// Currency formatting helper
export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Transform functions for database/UI conversion
export function transformManualAccountToUI(account: ManualAccount): UIManualAccount {
  const typeConfig = ACCOUNT_TYPE_CONFIG[account.account_type];
  
  return {
    id: account.id,
    userId: account.user_id,
    name: account.name,
    accountType: account.account_type,
    institutionName: account.institution_name,
    currencyCode: account.currency_code,
    initialBalance: account.initial_balance,
    currentBalance: account.current_balance,
    accountNumberLast4: account.account_number_last_4,
    description: account.description,
    isActive: account.is_active,
    includeInTotals: account.include_in_totals,
    color: account.color || typeConfig.defaultColor,
    icon: account.icon || typeConfig.icon,
    createdAt: account.created_at,
    updatedAt: account.updated_at,
    formattedBalance: formatCurrency(account.current_balance, account.currency_code),
    balanceChange: account.current_balance - account.initial_balance,
    accountTypeLabel: typeConfig.label,
    iconComponent: account.icon || typeConfig.icon,
  };
}

export function transformUIToManualAccount(uiAccount: Partial<UIManualAccount>): Partial<ManualAccount> {
  return {
    id: uiAccount.id,
    user_id: uiAccount.userId,
    name: uiAccount.name,
    account_type: uiAccount.accountType,
    institution_name: uiAccount.institutionName,
    currency_code: uiAccount.currencyCode,
    initial_balance: uiAccount.initialBalance,
    current_balance: uiAccount.currentBalance,
    account_number_last_4: uiAccount.accountNumberLast4,
    description: uiAccount.description,
    is_active: uiAccount.isActive,
    include_in_totals: uiAccount.includeInTotals,
    color: uiAccount.color,
    icon: uiAccount.icon,
    created_at: uiAccount.createdAt,
    updated_at: uiAccount.updatedAt,
  };
}

// Account summary calculations
export function calculateAccountSummary(accounts: UIManualAccount[]) {
  const activeAccounts = accounts.filter(acc => acc.isActive && acc.includeInTotals);
  
  const summary = {
    totalAccounts: accounts.length,
    activeAccounts: activeAccounts.length,
    totalBalance: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    byType: {
      checking: { count: 0, balance: 0 },
      savings: { count: 0, balance: 0 },
      credit: { count: 0, balance: 0 },
      cash: { count: 0, balance: 0 },
      investment: { count: 0, balance: 0 },
    }
  };
  
  activeAccounts.forEach(account => {
    const balance = account.currentBalance;
    summary.totalBalance += balance;
    
    if (account.accountType === 'credit') {
      // Credit cards are liabilities (negative balance is money owed)
      summary.totalLiabilities += Math.abs(balance < 0 ? balance : -balance);
    } else {
      summary.totalAssets += balance;
    }
    
    summary.byType[account.accountType].count++;
    summary.byType[account.accountType].balance += balance;
  });
  
  return summary;
}