-- Add account support to transactions table
-- This allows transactions to be associated with specific manual accounts

-- Add account_id column to transactions table
ALTER TABLE transactions 
ADD COLUMN account_id UUID;

-- Add foreign key constraint to link transactions to manual accounts
ALTER TABLE transactions 
ADD CONSTRAINT fk_transactions_account 
FOREIGN KEY (account_id) REFERENCES manual_accounts(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);

-- Create composite index for user and account queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_account ON transactions(user_id, account_id);

-- Update existing transactions to have NULL account_id (they will be unassigned)
-- Users can manually assign them to accounts later if needed

SELECT 'Account support added to transactions table!' as status;