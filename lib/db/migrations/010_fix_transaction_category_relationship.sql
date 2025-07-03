-- Fix transaction category relationship by converting category_id to UUID
-- This migration updates the transactions table to use UUID for category_id to match categories.id

-- First, we need to handle existing data
-- Since the current category_id values are strings like '1', '2', etc., 
-- we need to map them to actual category UUIDs

-- Create a temporary mapping table
CREATE TEMP TABLE category_mapping AS
WITH numbered_categories AS (
  SELECT 
    id,
    name,
    ROW_NUMBER() OVER (ORDER BY created_at) as old_id
  FROM categories
  WHERE name IN (
    'Shopping', 'Income', 'Food & Drink', 'Housing', 'Utilities', 
    'Entertainment', 'Transportation', 'Healthcare', 'Education', 
    'Travel', 'Savings', 'Gifts & Donations', 'Personal Care', 
    'Home & Garden', 'Insurance', 'Taxes', 'Other'
  )
)
SELECT 
  old_id::text as old_category_id,
  id as new_category_id,
  name
FROM numbered_categories;

-- Add a new UUID column for category_id
ALTER TABLE transactions ADD COLUMN category_id_new UUID;

-- Update the new column with the correct UUID values based on the mapping
UPDATE transactions t
SET category_id_new = cm.new_category_id
FROM category_mapping cm
WHERE t.category_id = cm.old_category_id;

-- For any unmapped categories, use the 'Other' category as fallback
UPDATE transactions 
SET category_id_new = (SELECT id FROM categories WHERE name = 'Other' LIMIT 1)
WHERE category_id_new IS NULL;

-- Drop the old column and rename the new one
ALTER TABLE transactions DROP COLUMN category_id;
ALTER TABLE transactions RENAME COLUMN category_id_new TO category_id;

-- Make the column NOT NULL
ALTER TABLE transactions ALTER COLUMN category_id SET NOT NULL;

-- Now we can add the foreign key constraint
ALTER TABLE transactions 
  ADD CONSTRAINT fk_transactions_category 
  FOREIGN KEY (category_id) 
  REFERENCES categories(id) 
  ON DELETE RESTRICT;

-- Update the index
DROP INDEX IF EXISTS idx_transactions_category;
CREATE INDEX idx_transactions_category ON transactions(category_id);

-- Also update the user_id column in categories table to support user-specific categories
ALTER TABLE categories ADD COLUMN user_id VARCHAR(255);

-- Make existing categories available to all users by keeping user_id NULL
-- This allows them to be "system" categories

-- Create an index on user_id for categories
CREATE INDEX idx_categories_user_id ON categories(user_id);

-- Add a unique constraint to prevent duplicate category names per user
ALTER TABLE categories ADD CONSTRAINT unique_category_name_per_user 
  UNIQUE NULLS NOT DISTINCT (user_id, name);

-- Update the categories table to include system category tracking
ALTER TABLE categories ADD COLUMN is_system_category BOOLEAN DEFAULT false;

-- Mark all existing categories as system categories
UPDATE categories SET is_system_category = true WHERE user_id IS NULL;

-- Add remaining columns from the category schema that are missing
ALTER TABLE categories ADD COLUMN IF NOT EXISTS category_type VARCHAR(20) DEFAULT 'personal' CHECK (category_type IN ('personal', 'business'));
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES categories(id);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_tax_deductible BOOLEAN DEFAULT false;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS tax_category_code VARCHAR(50);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS business_expense_type VARCHAR(50);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS project_id VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS translations JSONB;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(category_type);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_categories_project ON categories(project_id);

-- Add a comment to the table explaining the relationship
COMMENT ON CONSTRAINT fk_transactions_category ON transactions IS 'Links transactions to their categories';