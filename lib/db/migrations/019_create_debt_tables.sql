-- Migration: Create Debt Management Tables
-- Description: Tables for tracking debts, payments, and payoff strategies

-- Create debts table
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  name TEXT NOT NULL,
  debt_type TEXT NOT NULL CHECK (debt_type IN ('credit_card', 'loan', 'mortgage', 'student_loan', 'other')),
  original_amount DECIMAL(12,2) NOT NULL,
  current_balance DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2), -- Annual percentage rate
  minimum_payment DECIMAL(12,2),
  payment_day INTEGER CHECK (payment_day >= 1 AND payment_day <= 31), -- Day of month
  due_date DATE,
  account_id UUID,
  lender_name TEXT,
  account_number TEXT, -- Will be encrypted at application level
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_debt_account FOREIGN KEY (account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL
);

-- Create debt_payments table
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  payment_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  principal_amount DECIMAL(12,2) DEFAULT 0,
  interest_amount DECIMAL(12,2) DEFAULT 0,
  balance_after DECIMAL(12,2),
  payment_type TEXT CHECK (payment_type IN ('minimum', 'extra', 'payoff', 'regular')),
  transaction_id UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_debt FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
  CONSTRAINT check_payment_amounts CHECK (principal_amount + interest_amount = amount)
);

-- Create debt_payoff_strategies table
CREATE TABLE IF NOT EXISTS debt_payoff_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  name TEXT NOT NULL,
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('avalanche', 'snowball', 'custom')),
  target_date DATE,
  extra_payment_amount DECIMAL(12,2) DEFAULT 0,
  debt_order JSONB, -- Array of debt IDs in payoff order
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_debts_account_id ON debts(account_id);
CREATE INDEX idx_debts_is_active ON debts(is_active);
CREATE INDEX idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX idx_debt_payments_user_id ON debt_payments(user_id);
CREATE INDEX idx_debt_payments_date ON debt_payments(payment_date);
CREATE INDEX idx_debt_strategies_user_id ON debt_payoff_strategies(user_id);

-- Create updated_at trigger for debts
CREATE OR REPLACE FUNCTION update_debts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER debts_updated_at_trigger
BEFORE UPDATE ON debts
FOR EACH ROW
EXECUTE FUNCTION update_debts_updated_at();

-- Create updated_at trigger for strategies
CREATE OR REPLACE FUNCTION update_strategies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER strategies_updated_at_trigger
BEFORE UPDATE ON debt_payoff_strategies
FOR EACH ROW
EXECUTE FUNCTION update_strategies_updated_at();

-- Enable Row Level Security
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payoff_strategies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for debts
-- Note: These policies are placeholders. Actual authorization is handled in the application layer with Clerk
CREATE POLICY "Users can view their own debts"
  ON debts FOR SELECT
  USING (true); -- Application-level authorization with Clerk

CREATE POLICY "Users can create their own debts"
  ON debts FOR INSERT
  WITH CHECK (true); -- Application-level authorization with Clerk

CREATE POLICY "Users can update their own debts"
  ON debts FOR UPDATE
  USING (true) -- Application-level authorization with Clerk
  WITH CHECK (true);

CREATE POLICY "Users can delete their own debts"
  ON debts FOR DELETE
  USING (true); -- Application-level authorization with Clerk

-- Create RLS policies for debt_payments
CREATE POLICY "Users can view their own debt payments"
  ON debt_payments FOR SELECT
  USING (true); -- Application-level authorization with Clerk

CREATE POLICY "Users can create their own debt payments"
  ON debt_payments FOR INSERT
  WITH CHECK (true); -- Application-level authorization with Clerk

CREATE POLICY "Users can update their own debt payments"
  ON debt_payments FOR UPDATE
  USING (true) -- Application-level authorization with Clerk
  WITH CHECK (true);

CREATE POLICY "Users can delete their own debt payments"
  ON debt_payments FOR DELETE
  USING (true); -- Application-level authorization with Clerk

-- Create RLS policies for debt_payoff_strategies
CREATE POLICY "Users can view their own strategies"
  ON debt_payoff_strategies FOR SELECT
  USING (true); -- Application-level authorization with Clerk

CREATE POLICY "Users can create their own strategies"
  ON debt_payoff_strategies FOR INSERT
  WITH CHECK (true); -- Application-level authorization with Clerk

CREATE POLICY "Users can update their own strategies"
  ON debt_payoff_strategies FOR UPDATE
  USING (true) -- Application-level authorization with Clerk
  WITH CHECK (true);

CREATE POLICY "Users can delete their own strategies"
  ON debt_payoff_strategies FOR DELETE
  USING (true); -- Application-level authorization with Clerk

-- Add comment for documentation
COMMENT ON TABLE debts IS 'Stores user debt information including loans, credit cards, mortgages, etc.';
COMMENT ON TABLE debt_payments IS 'Records individual payments made towards debts';
COMMENT ON TABLE debt_payoff_strategies IS 'Stores user-defined strategies for paying off multiple debts';