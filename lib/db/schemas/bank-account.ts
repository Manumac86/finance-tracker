import { z } from "zod";

// Bank account provider types
export const BankProvider = z.enum(['plaid', 'truelayer']);
export const BankRegion = z.enum(['US', 'ES', 'EU']);
export const AccountType = z.enum(['checking', 'savings', 'credit', 'investment', 'loan']);
export const SyncStatus = z.enum(['manual', 'synced', 'pending', 'failed', 'disconnected']);

// Database schema for bank accounts (snake_case)
export const BankAccountSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().min(1),
  
  // Regional provider identification
  provider: BankProvider,
  region: BankRegion,
  
  // Provider-specific IDs (only one will be populated per account)
  plaid_account_id: z.string().optional(),
  plaid_access_token: z.string().optional(),
  truelayer_account_id: z.string().optional(),
  truelayer_access_token: z.string().optional(),
  
  // Universal account information
  account_name: z.string().min(1),
  account_type: AccountType,
  account_subtype: z.string().optional(),
  institution_name: z.string().min(1),
  institution_id: z.string().min(1),
  
  // Account details (NEVER store full account numbers, CVCs, or sensitive data)
  mask: z.string().max(4).regex(/^\d{4}$/).optional(), // Only last 4 digits, validated format
  official_name: z.string().max(255).optional(),
  
  // Balance information
  currency_code: z.string().length(3).default("USD"),
  current_balance: z.number().optional(),
  available_balance: z.number().optional(),
  
  // Status and sync tracking
  is_active: z.boolean().default(true),
  sync_status: SyncStatus.default("manual"),
  last_synced_at: z.string().datetime().optional(),
  last_error: z.string().optional(),
  
  // Metadata
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Regional bank configuration schema
export const RegionalBankConfigSchema = z.object({
  id: z.string().uuid().optional(),
  region: BankRegion,
  provider: BankProvider,
  is_enabled: z.boolean().default(true),
  config_data: z.record(z.any()).optional(), // Provider-specific config
  created_at: z.string().datetime().optional(),
});

// Transaction enhancement for bank sync
export const BankTransactionSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().min(1),
  
  // Bank account linkage
  bank_account_id: z.string().uuid().optional(),
  
  // Provider-specific transaction IDs
  plaid_transaction_id: z.string().optional(),
  truelayer_transaction_id: z.string().optional(),
  
  // Enhanced transaction data from banks
  merchant_name: z.string().optional(),
  merchant_category: z.string().optional(),
  location_address: z.string().optional(),
  location_city: z.string().optional(),
  location_country: z.string().optional(),
  
  // Account balance after transaction
  account_balance_after: z.number().optional(),
  
  // Sync metadata
  sync_status: SyncStatus.default("manual"),
  is_synced: z.boolean().default(false),
  pending_transaction_id: z.string().optional(), // For pending transactions
  
  // Standard transaction fields (from existing schema)
  amount: z.number(),
  transaction_type: z.enum(['income', 'expense']),
  name: z.string().min(1),
  description: z.string().optional(),
  category_id: z.string().uuid().optional(),
  transaction_date: z.string(),
  
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

// Duplicate detection schema
export const TransactionDuplicateSchema = z.object({
  id: z.string().uuid().optional(),
  transaction_id: z.string().uuid(),
  potential_duplicate_id: z.string().uuid(),
  similarity_score: z.number().min(0).max(1),
  status: z.enum(['pending', 'confirmed', 'dismissed']).default('pending'),
  detection_method: z.enum(['amount_date', 'merchant_match', 'exact_match']),
  created_at: z.string().datetime().optional(),
});

// Create/Update schemas
export const CreateBankAccountSchema = BankAccountSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateBankAccountSchema = z.object({
  account_name: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
  sync_status: SyncStatus.optional(),
  last_error: z.string().optional(),
  current_balance: z.number().optional(),
  available_balance: z.number().optional(),
  last_synced_at: z.string().datetime().optional(),
});

// Type exports
export type BankAccount = z.infer<typeof BankAccountSchema>;
export type RegionalBankConfig = z.infer<typeof RegionalBankConfigSchema>;
export type BankTransaction = z.infer<typeof BankTransactionSchema>;
export type TransactionDuplicate = z.infer<typeof TransactionDuplicateSchema>;
export type CreateBankAccount = z.infer<typeof CreateBankAccountSchema>;
export type UpdateBankAccount = z.infer<typeof UpdateBankAccountSchema>;

