-- Create recurring_transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  category_id UUID,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE,
  end_date DATE,
  next_due_date DATE,
  is_bill BOOLEAN DEFAULT false,
  reminder_days_before INTEGER DEFAULT 3 CHECK (reminder_days_before >= 0 AND reminder_days_before <= 30),
  auto_create_transaction BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX idx_recurring_transactions_next_due_date ON recurring_transactions(next_due_date);
CREATE INDEX idx_recurring_transactions_is_bill ON recurring_transactions(is_bill);
CREATE INDEX idx_recurring_transactions_active ON recurring_transactions(is_active);

-- Create bill_reminders table
CREATE TABLE IF NOT EXISTS bill_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  recurring_transaction_id UUID REFERENCES recurring_transactions(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'dismissed')),
  reminded_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for bill_reminders
CREATE INDEX idx_bill_reminders_user_id ON bill_reminders(user_id);
CREATE INDEX idx_bill_reminders_due_date ON bill_reminders(due_date);
CREATE INDEX idx_bill_reminders_status ON bill_reminders(status);
CREATE INDEX idx_bill_reminders_recurring_transaction ON bill_reminders(recurring_transaction_id);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  project_code TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  color TEXT DEFAULT '#6B7280',
  tags TEXT[] DEFAULT '{}',
  is_billable BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for projects
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_active ON projects(is_active);

-- Update categories table to support advanced features
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS category_type TEXT DEFAULT 'personal' CHECK (category_type IN ('personal', 'business')),
ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES categories(id),
ADD COLUMN IF NOT EXISTS is_tax_deductible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tax_category_code TEXT,
ADD COLUMN IF NOT EXISTS business_expense_type TEXT CHECK (business_expense_type IN (
  'office_supplies', 'travel', 'meals', 'equipment', 'software', 
  'marketing', 'professional_services', 'utilities', 'rent', 'other'
)),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id),
ADD COLUMN IF NOT EXISTS is_system_category BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Create additional indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(category_type);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_categories_tax_deductible ON categories(is_tax_deductible);
CREATE INDEX IF NOT EXISTS idx_categories_project ON categories(project_id);

-- Function to calculate next due date for recurring transactions
CREATE OR REPLACE FUNCTION calculate_next_due_date(frequency TEXT, current_date DATE)
RETURNS DATE AS $$
BEGIN
  CASE frequency
    WHEN 'daily' THEN RETURN current_date + INTERVAL '1 day';
    WHEN 'weekly' THEN RETURN current_date + INTERVAL '1 week';
    WHEN 'biweekly' THEN RETURN current_date + INTERVAL '2 weeks';
    WHEN 'monthly' THEN RETURN current_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN RETURN current_date + INTERVAL '3 months';
    WHEN 'yearly' THEN RETURN current_date + INTERVAL '1 year';
    ELSE RETURN current_date + INTERVAL '1 month';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update next_due_date when creating recurring transactions
CREATE OR REPLACE FUNCTION update_next_due_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.next_due_date IS NULL AND NEW.start_date IS NOT NULL THEN
    NEW.next_due_date := calculate_next_due_date(NEW.frequency, NEW.start_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_next_due_date
  BEFORE INSERT OR UPDATE ON recurring_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_next_due_date();

-- Function to get upcoming bill reminders
CREATE OR REPLACE FUNCTION get_upcoming_bill_reminders(p_user_id TEXT, days_ahead INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  user_id TEXT,
  recurring_transaction_id UUID,
  due_date DATE,
  amount DECIMAL,
  name TEXT,
  description TEXT,
  status TEXT,
  days_until_due INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    br.id,
    br.user_id,
    br.recurring_transaction_id,
    br.due_date,
    br.amount,
    br.name,
    br.description,
    br.status,
    (br.due_date - CURRENT_DATE)::INTEGER as days_until_due
  FROM bill_reminders br
  WHERE br.user_id = p_user_id
    AND br.status IN ('pending', 'overdue')
    AND br.due_date <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
  ORDER BY br.due_date ASC;
END;
$$ LANGUAGE plpgsql;