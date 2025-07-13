-- Complete fix for balance history column mismatch
-- Run this in your Supabase SQL Editor

-- First, let's check what columns exist in the account_balance_history table
-- Run this query first to see the actual table structure:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'account_balance_history' 
-- ORDER BY ordinal_position;

-- Option 1: If table has previous_balance/new_balance columns (TypeScript schema)
-- Uncomment and run this if your table uses previous_balance/new_balance:

/*
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
*/

-- Option 2: If table has balance_before/balance_after columns (SQL migration)
-- Uncomment and run this if your table uses balance_before/balance_after:

/*
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
*/

-- Option 3: Create the table with correct columns if it doesn't exist
-- This will standardize on balance_before/balance_after:

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

-- Create function with correct column names (balance_before/balance_after)
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_create_balance_history ON manual_accounts;
CREATE TRIGGER trigger_create_balance_history
    AFTER INSERT OR UPDATE OF current_balance ON manual_accounts
    FOR EACH ROW
    EXECUTE FUNCTION create_balance_history();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_account_balance_history_account_id ON account_balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_user_id ON account_balance_history(user_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_created_at ON account_balance_history(created_at);

-- Enable RLS if not already enabled
ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policy
DROP POLICY IF EXISTS account_balance_history_user_policy ON account_balance_history;
CREATE POLICY account_balance_history_user_policy ON account_balance_history
FOR ALL
USING (
    account_id IN (
        SELECT id FROM manual_accounts WHERE user_id = auth.uid()::VARCHAR
    )
);

SELECT 'Balance history system fixed and ready!' as status;