-- Fix balance history table structure and triggers
-- This migration resolves all column naming conflicts and ensures proper functionality

-- First, drop the existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_create_balance_history ON manual_accounts;
DROP FUNCTION IF EXISTS create_balance_history();

-- Check if account_balance_history table exists and drop it to recreate with correct structure
DROP TABLE IF EXISTS account_balance_history CASCADE;

-- Create account balance history table with correct column names
CREATE TABLE account_balance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    
    -- Balance information (using correct column names)
    previous_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    new_balance DECIMAL(12,2) NOT NULL,
    balance_change DECIMAL(12,2) GENERATED ALWAYS AS (new_balance - previous_balance) STORED,
    
    -- Change source
    transaction_id UUID,
    change_type VARCHAR(50) NOT NULL DEFAULT 'manual_adjustment' 
        CHECK (change_type IN ('transaction', 'manual_adjustment', 'correction', 'initial')),
    description VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_account_balance_history_account 
        FOREIGN KEY (account_id) REFERENCES manual_accounts(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_account_balance_history_account_id ON account_balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_user_id ON account_balance_history(user_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_created_at ON account_balance_history(created_at DESC);

-- Row Level Security
ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own balance history
CREATE POLICY account_balance_history_user_policy ON account_balance_history
FOR ALL
USING (
    account_id IN (
        SELECT id FROM manual_accounts WHERE user_id = auth.uid()::VARCHAR
    )
);

-- Updated function to automatically create balance history when account balance is updated
CREATE OR REPLACE FUNCTION create_balance_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history entry if balance actually changed
    IF OLD.current_balance IS DISTINCT FROM NEW.current_balance THEN
        INSERT INTO account_balance_history (
            account_id,
            user_id,
            previous_balance,
            new_balance,
            change_type,
            description
        ) VALUES (
            NEW.id,
            NEW.user_id,
            COALESCE(OLD.current_balance, 0),
            NEW.current_balance,
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

-- Create trigger to automatically log balance changes
CREATE TRIGGER trigger_create_balance_history
    AFTER INSERT OR UPDATE OF current_balance ON manual_accounts
    FOR EACH ROW
    EXECUTE FUNCTION create_balance_history();

-- Grant necessary permissions (sequences are auto-managed by Supabase)
GRANT SELECT, INSERT ON account_balance_history TO authenticated;

-- Test the setup by creating a test history entry (will be cleaned up)
-- This ensures everything works correctly
DO $$
DECLARE
    test_account_id UUID;
    test_user_id VARCHAR(255) := 'test-user-balance-history';
BEGIN
    -- Create a temporary test account
    INSERT INTO manual_accounts (
        user_id,
        name,
        account_type,
        currency_code,
        initial_balance,
        current_balance,
        is_active,
        include_in_totals
    ) VALUES (
        test_user_id,
        'Test Balance History Account',
        'checking',
        'USD',
        100.00,
        100.00,
        true,
        false
    ) RETURNING id INTO test_account_id;
    
    -- Update the balance to trigger the history creation
    UPDATE manual_accounts 
    SET current_balance = 150.00 
    WHERE id = test_account_id;
    
    -- Verify the history was created
    IF NOT EXISTS (
        SELECT 1 FROM account_balance_history 
        WHERE account_id = test_account_id 
        AND previous_balance = 100.00 
        AND new_balance = 150.00
    ) THEN
        RAISE EXCEPTION 'Balance history trigger test failed';
    END IF;
    
    -- Clean up test data
    DELETE FROM account_balance_history WHERE account_id = test_account_id;
    DELETE FROM manual_accounts WHERE id = test_account_id;
    
    RAISE NOTICE 'Balance history system test completed successfully';
END $$;