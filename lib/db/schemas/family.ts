import { z } from "zod";

// Note: Using Clerk Organizations for family management
// Roles are managed by Clerk: "org:admin", "org:member"
export const ClerkOrgRoleEnum = z.enum(["org:admin", "org:member"]);

// Family role enums for the old schema (keeping for backward compatibility)
export const FamilyRoleEnum = z.enum(["admin", "member", "viewer"]);
export const MemberStatusEnum = z.enum(["pending", "active", "suspended"]);
export const InvitationStatusEnum = z.enum(["pending", "accepted", "declined", "expired"]);

// Family Group Schema
export const FamilyGroupSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Family group name is required").max(255),
  admin_id: z.string().uuid(),
  description: z.string().optional(),
  
  // Permissions settings
  permissions: z.object({
    members_can_view_all_transactions: z.boolean().default(true),
    members_can_edit_shared_budgets: z.boolean().default(false),
    members_can_create_shared_goals: z.boolean().default(true),
    require_admin_approval_for_large_expenses: z.boolean().default(false),
    large_expense_threshold: z.number().positive().default(100.00),
  }).default({
    members_can_view_all_transactions: true,
    members_can_edit_shared_budgets: false,
    members_can_create_shared_goals: true,
    require_admin_approval_for_large_expenses: false,
    large_expense_threshold: 100.00,
  }),
  
  // Family settings
  shared_currency: z.string().length(3).default("USD"),
  monthly_family_budget: z.number().positive().optional(),
  
  // Status
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Family Member Schema
export const FamilyMemberSchema = z.object({
  id: z.string().uuid().optional(),
  family_group_id: z.string().uuid(),
  user_id: z.string().uuid(),
  
  // Role and permissions
  role: FamilyRoleEnum,
  display_name: z.string().max(255).optional(),
  can_view_all_accounts: z.boolean().default(false),
  can_edit_shared_budgets: z.boolean().default(false),
  can_create_transactions: z.boolean().default(true),
  spending_limit_per_month: z.number().positive().optional(),
  
  // Status
  invitation_status: MemberStatusEnum.default("active"),
  invited_at: z.string().optional(),
  joined_at: z.string().optional(),
  last_active_at: z.string().optional(),
  
  // Timestamps
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Family Invitation Schema
export const FamilyInvitationSchema = z.object({
  id: z.string().uuid().optional(),
  family_group_id: z.string().uuid(),
  invited_by_user_id: z.string().uuid(),
  
  // Invitation details
  email: z.string().email("Valid email address required"),
  role: FamilyRoleEnum,
  invitation_token: z.string(),
  personal_message: z.string().optional(),
  
  // Status and timing
  status: InvitationStatusEnum.default("pending"),
  expires_at: z.string().optional(),
  accepted_at: z.string().optional(),
  
  // Timestamps
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Create Family Group Schema (for API)
export const CreateFamilyGroupSchema = FamilyGroupSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// Update Family Group Schema
export const UpdateFamilyGroupSchema = FamilyGroupSchema.partial().omit({
  id: true,
  admin_id: true,
  created_at: true,
  updated_at: true,
});

// Invite Family Member Schema
export const InviteFamilyMemberSchema = z.object({
  email: z.string().email("Valid email address required"),
  role: FamilyRoleEnum,
  personal_message: z.string().max(500).optional(),
  spending_limit_per_month: z.number().positive().optional(),
});

// Update Family Member Schema
export const UpdateFamilyMemberSchema = FamilyMemberSchema.partial().omit({
  id: true,
  family_group_id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

// Type exports
export type FamilyGroup = z.infer<typeof FamilyGroupSchema>;
export type FamilyMember = z.infer<typeof FamilyMemberSchema>;
export type FamilyInvitation = z.infer<typeof FamilyInvitationSchema>;
export type CreateFamilyGroup = z.infer<typeof CreateFamilyGroupSchema>;
export type UpdateFamilyGroup = z.infer<typeof UpdateFamilyGroupSchema>;
export type InviteFamilyMember = z.infer<typeof InviteFamilyMemberSchema>;
export type UpdateFamilyMember = z.infer<typeof UpdateFamilyMemberSchema>;

// UI-compatible types with camelCase properties
export interface UIFamilyGroup {
  id?: string;
  name: string;
  adminId: string;
  description?: string;
  
  permissions: {
    membersCanViewAllTransactions: boolean;
    membersCanEditSharedBudgets: boolean;
    membersCanCreateSharedGoals: boolean;
    requireAdminApprovalForLargeExpenses: boolean;
    largeExpenseThreshold: number;
  };
  
  sharedCurrency: string;
  monthlyFamilyBudget?: number;
  
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  
  // Extended UI properties
  memberCount?: number;
  totalMonthlySpending?: number;
  adminName?: string;
}

export interface UIFamilyMember {
  id?: string;
  familyGroupId: string;
  userId: string;
  
  role: "admin" | "member" | "viewer";
  displayName?: string;
  canViewAllAccounts: boolean;
  canEditSharedBudgets: boolean;
  canCreateTransactions: boolean;
  spendingLimitPerMonth?: number;
  
  invitationStatus: "pending" | "active" | "suspended";
  invitedAt?: string;
  joinedAt?: string;
  lastActiveAt?: string;
  
  createdAt?: string;
  updatedAt?: string;
  
  // Extended UI properties
  userEmail?: string;
  userName?: string;
  currentMonthSpending?: number;
  isCurrentUser?: boolean;
}

export interface UIFamilyInvitation {
  id?: string;
  familyGroupId: string;
  invitedByUserId: string;
  
  email: string;
  role: "admin" | "member" | "viewer";
  invitationToken: string;
  personalMessage?: string;
  
  status: "pending" | "accepted" | "declined" | "expired";
  expiresAt?: string;
  acceptedAt?: string;
  
  createdAt?: string;
  updatedAt?: string;
  
  // Extended UI properties
  invitedByName?: string;
  familyGroupName?: string;
  daysUntilExpiry?: number;
  isExpired?: boolean;
}

// Transform functions for database/UI conversion
export function transformFamilyGroupToUI(familyGroup: FamilyGroup): UIFamilyGroup {
  return {
    id: familyGroup.id,
    name: familyGroup.name,
    adminId: familyGroup.admin_id,
    description: familyGroup.description,
    
    permissions: {
      membersCanViewAllTransactions: familyGroup.permissions.members_can_view_all_transactions,
      membersCanEditSharedBudgets: familyGroup.permissions.members_can_edit_shared_budgets,
      membersCanCreateSharedGoals: familyGroup.permissions.members_can_create_shared_goals,
      requireAdminApprovalForLargeExpenses: familyGroup.permissions.require_admin_approval_for_large_expenses,
      largeExpenseThreshold: familyGroup.permissions.large_expense_threshold,
    },
    
    sharedCurrency: familyGroup.shared_currency,
    monthlyFamilyBudget: familyGroup.monthly_family_budget,
    
    isActive: familyGroup.is_active,
    createdAt: familyGroup.created_at,
    updatedAt: familyGroup.updated_at,
  };
}

export function transformUIToFamilyGroup(uiFamilyGroup: Partial<UIFamilyGroup>): Partial<FamilyGroup> {
  return {
    id: uiFamilyGroup.id,
    name: uiFamilyGroup.name,
    admin_id: uiFamilyGroup.adminId,
    description: uiFamilyGroup.description,
    
    permissions: uiFamilyGroup.permissions ? {
      members_can_view_all_transactions: uiFamilyGroup.permissions.membersCanViewAllTransactions,
      members_can_edit_shared_budgets: uiFamilyGroup.permissions.membersCanEditSharedBudgets,
      members_can_create_shared_goals: uiFamilyGroup.permissions.membersCanCreateSharedGoals,
      require_admin_approval_for_large_expenses: uiFamilyGroup.permissions.requireAdminApprovalForLargeExpenses,
      large_expense_threshold: uiFamilyGroup.permissions.largeExpenseThreshold,
    } : undefined,
    
    shared_currency: uiFamilyGroup.sharedCurrency,
    monthly_family_budget: uiFamilyGroup.monthlyFamilyBudget,
    
    is_active: uiFamilyGroup.isActive,
    created_at: uiFamilyGroup.createdAt,
    updated_at: uiFamilyGroup.updatedAt,
  };
}

export function transformFamilyMemberToUI(familyMember: FamilyMember): UIFamilyMember {
  return {
    id: familyMember.id,
    familyGroupId: familyMember.family_group_id,
    userId: familyMember.user_id,
    
    role: familyMember.role,
    displayName: familyMember.display_name,
    canViewAllAccounts: familyMember.can_view_all_accounts,
    canEditSharedBudgets: familyMember.can_edit_shared_budgets,
    canCreateTransactions: familyMember.can_create_transactions,
    spendingLimitPerMonth: familyMember.spending_limit_per_month,
    
    invitationStatus: familyMember.invitation_status,
    invitedAt: familyMember.invited_at,
    joinedAt: familyMember.joined_at,
    lastActiveAt: familyMember.last_active_at,
    
    createdAt: familyMember.created_at,
    updatedAt: familyMember.updated_at,
  };
}

export function transformUIToFamilyMember(uiFamilyMember: Partial<UIFamilyMember>): Partial<FamilyMember> {
  return {
    id: uiFamilyMember.id,
    family_group_id: uiFamilyMember.familyGroupId,
    user_id: uiFamilyMember.userId,
    
    role: uiFamilyMember.role,
    display_name: uiFamilyMember.displayName,
    can_view_all_accounts: uiFamilyMember.canViewAllAccounts,
    can_edit_shared_budgets: uiFamilyMember.canEditSharedBudgets,
    can_create_transactions: uiFamilyMember.canCreateTransactions,
    spending_limit_per_month: uiFamilyMember.spendingLimitPerMonth,
    
    invitation_status: uiFamilyMember.invitationStatus,
    invited_at: uiFamilyMember.invitedAt,
    joined_at: uiFamilyMember.joinedAt,
    last_active_at: uiFamilyMember.lastActiveAt,
    
    created_at: uiFamilyMember.createdAt,
    updated_at: uiFamilyMember.updatedAt,
  };
}

export function transformFamilyInvitationToUI(familyInvitation: FamilyInvitation): UIFamilyInvitation {
  // Calculate days until expiry
  const daysUntilExpiry = familyInvitation.expires_at 
    ? Math.ceil((new Date(familyInvitation.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : undefined;
  
  const isExpired = daysUntilExpiry !== undefined && daysUntilExpiry <= 0;

  return {
    id: familyInvitation.id,
    familyGroupId: familyInvitation.family_group_id,
    invitedByUserId: familyInvitation.invited_by_user_id,
    
    email: familyInvitation.email,
    role: familyInvitation.role,
    invitationToken: familyInvitation.invitation_token,
    personalMessage: familyInvitation.personal_message,
    
    status: familyInvitation.status,
    expiresAt: familyInvitation.expires_at,
    acceptedAt: familyInvitation.accepted_at,
    
    createdAt: familyInvitation.created_at,
    updatedAt: familyInvitation.updated_at,
    
    daysUntilExpiry,
    isExpired,
  };
}

// Utility functions for family permissions
export function canUserPerformAction(
  userRole: "admin" | "member" | "viewer",
  action: string,
  familyPermissions?: UIFamilyGroup['permissions']
): boolean {
  // Admin can do everything
  if (userRole === "admin") return true;
  
  // Viewer can only view
  if (userRole === "viewer") {
    return action.startsWith("view") || action.startsWith("read");
  }
  
  // Member permissions depend on family settings
  if (userRole === "member") {
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
      default:
        return false;
    }
  }
  
  return false;
}

export function generateInvitationToken(): string {
  // Generate a secure random token for invitations
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function isInvitationExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export function calculateInvitationExpiryDate(daysFromNow: number = 7): string {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysFromNow);
  return expiryDate.toISOString();
}