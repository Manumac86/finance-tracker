-- Create budget_categories junction table for multi-category budget support
CREATE TABLE IF NOT EXISTS budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique budget-category combinations
    UNIQUE(budget_id, category_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_budget_categories_budget_id ON budget_categories(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_category_id ON budget_categories(category_id);

-- Enable RLS (Row Level Security) for multi-tenancy
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only access budget categories for their own budgets
CREATE POLICY budget_categories_user_policy ON budget_categories
FOR ALL
USING (
    budget_id IN (
        SELECT id FROM budgets WHERE user_id = auth.uid()
    )
);

-- Migrate existing single-category budgets to junction table
-- This will handle budgets that currently have a category_id
INSERT INTO budget_categories (budget_id, category_id)
SELECT id, category_id 
FROM budgets 
WHERE category_id IS NOT NULL
ON CONFLICT (budget_id, category_id) DO NOTHING;

-- Remove the old category_id column from budgets table
-- Note: This is a breaking change, but necessary for the multi-category support
ALTER TABLE budgets DROP COLUMN IF EXISTS category_id;