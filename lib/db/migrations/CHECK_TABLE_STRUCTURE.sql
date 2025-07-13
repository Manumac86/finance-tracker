-- Check what columns actually exist in the account_balance_history table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'account_balance_history' 
ORDER BY ordinal_position;