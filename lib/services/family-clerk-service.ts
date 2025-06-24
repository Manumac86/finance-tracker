import { query } from '@/lib/db/postgres';
import { 
  CreateFamilySettings,
  UpdateFamilySettings,
  CreateOrganizationMemberSettings,
  UpdateOrganizationMemberSettings,
  FamilySettings,
  OrganizationMemberSettings,
  transformFamilySettingsToUI,
  transformOrganizationMemberSettingsToUI,
  UIFamilySettings,
  UIOrganizationMemberSettings,
  UIFamilyGroup,
  UIFamilyMember
} from '@/lib/db/schemas/family-clerk';
import { clerkClient } from '@clerk/nextjs/server';

// Type definitions for database results
interface DatabaseFamilySettings {
  id: string;
  organization_id: string;
  shared_currency: string;
  monthly_family_budget?: number;
  permissions: {
    members_can_view_all_transactions: boolean;
    members_can_edit_shared_budgets: boolean;
    members_can_create_shared_goals: boolean;
    require_admin_approval_for_large_expenses: boolean;
    large_expense_threshold: number;
    allow_individual_budgets: boolean;
    spending_notifications_enabled: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

interface DatabaseOrganizationMemberSettings {
  id?: string;
  organization_id: string;
  user_id: string;
  display_name?: string;
  spending_limit_per_month?: number;
  can_view_all_accounts: boolean;
  receive_spending_notifications: boolean;
  last_active_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface SpendingQueryResult {
  spending: string;
}

interface TransactionDateQueryResult {
  last_date?: string;
}

interface FinancialStatsQueryResult {
  total: string;
}

interface BudgetQueryResult {
  monthly_family_budget?: string;
}

interface CountQueryResult {
  count: string;
}

// Family Settings Operations (linked to Clerk Organizations)
export async function createFamilySettings(
  organizationId: string,
  familySettingsData: CreateFamilySettings
): Promise<UIFamilySettings> {
  const result = await query<DatabaseFamilySettings>(
    `INSERT INTO family_settings (organization_id, shared_currency, monthly_family_budget, permissions)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      organizationId,
      familySettingsData.shared_currency,
      familySettingsData.monthly_family_budget,
      JSON.stringify(familySettingsData.permissions),
    ]
  );

  return transformFamilySettingsToUI(result[0]);
}

export async function getFamilySettingsByOrgId(organizationId: string): Promise<UIFamilySettings | null> {
  try {
    const result = await query<DatabaseFamilySettings>(
      'SELECT * FROM family_settings WHERE organization_id = $1',
      [organizationId]
    );

    if (result.length === 0) {
      // Create default settings if none exist
      return createFamilySettings(organizationId, {
        organization_id: organizationId,
        shared_currency: 'USD',
        permissions: {
          members_can_view_all_transactions: true,
          members_can_edit_shared_budgets: false,
          members_can_create_shared_goals: true,
          require_admin_approval_for_large_expenses: false,
          large_expense_threshold: 100.00,
          allow_individual_budgets: true,
          spending_notifications_enabled: true,
        }
      });
    }

    return transformFamilySettingsToUI(result[0]);
  } catch (error) {
    console.error('Error getting family settings:', error);
    // Return default settings if database error
    return {
      id: 'default',
      organizationId,
      sharedCurrency: 'USD',
      monthlyFamilyBudget: undefined,
      permissions: {
        membersCanViewAllTransactions: true,
        membersCanEditSharedBudgets: false,
        membersCanCreateSharedGoals: true,
        requireAdminApprovalForLargeExpenses: false,
        largeExpenseThreshold: 100.00,
        allowIndividualBudgets: true,
        spendingNotificationsEnabled: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export async function updateFamilySettings(
  organizationId: string,
  updateData: UpdateFamilySettings
): Promise<UIFamilySettings | null> {
  // Convert snake_case updateData to the proper database format
  const dbUpdateData: Partial<FamilySettings> = {};
  
  if (updateData.shared_currency !== undefined) {
    dbUpdateData.shared_currency = updateData.shared_currency;
  }
  
  if (updateData.monthly_family_budget !== undefined) {
    dbUpdateData.monthly_family_budget = updateData.monthly_family_budget;
  }
  
  if (updateData.permissions !== undefined) {
    dbUpdateData.permissions = updateData.permissions as FamilySettings['permissions'];
  }
  
  const setParts: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  Object.entries(dbUpdateData).forEach(([key, value]) => {
    if (value !== undefined && key !== 'organization_id') {
      if (key === 'permissions' && value) {
        setParts.push(`${key} = $${paramIndex}`);
        values.push(JSON.stringify(value));
        paramIndex++;
      } else if (key !== 'permissions') {
        setParts.push(`${key} = $${paramIndex}`);
        // Handle null values explicitly for monthly_family_budget
        values.push(value === null ? null : value);
        paramIndex++;
      }
    }
  });

  if (setParts.length === 0) {
    return getFamilySettingsByOrgId(organizationId);
  }

  setParts.push(`updated_at = NOW()`);
  values.push(organizationId);

  const result = await query<DatabaseFamilySettings>(
    `UPDATE family_settings SET ${setParts.join(', ')} WHERE organization_id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.length === 0) return null;

  return transformFamilySettingsToUI(result[0]);
}

// Organization Member Settings Operations
export async function createOrganizationMemberSettings(
  organizationId: string,
  userId: string,
  settingsData: Partial<CreateOrganizationMemberSettings> = {}
): Promise<UIOrganizationMemberSettings> {
  const result = await query<DatabaseOrganizationMemberSettings>(
    `INSERT INTO organization_member_settings 
     (organization_id, user_id, display_name, spending_limit_per_month, can_view_all_accounts, receive_spending_notifications)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      organizationId,
      userId,
      settingsData.display_name,
      settingsData.spending_limit_per_month,
      settingsData.can_view_all_accounts ?? false,
      settingsData.receive_spending_notifications ?? true,
    ]
  );

  return transformOrganizationMemberSettingsToUI(result[0]);
}

export async function getOrganizationMemberSettings(
  organizationId: string,
  userId: string
): Promise<UIOrganizationMemberSettings | null> {
  const result = await query<DatabaseOrganizationMemberSettings>(
    'SELECT * FROM organization_member_settings WHERE organization_id = $1 AND user_id = $2',
    [organizationId, userId]
  );

  if (result.length === 0) {
    // Create default settings if none exist
    return createOrganizationMemberSettings(organizationId, userId);
  }

  return transformOrganizationMemberSettingsToUI(result[0]);
}

export async function updateOrganizationMemberSettings(
  organizationId: string,
  userId: string,
  updateData: UpdateOrganizationMemberSettings
): Promise<UIOrganizationMemberSettings | null> {
  // Convert the updateData to the proper database format directly
  const dbUpdateData: Partial<OrganizationMemberSettings> = {
    display_name: updateData.display_name,
    spending_limit_per_month: updateData.spending_limit_per_month,
    can_view_all_accounts: updateData.can_view_all_accounts,
    receive_spending_notifications: updateData.receive_spending_notifications,
  };
  
  const setParts: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  Object.entries(dbUpdateData).forEach(([key, value]) => {
    if (value !== undefined && !['organization_id', 'user_id'].includes(key)) {
      setParts.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (setParts.length === 0) {
    return getOrganizationMemberSettings(organizationId, userId);
  }

  setParts.push(`updated_at = NOW()`, `last_active_at = NOW()`);
  values.push(organizationId, userId);

  const result = await query<DatabaseOrganizationMemberSettings>(
    `UPDATE organization_member_settings SET ${setParts.join(', ')} 
     WHERE organization_id = $${paramIndex} AND user_id = $${paramIndex + 1} 
     RETURNING *`,
    values
  );

  if (result.length === 0) return null;

  return transformOrganizationMemberSettingsToUI(result[0]);
}

// Combined operations that include Clerk data
export async function getFamilyGroupWithClerkData(
  organizationId: string,
  currentUserId: string
): Promise<UIFamilyGroup | null> {
  try {
    // Get Clerk organization data
    const clerkClientInstance = await clerkClient();
    const organization = await clerkClientInstance.organizations.getOrganization({ organizationId });
    
    // Get organization membership list to get member count and current user role
    const memberships = await clerkClientInstance.organizations.getOrganizationMembershipList({ 
      organizationId,
      limit: 100 
    });
    
    const membershipData = memberships.data || [];
    
    // Find current user's role
    const currentUserMembership = membershipData.find(m => m.publicUserData?.userId === currentUserId);
    const currentUserRole = currentUserMembership?.role as "org:admin" | "org:member" || "org:member";
    
    // Get family settings
    const settings = await getFamilySettingsByOrgId(organizationId);
    if (!settings) return null;
    
    // Get aggregated financial data
    const stats = await getFamilyFinancialStats(organizationId);
    
    const adminCount = membershipData.filter(m => m.role === "org:admin").length;
    
    return {
      organizationId: organization.id,
      name: organization.name,
      slug: organization.slug,
      imageUrl: organization.imageUrl,
      createdAt: new Date(organization.createdAt).toISOString(),
      updatedAt: new Date(organization.updatedAt).toISOString(),
      
      memberCount: membershipData.length,
      adminCount,
      
      settings,
      
      totalMonthlySpending: stats.totalMonthlySpending,
      totalMonthlyIncome: stats.totalMonthlyIncome,
      budgetUtilization: stats.budgetUtilization,
      sharedGoalsCount: stats.sharedGoalsCount,
      sharedBudgetsCount: stats.sharedBudgetsCount,
      
      currentUserRole,
    };
  } catch (error) {
    console.error('Error getting family group with Clerk data:', error);
    return null;
  }
}

export async function getFamilyMembersWithClerkData(
  organizationId: string,
  currentUserId: string
): Promise<UIFamilyMember[]> {
  try {
    // Get Clerk organization memberships
    const clerkClientInstance = await clerkClient();
    const memberships = await clerkClientInstance.organizations.getOrganizationMembershipList({ 
      organizationId,
      limit: 100 
    });
    
    const membershipData = memberships.data || [];
    const familyMembers: UIFamilyMember[] = [];
    
    for (const membership of membershipData) {
      const clerkUserId = membership.publicUserData?.userId;
      if (!clerkUserId) continue;
      
      // Ensure user exists and get internal user ID
      const internalUserId = await ensureUserExists(clerkUserId);
      
      // Get member settings
      const memberSettings = await getOrganizationMemberSettings(organizationId, internalUserId);
      
      // Get member spending data (using Clerk user ID for transactions)
      const spendingResult = await query<SpendingQueryResult>(
        `SELECT COALESCE(SUM(amount), 0) as spending
         FROM transactions 
         WHERE user_id = $1 
         AND transaction_type = 'expense'
         AND DATE_TRUNC('month', transaction_date::date) = DATE_TRUNC('month', CURRENT_DATE)`,
        [clerkUserId]
      );
      
      // Note: accounts table might not exist yet, using placeholder
      const accountsResult: CountQueryResult[] = [{ count: '0' }];
      
      const lastTransactionResult = await query<TransactionDateQueryResult>(
        'SELECT MAX(transaction_date) as last_date FROM transactions WHERE user_id = $1',
        [clerkUserId]
      );
      
      const displayName = memberSettings?.displayName || 
        membership.publicUserData?.firstName ? 
        `${membership.publicUserData.firstName} ${membership.publicUserData?.lastName || ''}`.trim() :
        membership.publicUserData?.identifier || 'Unknown';
      
      familyMembers.push({
        clerkUserId,
        email: membership.publicUserData?.identifier || '',
        firstName: membership.publicUserData?.firstName || undefined,
        lastName: membership.publicUserData?.lastName || undefined,
        imageUrl: membership.publicUserData?.imageUrl || undefined,
        
        role: membership.role as "org:admin" | "org:member",
        joinedAt: new Date(membership.createdAt).toISOString(),
        
        settings: memberSettings || undefined,
        
        currentMonthSpending: parseFloat(spendingResult[0]?.spending || '0'),
        accountsCount: parseInt(accountsResult[0]?.count || '0'),
        lastTransactionDate: lastTransactionResult[0]?.last_date || undefined,
        
        displayName,
        isCurrentUser: clerkUserId === currentUserId,
      });
    }
    
    // Sort by role (admins first) then by join date
    return familyMembers.sort((a, b) => {
      if (a.role !== b.role) {
        return a.role === "org:admin" ? -1 : 1;
      }
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });
    
  } catch (error) {
    console.error('Error getting family members with Clerk data:', error);
    return [];
  }
}

// Utility functions
export async function getFamilyFinancialStats(organizationId: string): Promise<{
  totalMonthlySpending: number;
  totalMonthlyIncome: number;
  budgetUtilization: number;
  sharedGoalsCount: number;
  sharedBudgetsCount: number;
}> {
  try {
    const [spending, income, budget, goals, budgets] = await Promise.all([
      query<FinancialStatsQueryResult>(
        `SELECT COALESCE(SUM(t.amount), 0) as total
         FROM transactions t
         JOIN users u ON t.user_id = u.clerk_id
         WHERE u.active_organization_id = $1 
         AND t.transaction_type = 'expense'
         AND DATE_TRUNC('month', t.transaction_date::date) = DATE_TRUNC('month', CURRENT_DATE)`,
        [organizationId]
      ),
      query<FinancialStatsQueryResult>(
        `SELECT COALESCE(SUM(t.amount), 0) as total
         FROM transactions t
         JOIN users u ON t.user_id = u.clerk_id
         WHERE u.active_organization_id = $1 
         AND t.transaction_type = 'income'
         AND DATE_TRUNC('month', t.transaction_date::date) = DATE_TRUNC('month', CURRENT_DATE)`,
        [organizationId]
      ),
      query<BudgetQueryResult>(
        'SELECT monthly_family_budget FROM family_settings WHERE organization_id = $1',
        [organizationId]
      ),
      query<CountQueryResult>(
        'SELECT COUNT(*) as count FROM goals WHERE organization_id = $1 AND is_shared = TRUE',
        [organizationId]
      ),
      query<CountQueryResult>(
        'SELECT COUNT(*) as count FROM budgets WHERE organization_id = $1 AND is_shared = TRUE',
        [organizationId]
      ),
    ]);

    const totalMonthlySpending = parseFloat(spending[0]?.total || '0');
    const totalMonthlyIncome = parseFloat(income[0]?.total || '0');
    const monthlyBudget = parseFloat(budget[0]?.monthly_family_budget || '0');
    
    const budgetUtilization = monthlyBudget > 0 ? 
      Math.round((totalMonthlySpending / monthlyBudget) * 100) : 0;

    return {
      totalMonthlySpending,
      totalMonthlyIncome,
      budgetUtilization,
      sharedGoalsCount: parseInt(goals[0]?.count || '0'),
      sharedBudgetsCount: parseInt(budgets[0]?.count || '0'),
    };
  } catch (error) {
    console.error('Error getting family financial stats:', error);
    // Return default stats if database error
    return {
      totalMonthlySpending: 0,
      totalMonthlyIncome: 0,
      budgetUtilization: 0,
      sharedGoalsCount: 0,
      sharedBudgetsCount: 0,
    };
  }
}

export async function updateUserActiveOrganization(
  userId: string, 
  organizationId: string | null
): Promise<void> {
  await query<never>(
    'UPDATE users SET active_organization_id = $1 WHERE id = $2',
    [organizationId, userId]
  );
}

interface UserOrgQueryResult {
  active_organization_id: string | null;
}

export async function getUserActiveOrganization(userId: string): Promise<string | null> {
  try {
    const result = await query<UserOrgQueryResult>(
      'SELECT active_organization_id FROM users WHERE id = $1',
      [userId]
    );
    
    return result.length > 0 ? result[0].active_organization_id : null;
  } catch (error) {
    console.error('Error getting user active organization:', error);
    // Return null if database error occurs
    return null;
  }
}

// Helper function to ensure user has organization member settings
export async function ensureOrganizationMemberSettings(
  organizationId: string,
  userId: string
): Promise<UIOrganizationMemberSettings> {
  const existing = await getOrganizationMemberSettings(organizationId, userId);
  if (existing) return existing;
  
  return createOrganizationMemberSettings(organizationId, userId);
}

interface UserIdQueryResult {
  id: string;
}

// Helper function to ensure user exists in users table
export async function ensureUserExists(clerkUserId: string): Promise<string> {
  try {
    // Check if user already exists
    const existingUser = await query<UserIdQueryResult>(
      'SELECT id FROM users WHERE clerk_id = $1',
      [clerkUserId]
    );

    if (existingUser.length > 0) {
      return existingUser[0].id;
    }

    // Get user data from Clerk
    const clerkClientInstance = await clerkClient();
    const user = await clerkClientInstance.users.getUser(clerkUserId);

    // Create user in our database
    const result = await query<UserIdQueryResult>(
      `INSERT INTO users (clerk_id, email, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        clerkUserId,
        user.emailAddresses[0]?.emailAddress || null,
        user.firstName || null,
        user.lastName || null,
      ]
    );

    return result[0].id;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    // If there's a database error, return a fallback ID based on clerk ID
    // This is a temporary solution while the database setup is being completed
    return clerkUserId;
  }
}