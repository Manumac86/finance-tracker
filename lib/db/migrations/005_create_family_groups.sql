-- Migration: Create family groups table
-- Phase 3: Multi-User Family Support
-- Supports family collaboration features with role-based permissions

-- Family Groups table
CREATE TABLE IF NOT EXISTS family_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT,
  
  -- Family settings and permissions
  permissions JSONB DEFAULT '{
    "members_can_view_all_transactions": true,
    "members_can_edit_shared_budgets": false,
    "members_can_create_shared_goals": true,
    "require_admin_approval_for_large_expenses": false,
    "large_expense_threshold": 100.00
  }'::JSONB,
  
  -- Family financial settings
  shared_currency VARCHAR(3) DEFAULT 'USD',
  monthly_family_budget DECIMAL(12,2),
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family Members junction table (many-to-many with roles)
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Role-based permissions
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  
  -- Member-specific settings
  display_name VARCHAR(255),
  can_view_all_accounts BOOLEAN DEFAULT FALSE,
  can_edit_shared_budgets BOOLEAN DEFAULT FALSE,
  can_create_transactions BOOLEAN DEFAULT TRUE,
  spending_limit_per_month DECIMAL(12,2),
  
  -- Member status
  invitation_status VARCHAR(50) DEFAULT 'active' CHECK (invitation_status IN ('pending', 'active', 'suspended')),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  last_active_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique user per family group
  UNIQUE(family_group_id, user_id)
);

-- Family Invitations table (for pending invitations)
CREATE TABLE IF NOT EXISTS family_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_group_id UUID NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
  invited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Invitation details
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  
  -- Invitation message
  personal_message TEXT,
  
  -- Status and expiration
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add family_group_id to existing tables for shared resources

-- Update users table to include family group reference
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS family_group_id UUID REFERENCES family_groups(id) ON DELETE SET NULL;

-- Update goals table to support family shared goals
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS family_group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS shared_contributors JSONB DEFAULT '[]'::JSONB;

-- Update budgets table to support family shared budgets
ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS family_group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS shared_contributors JSONB DEFAULT '[]'::JSONB;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_groups_admin ON family_groups(admin_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family_group ON family_members(family_group_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_role ON family_members(role);
CREATE INDEX IF NOT EXISTS idx_family_invitations_family_group ON family_invitations(family_group_id);
CREATE INDEX IF NOT EXISTS idx_family_invitations_email ON family_invitations(email);
CREATE INDEX IF NOT EXISTS idx_family_invitations_token ON family_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_family_invitations_status ON family_invitations(status);

-- Create indexes for updated tables
CREATE INDEX IF NOT EXISTS idx_users_family_group ON users(family_group_id) WHERE family_group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_goals_family_shared ON goals(family_group_id) WHERE is_shared = TRUE;
CREATE INDEX IF NOT EXISTS idx_budgets_family_shared ON budgets(family_group_id) WHERE is_shared = TRUE;

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to family tables
CREATE TRIGGER update_family_groups_updated_at 
    BEFORE UPDATE ON family_groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at 
    BEFORE UPDATE ON family_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_invitations_updated_at 
    BEFORE UPDATE ON family_invitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE family_groups IS 'Family groups for shared financial management';
COMMENT ON TABLE family_members IS 'Family group membership with role-based permissions';
COMMENT ON TABLE family_invitations IS 'Pending family group invitations';

COMMENT ON COLUMN family_groups.permissions IS 'JSONB object containing family-wide permission settings';
COMMENT ON COLUMN family_members.role IS 'User role within the family group: admin, member, or viewer';
COMMENT ON COLUMN family_invitations.invitation_token IS 'Secure token for accepting family invitations';