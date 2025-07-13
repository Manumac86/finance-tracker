-- Add fields to support transaction splitting and metadata
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_split BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_transaction_id UUID REFERENCES transactions(id),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_transaction_id UUID;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_transactions_is_split ON transactions(is_split);
CREATE INDEX IF NOT EXISTS idx_transactions_original ON transactions(original_transaction_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON transactions(recurring_transaction_id);

-- Add metadata index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_transactions_metadata ON transactions USING GIN (metadata);