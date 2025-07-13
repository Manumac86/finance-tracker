-- Add denormalized account fields to transactions table
-- This allows transactions to display account information without joins

-- Add account name and color columns for denormalized data
ALTER TABLE transactions 
ADD COLUMN account_name VARCHAR(100),
ADD COLUMN account_color VARCHAR(7);

-- Update existing transactions with account information where account_id exists
UPDATE transactions 
SET 
    account_name = ma.name,
    account_color = ma.color
FROM manual_accounts ma 
WHERE transactions.account_id = ma.id 
AND transactions.account_id IS NOT NULL;

-- Create index for better query performance when filtering by account
CREATE INDEX IF NOT EXISTS idx_transactions_account_name ON transactions(account_name);

SELECT 'Account denormalized fields added to transactions table!' as status;