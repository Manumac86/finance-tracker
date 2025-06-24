-- Migration: Update existing tables to support Clerk Organizations as Family Groups
-- Phase 3: Multi-User Family Support using Clerk Organizations
-- This approach leverages Clerk's built-in organization management

-- Create users table to track user organization membership (since we only have Clerk user IDs in other tables)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  active_organization_id VARCHAR(255),
  email VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for organization lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(active_organization_id) 
WHERE active_organization_id IS NOT NULL;

-- Update goals table to support organization shared goals
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS shared_contributors JSONB DEFAULT '[]'::JSONB;

-- Update budgets table to support organization shared budgets
ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS shared_contributors JSONB DEFAULT '[]'::JSONB;

-- Update transactions table to support organization context
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);

-- Update categories table to support organization shared categories
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);

-- Create family settings table to store organization-specific financial settings
CREATE TABLE IF NOT EXISTS family_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Family financial settings
  shared_currency VARCHAR(3) DEFAULT 'USD',
  monthly_family_budget DECIMAL(12,2),
  
  -- Family permissions and rules
  permissions JSONB DEFAULT '{
    "members_can_view_all_transactions": true,
    "members_can_edit_shared_budgets": false,
    "members_can_create_shared_goals": true,
    "require_admin_approval_for_large_expenses": false,
    "large_expense_threshold": 100.00,
    "allow_individual_budgets": true,
    "spending_notifications_enabled": true
  }'::JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organization member settings table for user-specific settings within organizations
CREATE TABLE IF NOT EXISTS organization_member_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Member-specific settings
  display_name VARCHAR(255),
  spending_limit_per_month DECIMAL(12,2),
  can_view_all_accounts BOOLEAN DEFAULT FALSE,
  receive_spending_notifications BOOLEAN DEFAULT TRUE,
  
  -- Member status tracking
  last_active_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique user per organization
  UNIQUE(organization_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_goals_organization_shared ON goals(organization_id) WHERE is_shared = TRUE;
CREATE INDEX IF NOT EXISTS idx_budgets_organization_shared ON budgets(organization_id) WHERE is_shared = TRUE;
CREATE INDEX IF NOT EXISTS idx_transactions_organization ON transactions(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_organization_shared ON categories(organization_id) WHERE is_shared = TRUE;
CREATE INDEX IF NOT EXISTS idx_family_settings_organization ON family_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_member_settings_organization ON organization_member_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_member_settings_user ON organization_member_settings(user_id);

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to organization tables
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_settings_updated_at 
    BEFORE UPDATE ON family_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_member_settings_updated_at 
    BEFORE UPDATE ON organization_member_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE family_settings IS 'Organization-specific family financial settings and permissions';
COMMENT ON TABLE organization_member_settings IS 'User-specific settings within family organizations';

COMMENT ON COLUMN family_settings.organization_id IS 'Clerk organization ID for the family group';
COMMENT ON COLUMN family_settings.permissions IS 'JSONB object containing family-wide permission settings';
COMMENT ON COLUMN organization_member_settings.organization_id IS 'Clerk organization ID';
COMMENT ON COLUMN organization_member_settings.user_id IS 'Internal user ID (not Clerk user ID)';

-- Create view for family dashboard data
CREATE OR REPLACE VIEW family_dashboard_view AS
SELECT 
  fs.organization_id,
  fs.shared_currency,
  fs.monthly_family_budget,
  fs.permissions,
  COUNT(DISTINCT oms.user_id) as member_count,
  COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' 
                   AND DATE_TRUNC('month', t.transaction_date::date) = DATE_TRUNC('month', CURRENT_DATE)
                   THEN t.amount ELSE 0 END), 0) as monthly_expenses,
  COALESCE(SUM(CASE WHEN t.transaction_type = 'income' 
                   AND DATE_TRUNC('month', t.transaction_date::date) = DATE_TRUNC('month', CURRENT_DATE)
                   THEN t.amount ELSE 0 END), 0) as monthly_income,
  COUNT(DISTINCT CASE WHEN g.is_shared = TRUE THEN g.id END) as shared_goals_count,
  COUNT(DISTINCT CASE WHEN b.is_shared = TRUE THEN b.id END) as shared_budgets_count
FROM family_settings fs
LEFT JOIN organization_member_settings oms ON fs.organization_id = oms.organization_id
LEFT JOIN users u ON oms.user_id = u.id
LEFT JOIN transactions t ON u.clerk_id = t.user_id 
LEFT JOIN goals g ON fs.organization_id = g.organization_id
LEFT JOIN budgets b ON fs.organization_id = b.organization_id
GROUP BY fs.organization_id, fs.shared_currency, fs.monthly_family_budget, fs.permissions;

COMMENT ON VIEW family_dashboard_view IS 'Aggregated family financial data for dashboard display';