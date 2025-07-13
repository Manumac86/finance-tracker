-- Complete Balance History Migration
-- Run this if you've already partially run the migration and got a policy error

-- First, ensure the table exists (safe to run multiple times)
CREATE TABLE IF NOT EXISTS account_balance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    
    -- Balance information
    balance_before DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    balance_change DECIMAL(12,2) NOT NULL,
    
    -- Change source
    transaction_id UUID,
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('transaction', 'manual_adjustment', 'correction', 'initial')),
    description VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_account_balance_history_account 
        FOREIGN KEY (account_id) REFERENCES manual_accounts(id) ON DELETE CASCADE
);

-- Create indexes (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_account_balance_history_account_id ON account_balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_user_id ON account_balance_history(user_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_created_at ON account_balance_history(created_at);

-- Enable RLS (safe to run multiple times)
ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the RLS policy (handles existing policy error)
DROP POLICY IF EXISTS account_balance_history_user_policy ON account_balance_history;

CREATE POLICY account_balance_history_user_policy ON account_balance_history
FOR ALL
USING (
    account_id IN (
        SELECT id FROM manual_accounts WHERE user_id = auth.uid()::VARCHAR
    )
);

-- Create or replace the balance history function
CREATE OR REPLACE FUNCTION create_balance_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history entry if balance actually changed
    IF OLD.current_balance IS DISTINCT FROM NEW.current_balance THEN
        INSERT INTO account_balance_history (
            account_id,
            user_id,
            balance_before,
            balance_after,
            balance_change,
            change_type,
            description
        ) VALUES (
            NEW.id,
            NEW.user_id,
            COALESCE(OLD.current_balance, 0),
            NEW.current_balance,
            NEW.current_balance - COALESCE(OLD.current_balance, 0),
            CASE 
                WHEN OLD.current_balance IS NULL THEN 'initial'
                ELSE 'manual_adjustment'
            END,
            'Balance updated'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger (handles existing trigger)
DROP TRIGGER IF EXISTS trigger_create_balance_history ON manual_accounts;

CREATE TRIGGER trigger_create_balance_history
    AFTER INSERT OR UPDATE OF current_balance ON manual_accounts
    FOR EACH ROW
    EXECUTE FUNCTION create_balance_history();

-- Verify the setup
SELECT 'Balance history migration completed successfully!' as status;