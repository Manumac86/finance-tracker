-- Fix Balance History Column Names
-- Run this to fix the mismatch between column names

-- Option 1: Update the trigger to match the TypeScript schema (recommended)
-- Drop and recreate the balance history function with correct column names
DROP FUNCTION IF EXISTS create_balance_history() CASCADE;

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

-- Recreate the trigger
CREATE TRIGGER trigger_create_balance_history
    AFTER INSERT OR UPDATE OF current_balance ON manual_accounts
    FOR EACH ROW
    EXECUTE FUNCTION create_balance_history();

-- Verify the setup
SELECT 'Balance history trigger fixed!' as status;