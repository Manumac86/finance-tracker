-- Temporary fix: Disable balance history trigger
-- Run this in your Supabase SQL Editor to allow account creation

-- Drop the trigger temporarily
DROP TRIGGER IF EXISTS trigger_create_balance_history ON manual_accounts;

-- Drop the function
DROP FUNCTION IF EXISTS create_balance_history() CASCADE;

-- Verify
SELECT 'Balance history trigger disabled. Accounts can now be created.' as status;

-- NOTE: This disables balance history tracking. 
-- To re-enable it, you'll need to run the correct migration 
-- with matching column names later.