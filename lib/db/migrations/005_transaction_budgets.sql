-- Migration: Add transaction_budgets table for manual budget assignments
-- File: 005_transaction_budgets.sql

-- Create transaction_budgets table
CREATE TABLE IF NOT EXISTS transaction_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  assigned_amount DECIMAL(12,2) NOT NULL CHECK (assigned_amount > 0),
  assigned_percentage DECIMAL(5,2) CHECK (assigned_percentage >= 0 AND assigned_percentage <= 100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_transaction_budget UNIQUE (transaction_id, budget_id),
  CONSTRAINT check_amount_or_percentage CHECK (
    assigned_amount IS NOT NULL OR assigned_percentage IS NOT NULL
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_budgets_transaction_id ON transaction_budgets(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_budgets_budget_id ON transaction_budgets(budget_id);
CREATE INDEX IF NOT EXISTS idx_transaction_budgets_created_at ON transaction_budgets(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE transaction_budgets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access transaction_budgets for their own transactions
CREATE POLICY transaction_budgets_user_policy ON transaction_budgets
  USING (
    EXISTS (
      SELECT 1 FROM transactions t 
      WHERE t.id = transaction_budgets.transaction_id 
      AND t.user_id = auth.uid()::text
    )
  );

-- Policy: Users can insert transaction_budgets for their own transactions
CREATE POLICY transaction_budgets_insert_policy ON transaction_budgets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t 
      WHERE t.id = transaction_budgets.transaction_id 
      AND t.user_id = auth.uid()::text
    )
  );

-- Policy: Users can update transaction_budgets for their own transactions
CREATE POLICY transaction_budgets_update_policy ON transaction_budgets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM transactions t 
      WHERE t.id = transaction_budgets.transaction_id 
      AND t.user_id = auth.uid()::text
    )
  );

-- Policy: Users can delete transaction_budgets for their own transactions
CREATE POLICY transaction_budgets_delete_policy ON transaction_budgets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM transactions t 
      WHERE t.id = transaction_budgets.transaction_id 
      AND t.user_id = auth.uid()::text
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_transaction_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_budgets_updated_at
  BEFORE UPDATE ON transaction_budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_budgets_updated_at();

-- Comments for documentation
COMMENT ON TABLE transaction_budgets IS 'Manual assignments of transactions to specific budgets';
COMMENT ON COLUMN transaction_budgets.assigned_amount IS 'Specific amount assigned to this budget (can be partial)';
COMMENT ON COLUMN transaction_budgets.assigned_percentage IS 'Percentage of transaction amount assigned to this budget';
COMMENT ON COLUMN transaction_budgets.notes IS 'Optional notes explaining the budget assignment';