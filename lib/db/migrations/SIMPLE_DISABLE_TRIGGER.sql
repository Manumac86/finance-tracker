-- Simple fix: Disable the trigger so account creation works
-- We can re-enable balance history tracking later

DROP TRIGGER IF EXISTS trigger_create_balance_history ON manual_accounts;

SELECT 'Balance history trigger disabled. Account creation should work now.' as status;