-- Budgets table migration
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID, -- Link to categories table (optional for overall budget)
  budget_type VARCHAR(20) NOT NULL CHECK (budget_type IN ('category', 'total', 'custom')),
  amount DECIMAL(12,2) NOT NULL, -- Budget limit amount
  period VARCHAR(20) NOT NULL CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Alert settings
  alert_threshold_percentage INTEGER DEFAULT 80 CHECK (alert_threshold_percentage BETWEEN 1 AND 100),
  alert_enabled BOOLEAN DEFAULT TRUE,
  overspend_alert_enabled BOOLEAN DEFAULT TRUE,
  
  -- Rollover settings
  rollover_enabled BOOLEAN DEFAULT FALSE,
  rollover_type VARCHAR(20) DEFAULT 'none' CHECK (rollover_type IN ('none', 'surplus', 'deficit', 'both')),
  
  -- Current period tracking
  current_spent DECIMAL(12,2) DEFAULT 0,
  last_calculated_at TIMESTAMP DEFAULT NOW(),
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Budget alerts table for tracking sent alerts
CREATE TABLE IF NOT EXISTS budget_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('threshold_warning', 'overspend_warning', 'budget_exceeded')),
  message TEXT NOT NULL,
  percentage_used DECIMAL(5,2), -- What percentage of budget was used when alert triggered
  amount_spent DECIMAL(12,2),
  budget_amount DECIMAL(12,2),
  period_start DATE,
  period_end DATE,
  sent_at TIMESTAMP DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP
);

-- Budget history table for tracking budget changes over time
CREATE TABLE IF NOT EXISTS budget_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  budget_amount DECIMAL(12,2) NOT NULL,
  actual_spent DECIMAL(12,2) DEFAULT 0,
  variance DECIMAL(12,2) GENERATED ALWAYS AS (budget_amount - actual_spent) STORED,
  variance_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN budget_amount = 0 THEN 0 
      ELSE ROUND(((actual_spent - budget_amount) / budget_amount * 100), 2)
    END
  ) STORED,
  rollover_from_previous DECIMAL(12,2) DEFAULT 0,
  rollover_to_next DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(is_active);
CREATE INDEX IF NOT EXISTS idx_budgets_user_active ON budgets(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_budget_alerts_budget_id ON budget_alerts(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user_id ON budget_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_sent_at ON budget_alerts(sent_at);

CREATE INDEX IF NOT EXISTS idx_budget_history_budget_id ON budget_history(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_history_user_period ON budget_history(user_id, period_start, period_end);

-- Function to update updated_at timestamp
CREATE TRIGGER update_budgets_updated_at 
    BEFORE UPDATE ON budgets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate current spending for a budget
CREATE OR REPLACE FUNCTION calculate_budget_spending(
    budget_id_param UUID,
    period_start_param DATE,
    period_end_param DATE
) RETURNS DECIMAL(12,2) AS $$
DECLARE
    total_spent DECIMAL(12,2) := 0;
    budget_category UUID;
    budget_user VARCHAR(255);
BEGIN
    -- Get budget details
    SELECT category_id, user_id INTO budget_category, budget_user
    FROM budgets WHERE id = budget_id_param;
    
    -- Calculate spent amount based on transactions
    -- Note: This assumes transactions table exists with similar structure
    -- This function can be expanded once transactions table is implemented
    SELECT COALESCE(SUM(amount), 0) INTO total_spent
    FROM transactions t
    WHERE t.user_id = budget_user
        AND t.date >= period_start_param 
        AND t.date <= period_end_param
        AND t.type = 'expense'
        AND (budget_category IS NULL OR t.category_id = budget_category);
    
    RETURN total_spent;
EXCEPTION
    WHEN others THEN
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Function to update budget current_spent
CREATE OR REPLACE FUNCTION update_budget_current_spent(budget_id_param UUID) 
RETURNS VOID AS $$
DECLARE
    budget_start DATE;
    budget_end DATE;
    current_spent_amount DECIMAL(12,2);
BEGIN
    -- Get current period dates for the budget
    SELECT start_date, 
           CASE 
               WHEN end_date IS NOT NULL THEN end_date
               WHEN period = 'weekly' THEN start_date + INTERVAL '1 week' - INTERVAL '1 day'
               WHEN period = 'monthly' THEN start_date + INTERVAL '1 month' - INTERVAL '1 day'
               WHEN period = 'quarterly' THEN start_date + INTERVAL '3 months' - INTERVAL '1 day'
               WHEN period = 'yearly' THEN start_date + INTERVAL '1 year' - INTERVAL '1 day'
               ELSE start_date
           END
    INTO budget_start, budget_end
    FROM budgets 
    WHERE id = budget_id_param;
    
    -- Calculate current spending
    current_spent_amount := calculate_budget_spending(budget_id_param, budget_start, budget_end);
    
    -- Update the budget
    UPDATE budgets 
    SET current_spent = current_spent_amount,
        last_calculated_at = NOW()
    WHERE id = budget_id_param;
END;
$$ LANGUAGE plpgsql;