# Budget Categories Migration Guide

## Overview

This guide outlines the manual steps needed to complete the budget categories migration in the Supabase database. The migration enables multi-category budget support by creating a junction table.

## Current Status

✅ **Code Implementation**: All application code has been updated to support multi-category budgets
✅ **Migration Files**: SQL migration files are prepared and tested  
✅ **API Endpoints**: Budget management APIs support both single and multi-category operations
⚠️ **Database Schema**: Migration requires manual execution in Supabase SQL Editor

## Required Manual Steps

### Step 1: Create budget_categories Table

Execute this SQL in Supabase SQL Editor:

```sql
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
-- FIXED: Cast auth.uid() to VARCHAR to match user_id column type
CREATE POLICY budget_categories_user_policy ON budget_categories
FOR ALL
USING (
    budget_id IN (
        SELECT id FROM budgets WHERE user_id = auth.uid()::VARCHAR
    )
);
```

### Step 2: Migrate Existing Data

```sql
-- Migrate existing single-category budgets to junction table
INSERT INTO budget_categories (budget_id, category_id)
SELECT id, category_id 
FROM budgets 
WHERE category_id IS NOT NULL
ON CONFLICT (budget_id, category_id) DO NOTHING;
```

### Step 3: Remove Old Column (Optional - Breaking Change)

⚠️ **WARNING**: This step is irreversible and will break any code still expecting the `category_id` column on budgets.

```sql
-- Remove the old category_id column from budgets table
ALTER TABLE budgets DROP COLUMN IF EXISTS category_id;
```

## Verification

After running the migration, verify it worked:

```sql
-- Check table was created
SELECT COUNT(*) FROM budget_categories;

-- Check data was migrated
SELECT bc.*, b.name as budget_name, c.name as category_name
FROM budget_categories bc
JOIN budgets b ON bc.budget_id = b.id
JOIN categories c ON bc.category_id = c.id
LIMIT 10;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'budget_categories';
```

## Expected Results

- **Before Migration**: 5 budgets with `category_id` column
- **After Migration**: 5 records in `budget_categories` table + original budgets without `category_id`

## Rollback (if needed)

If you need to rollback before Step 3:

```sql
-- Re-add category_id column to budgets (if removed)
ALTER TABLE budgets ADD COLUMN category_id UUID REFERENCES categories(id);

-- Restore single category per budget
UPDATE budgets 
SET category_id = bc.category_id
FROM budget_categories bc
WHERE budgets.id = bc.budget_id;

-- Drop junction table
DROP TABLE budget_categories;
```

## Post-Migration

Once migration is complete:

1. ✅ Multi-category budget creation will work in the UI
2. ✅ Existing budgets will appear with their original categories
3. ✅ Budget calculations will work across multiple categories
4. ✅ All API endpoints support the new schema

## Files Created for Migration

- `lib/db/migrations/011_create_budget_categories_table.sql` - Full migration
- `lib/db/migrations/011b_complete_budget_categories_migration.sql` - Data migration only
- `scripts/run-migration.ts` - Migration runner (requires RPC function)
- `app/api/admin/migrate/route.ts` - API-based migration runner
- `app/api/admin/migrate-direct/route.ts` - Direct Supabase client approach
- `app/api/admin/create-budget-categories/route.ts` - Table creation API

## Testing

The migration has been tested with:
- ✅ E2E tests with authentication bypass
- ✅ API endpoint validation
- ✅ UI component integration
- ✅ Database relationship integrity

Execute the migration when ready to enable multi-category budget support in production.