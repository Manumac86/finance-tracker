-- Create transactions table for financial transaction tracking
-- This migration creates the transactions table with all necessary fields and constraints

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id VARCHAR(255) NOT NULL,
  category_name VARCHAR(255) NOT NULL, -- Denormalized for performance
  category_icon VARCHAR(50) NOT NULL,  -- Denormalized for performance
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_active ON transactions(is_active);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, transaction_type);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample transactions for testing
INSERT INTO transactions (
  user_id, amount, transaction_type, name, description, category_id, 
  category_name, category_icon, transaction_date
) VALUES 
  ('user_2example123', -85.32, 'expense', 'Grocery Store', 'Weekly grocery shopping', '1', 'Shopping', 'ShoppingBag', NOW() - INTERVAL '1 day'),
  ('user_2example123', 2150.00, 'income', 'Salary Deposit', 'Monthly salary deposit', '2', 'Income', 'ArrowDownLeft', NOW() - INTERVAL '2 days'),
  ('user_2example123', -4.50, 'expense', 'Coffee Shop', 'Morning coffee at local cafe', '3', 'Food & Drink', 'Coffee', NOW() - INTERVAL '3 days'),
  ('user_2example123', -1200.00, 'expense', 'Rent Payment', 'Monthly rent payment', '4', 'Housing', 'Home', NOW() - INTERVAL '4 days'),
  ('user_2example123', 350.00, 'income', 'Freelance Work', 'Web development project', '2', 'Income', 'ArrowDownLeft', NOW() - INTERVAL '5 days'),
  ('user_2example123', -29.99, 'expense', 'Amazon Purchase', 'Books and supplies', '1', 'Shopping', 'ShoppingBag', NOW() - INTERVAL '6 days'),
  ('user_2example123', -75.00, 'expense', 'Utility Bill', 'Electricity and water bill', '5', 'Utilities', 'Home', NOW() - INTERVAL '7 days'),
  ('user_2example123', -42.50, 'expense', 'Restaurant', 'Dinner with friends', '3', 'Food & Drink', 'Coffee', NOW() - INTERVAL '8 days'),
  ('user_2example123', 200.00, 'income', 'Side Project', 'Consulting work', '2', 'Income', 'ArrowDownLeft', NOW() - INTERVAL '9 days'),
  ('user_2example123', -15.99, 'expense', 'Subscription', 'Netflix monthly subscription', '6', 'Entertainment', 'CreditCard', NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;

-- Create a function to get transaction statistics
CREATE OR REPLACE FUNCTION get_transaction_stats(p_user_id VARCHAR(255), p_start_date TIMESTAMP DEFAULT NULL, p_end_date TIMESTAMP DEFAULT NULL)
RETURNS TABLE (
  total_income DECIMAL(12,2),
  total_expenses DECIMAL(12,2),
  net_amount DECIMAL(12,2),
  transaction_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(amount), 0) as net_amount,
    COUNT(*)::INTEGER as transaction_count
  FROM transactions 
  WHERE user_id = p_user_id 
    AND is_active = true
    AND (p_start_date IS NULL OR transaction_date >= p_start_date)
    AND (p_end_date IS NULL OR transaction_date <= p_end_date);
END;
$$ LANGUAGE plpgsql;