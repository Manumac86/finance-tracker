import { z } from "zod";

// Family Settings Schema (stored in our database, linked to Clerk Organization)
export const FamilySettingsSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string(), // Clerk organization ID
  
  // Family financial settings
  shared_currency: z.string().length(3).default("USD"),
  monthly_family_budget: z.number().positive().nullable().optional(),
  
  // Family permissions and rules
  permissions: z.object({
    members_can_view_all_transactions: z.boolean().default(true),
    members_can_edit_shared_budgets: z.boolean().default(false),
    members_can_create_shared_goals: z.boolean().default(true),
    require_admin_approval_for_large_expenses: z.boolean().default(false),
    large_expense_threshold: z.number().positive().default(100.00),
    allow_individual_budgets: z.boolean().default(true),
    spending_notifications_enabled: z.boolean().default(true),
  }).default({
    members_can_view_all_transactions: true,
    members_can_edit_shared_budgets: false,
    members_can_create_shared_goals: true,
    require_admin_approval_for_large_expenses: false,
    large_expense_threshold: 100.00,
    allow_individual_budgets: true,
    spending_notifications_enabled: true,
  }),
  
  // Timestamps
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Organization Member Settings Schema
export const OrganizationMemberSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string(), // Clerk organization ID
  user_id: z.string().uuid(), // Internal user ID
  
  // Member-specific settings
  display_name: z.string().max(255).optional(),
  spending_limit_per_month: z.number().positive().optional(),
  can_view_all_accounts: z.boolean().default(false),
  receive_spending_notifications: z.boolean().default(true),
  
  // Status tracking
  last_active_at: z.string().optional(),
  
  // Timestamps
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Create/Update schemas
export const CreateFamilySettingsSchema = FamilySettingsSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateFamilySettingsSchema = z.object({
  shared_currency: z.string().length(3).optional(),
  monthly_family_budget: z.number().positive().nullable().optional(),
  permissions: z.object({
    members_can_view_all_transactions: z.boolean().optional(),
    members_can_edit_shared_budgets: z.boolean().optional(),
    members_can_create_shared_goals: z.boolean().optional(),
    require_admin_approval_for_large_expenses: z.boolean().optional(),
    large_expense_threshold: z.number().positive().optional(),
    allow_individual_budgets: z.boolean().optional(),
    spending_notifications_enabled: z.boolean().optional(),
  }).optional(),
});