// UI-compatible types with camelCase properties
export interface UIBankAccount {
  id?: string;
  userId: string;
  
  // Provider info
  provider: 'plaid' | 'truelayer';
  region: 'US' | 'ES' | 'EU';
  
  // Account details
  accountName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment' | 'loan';
  accountSubtype?: string;
  institutionName: string;
  institutionId: string;
  mask?: string;
  officialName?: string;
  
  // Balance info
  currencyCode: string;
  currentBalance?: number;
  availableBalance?: number;
  
  // Status
  isActive: boolean;
  syncStatus: 'manual' | 'synced' | 'pending' | 'failed' | 'disconnected';
  lastSyncedAt?: string;
  lastError?: string;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  
  // Extended UI properties
  formattedBalance?: string;
  institutionLogo?: string;
  connectionHealth?: 'healthy' | 'warning' | 'error';
  lastTransactionCount?: number;
}

// Currency formatting helper
export function formatCurrencyByRegion(amount: number, currencyCode: string, region: string): string {
  const localeMap = {
    'US': 'en-US',
    'ES': 'es-ES', 
    'EU': 'en-EU'
  };
  
  const locale = localeMap[region as keyof typeof localeMap] || 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Transform functions for database/UI conversion
export function transformBankAccountToUI(bankAccount: BankAccount): UIBankAccount {
  return {
    id: bankAccount.id,
    userId: bankAccount.user_id,
    provider: bankAccount.provider,
    region: bankAccount.region,
    accountName: bankAccount.account_name,
    accountType: bankAccount.account_type,
    accountSubtype: bankAccount.account_subtype,
    institutionName: bankAccount.institution_name,
    institutionId: bankAccount.institution_id,
    mask: bankAccount.mask,
    officialName: bankAccount.official_name,
    currencyCode: bankAccount.currency_code,
    currentBalance: bankAccount.current_balance,
    availableBalance: bankAccount.available_balance,
    isActive: bankAccount.is_active,
    syncStatus: bankAccount.sync_status,
    lastSyncedAt: bankAccount.last_synced_at,
    lastError: bankAccount.last_error,
    createdAt: bankAccount.created_at,
    updatedAt: bankAccount.updated_at,
    formattedBalance: bankAccount.current_balance 
      ? formatCurrencyByRegion(bankAccount.current_balance, bankAccount.currency_code, bankAccount.region)
      : undefined,
  };
}

export function transformUIToBankAccount(uiBankAccount: Partial<UIBankAccount>): Partial<BankAccount> {
  return {
    id: uiBankAccount.id,
    user_id: uiBankAccount.userId,
    provider: uiBankAccount.provider,
    region: uiBankAccount.region,
    account_name: uiBankAccount.accountName,
    account_type: uiBankAccount.accountType,
    account_subtype: uiBankAccount.accountSubtype,
    institution_name: uiBankAccount.institutionName,
    institution_id: uiBankAccount.institutionId,
    mask: uiBankAccount.mask,
    official_name: uiBankAccount.officialName,
    currency_code: uiBankAccount.currencyCode,
    current_balance: uiBankAccount.currentBalance,
    available_balance: uiBankAccount.availableBalance,
    is_active: uiBankAccount.isActive,
    sync_status: uiBankAccount.syncStatus,
    last_synced_at: uiBankAccount.lastSyncedAt,
    last_error: uiBankAccount.lastError,
    created_at: uiBankAccount.createdAt,
    updated_at: uiBankAccount.updatedAt,
  };
}

// Regional bank provider utilities
export function getProviderForRegion(region: string): string {
  const providerMap = {
    'US': 'plaid',
    'ES': 'truelayer',
    'EU': 'truelayer'
  };
  
  return providerMap[region as keyof typeof providerMap] || 'plaid';
}

export function getSupportedCurrencies(region: string): string[] {
  const currencyMap = {
    'US': ['USD'],
    'ES': ['EUR'],
    'EU': ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK']
  };
  
  return currencyMap[region as keyof typeof currencyMap] || ['USD'];
}