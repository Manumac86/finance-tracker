-- Complete the budget_categories migration
-- First ensure the table exists with proper RLS policy
DO $$
BEGIN
    -- Check if budget_categories table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'budget_categories') THEN
        -- Create the table if it doesn't exist
        CREATE TABLE budget_categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
            category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(budget_id, category_id)
        );
        
        -- Create indexes
        CREATE INDEX idx_budget_categories_budget_id ON budget_categories(budget_id);
        CREATE INDEX idx_budget_categories_category_id ON budget_categories(category_id);
        
        -- Enable RLS
        ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policy with proper type casting
        CREATE POLICY budget_categories_user_policy ON budget_categories
        FOR ALL
        USING (
            budget_id IN (
                SELECT id FROM budgets WHERE user_id = auth.uid()::VARCHAR
            )
        );
    END IF;
END
$$;

-- Migrate existing single-category budgets to junction table
INSERT INTO budget_categories (budget_id, category_id)
SELECT id, category_id 
FROM budgets 
WHERE category_id IS NOT NULL
ON CONFLICT (budget_id, category_id) DO NOTHING;

-- Remove the old category_id column from budgets table
ALTER TABLE budgets DROP COLUMN IF EXISTS category_id;