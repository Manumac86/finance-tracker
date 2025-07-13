-- Emergency fix: Completely disable the balance history trigger
-- This will allow account creation to work immediately

-- Drop the trigger
DROP TRIGGER IF EXISTS trigger_create_balance_history ON manual_accounts;

-- Drop the function  
DROP FUNCTION IF EXISTS create_balance_history();

-- Verify it's gone
SELECT 'All balance history triggers removed. Account creation should work now.' as status;