export const CreateOrganizationMemberSettingsSchema = OrganizationMemberSettingsSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateOrganizationMemberSettingsSchema = OrganizationMemberSettingsSchema.partial().omit({
  id: true,
  organization_id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

// Type exports
export type FamilySettings = z.infer<typeof FamilySettingsSchema>;
export type OrganizationMemberSettings = z.infer<typeof OrganizationMemberSettingsSchema>;
export type CreateFamilySettings = z.infer<typeof CreateFamilySettingsSchema>;
export type UpdateFamilySettings = z.infer<typeof UpdateFamilySettingsSchema>;
export type CreateOrganizationMemberSettings = z.infer<typeof CreateOrganizationMemberSettingsSchema>;
export type UpdateOrganizationMemberSettings = z.infer<typeof UpdateOrganizationMemberSettingsSchema>;

// UI-compatible types with camelCase properties
export interface UIFamilySettings {
  id?: string;
  organizationId: string;
  
  sharedCurrency: string;
  monthlyFamilyBudget?: number | null;
  
  permissions: {
    membersCanViewAllTransactions: boolean;
    membersCanEditSharedBudgets: boolean;
    membersCanCreateSharedGoals: boolean;
    requireAdminApprovalForLargeExpenses: boolean;
    largeExpenseThreshold: number;
    allowIndividualBudgets: boolean;
    spendingNotificationsEnabled: boolean;
  };
  
  createdAt?: string;
  updatedAt?: string;
  
  // Extended UI properties (from Clerk + aggregated data)
  organizationName?: string;
  memberCount?: number;
  totalMonthlySpending?: number;
  totalMonthlyIncome?: number;
  sharedGoalsCount?: number;
  sharedBudgetsCount?: number;
}

export interface UIOrganizationMemberSettings {
  id?: string;
  organizationId: string;
  userId: string;
  
  displayName?: string;
  spendingLimitPerMonth?: number;
  canViewAllAccounts: boolean;
  receiveSpendingNotifications: boolean;
  
  lastActiveAt?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Extended UI properties (from Clerk)
  userEmail?: string;
  userName?: string;
  userImageUrl?: string;
  clerkUserId?: string;
  orgRole?: "org:admin" | "org:member";
  currentMonthSpending?: number;
  isCurrentUser?: boolean;
}

// Enhanced UI types that include Clerk Organization data
export interface UIFamilyGroup {
  // Clerk Organization data
  organizationId: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  
  // Members from Clerk
  memberCount: number;
  adminCount: number;
  
  // Our settings
  settings: UIFamilySettings;
  
  // Aggregated financial data
  totalMonthlySpending: number;
  totalMonthlyIncome: number;
  budgetUtilization: number;
  sharedGoalsCount: number;
  sharedBudgetsCount: number;
  
  // Current user's role in organization
  currentUserRole: "org:admin" | "org:member";
}

export interface UIFamilyMember {
  // Clerk User data
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  
  // Clerk Organization Membership data
  role: "org:admin" | "org:member";
  joinedAt: string;
  
  // Our member settings
  settings?: UIOrganizationMemberSettings;
  
  // Aggregated data
  currentMonthSpending: number;
  accountsCount: number;
  lastTransactionDate?: string;
  
  // UI helpers
  displayName: string;
  isCurrentUser: boolean;
}

// Transform functions for database/UI conversion
export function transformFamilySettingsToUI(familySettings: FamilySettings): UIFamilySettings {
  return {
    id: familySettings.id,
    organizationId: familySettings.organization_id,
    
    sharedCurrency: familySettings.shared_currency,
    monthlyFamilyBudget: familySettings.monthly_family_budget,
    
    permissions: {
      membersCanViewAllTransactions: familySettings.permissions.members_can_view_all_transactions,
      membersCanEditSharedBudgets: familySettings.permissions.members_can_edit_shared_budgets,
      membersCanCreateSharedGoals: familySettings.permissions.members_can_create_shared_goals,
      requireAdminApprovalForLargeExpenses: familySettings.permissions.require_admin_approval_for_large_expenses,
      largeExpenseThreshold: familySettings.permissions.large_expense_threshold,
      allowIndividualBudgets: familySettings.permissions.allow_individual_budgets,
      spendingNotificationsEnabled: familySettings.permissions.spending_notifications_enabled,
    },
    
    createdAt: familySettings.created_at,
    updatedAt: familySettings.updated_at,
  };
}

export function transformUIToFamilySettings(uiFamilySettings: Partial<UIFamilySettings>): Partial<FamilySettings> {
  return {
    id: uiFamilySettings.id,
    organization_id: uiFamilySettings.organizationId,
    
    shared_currency: uiFamilySettings.sharedCurrency,
    monthly_family_budget: uiFamilySettings.monthlyFamilyBudget,
    
    permissions: uiFamilySettings.permissions ? {
      members_can_view_all_transactions: uiFamilySettings.permissions.membersCanViewAllTransactions,
      members_can_edit_shared_budgets: uiFamilySettings.permissions.membersCanEditSharedBudgets,
      members_can_create_shared_goals: uiFamilySettings.permissions.membersCanCreateSharedGoals,
      require_admin_approval_for_large_expenses: uiFamilySettings.permissions.requireAdminApprovalForLargeExpenses,
      large_expense_threshold: uiFamilySettings.permissions.largeExpenseThreshold,
      allow_individual_budgets: uiFamilySettings.permissions.allowIndividualBudgets,
      spending_notifications_enabled: uiFamilySettings.permissions.spendingNotificationsEnabled,
    } : undefined,
    
    created_at: uiFamilySettings.createdAt,
    updated_at: uiFamilySettings.updatedAt,
  };
}

export function transformOrganizationMemberSettingsToUI(memberSettings: OrganizationMemberSettings): UIOrganizationMemberSettings {
  return {
    id: memberSettings.id,
    organizationId: memberSettings.organization_id,
    userId: memberSettings.user_id,
    
    displayName: memberSettings.display_name,
    spendingLimitPerMonth: memberSettings.spending_limit_per_month,
    canViewAllAccounts: memberSettings.can_view_all_accounts,
    receiveSpendingNotifications: memberSettings.receive_spending_notifications,
    
    lastActiveAt: memberSettings.last_active_at,
    createdAt: memberSettings.created_at,
    updatedAt: memberSettings.updated_at,
  };
}

export function transformUIToOrganizationMemberSettings(uiMemberSettings: Partial<UIOrganizationMemberSettings>): Partial<OrganizationMemberSettings> {
  return {
    id: uiMemberSettings.id,
    organization_id: uiMemberSettings.organizationId,
    user_id: uiMemberSettings.userId,
    
    display_name: uiMemberSettings.displayName,
    spending_limit_per_month: uiMemberSettings.spendingLimitPerMonth,
    can_view_all_accounts: uiMemberSettings.canViewAllAccounts,
    receive_spending_notifications: uiMemberSettings.receiveSpendingNotifications,
    
    last_active_at: uiMemberSettings.lastActiveAt,
    created_at: uiMemberSettings.createdAt,
    updated_at: uiMemberSettings.updatedAt,
  };
}

// Utility functions for family permissions using Clerk roles
export function canUserPerformAction(
  userRole: "org:admin" | "org:member",
  action: string,
  familyPermissions?: UIFamilySettings['permissions']
): boolean {
  // Admin can do everything
  if (userRole === "org:admin") return true;
  
  // Member permissions depend on family settings
  if (userRole === "org:member") {
    switch (action) {
      case "view_all_transactions":
        return familyPermissions?.membersCanViewAllTransactions ?? true;
      case "edit_shared_budgets":
        return familyPermissions?.membersCanEditSharedBudgets ?? false;
      case "create_shared_goals":
        return familyPermissions?.membersCanCreateSharedGoals ?? true;
      case "create_transactions":
        return true; // Members can always create transactions
      case "view_family_dashboard":
        return true; // Members can always view dashboard
      case "edit_family_settings":
        return false; // Only admins can edit family settings
      case "invite_members":
        return false; // Only admins can invite members (handled by Clerk)
      case "remove_members":
        return false; // Only admins can remove members (handled by Clerk)
      default:
        return false;
    }
  }
  
  return false;
}

export function isUserFamilyAdmin(userRole: "org:admin" | "org:member"): boolean {
  return userRole === "org:admin";
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Helper to calculate budget utilization percentage
export function calculateBudgetUtilization(
  monthlySpending: number, 
  monthlyBudget: number | undefined
): number {
  if (!monthlyBudget || monthlyBudget === 0) return 0;
  return Math.round((monthlySpending / monthlyBudget) * 100);
}