# Account Management Database Migrations

This document provides instructions for setting up the database components needed for the manual account management system.

## Required Migrations

You need to run the following migrations in your Supabase database:

### 1. Account Balance History Table (Optional but Recommended)

Run this in your Supabase SQL Editor:

```sql
-- Create account balance history table
CREATE TABLE IF NOT EXISTS account_balance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    
    -- Balance information
    balance_before DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    balance_change DECIMAL(12,2) NOT NULL,
    
    -- Change source
    transaction_id UUID,
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('transaction', 'manual_adjustment', 'correction', 'initial')),
    description VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_account_balance_history_account 
        FOREIGN KEY (account_id) REFERENCES manual_accounts(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_account_balance_history_account_id ON account_balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_user_id ON account_balance_history(user_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_created_at ON account_balance_history(created_at);

-- Row Level Security
ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own balance history
-- Drop existing policy first if it exists
DROP POLICY IF EXISTS account_balance_history_user_policy ON account_balance_history;

CREATE POLICY account_balance_history_user_policy ON account_balance_history
FOR ALL
USING (
    account_id IN (
        SELECT id FROM manual_accounts WHERE user_id = auth.uid()::VARCHAR
    )
);
```

### 2. Balance History Trigger (Optional but Recommended)

This automatically tracks balance changes:

```sql
-- Function to automatically create balance history when account balance is updated
CREATE OR REPLACE FUNCTION create_balance_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create history entry if balance actually changed
    IF OLD.current_balance IS DISTINCT FROM NEW.current_balance THEN
        INSERT INTO account_balance_history (
            account_id,
            user_id,
            balance_before,
            balance_after,
            balance_change,
            change_type,
            description
        ) VALUES (
            NEW.id,
            NEW.user_id,
            COALESCE(OLD.current_balance, 0),
            NEW.current_balance,
            NEW.current_balance - COALESCE(OLD.current_balance, 0),
            CASE 
                WHEN OLD.current_balance IS NULL THEN 'initial'
                ELSE 'manual_adjustment'
            END,
            'Balance updated'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically log balance changes
DROP TRIGGER IF EXISTS trigger_create_balance_history ON manual_accounts;
CREATE TRIGGER trigger_create_balance_history
    AFTER INSERT OR UPDATE OF current_balance ON manual_accounts
    FOR EACH ROW
    EXECUTE FUNCTION create_balance_history();
```

### 3. Account Summary Function (Optional - for better performance)

This creates a PostgreSQL function for efficient account summaries:

```sql
-- Create account summary function for manual accounts
CREATE OR REPLACE FUNCTION get_account_summary(user_id_param VARCHAR)
RETURNS TABLE (
    total_accounts INTEGER,
    active_accounts INTEGER,
    total_balance DECIMAL(12,2),
    total_assets DECIMAL(12,2),
    total_liabilities DECIMAL(12,2),
    checking_balance DECIMAL(12,2),
    savings_balance DECIMAL(12,2),
    credit_balance DECIMAL(12,2),
    cash_balance DECIMAL(12,2),
    investment_balance DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Total and active account counts
        COUNT(*)::INTEGER as total_accounts,
        COUNT(*) FILTER (WHERE is_active = true)::INTEGER as active_accounts,
        
        -- Total balance (only active accounts that are included in totals)
        COALESCE(SUM(
            CASE 
                WHEN is_active = true AND include_in_totals = true 
                THEN current_balance 
                ELSE 0 
            END
        ), 0)::DECIMAL(12,2) as total_balance,
        
        -- Total assets (positive balances, excluding credit cards)
        COALESCE(SUM(
            CASE 
                WHEN is_active = true AND include_in_totals = true 
                     AND account_type != 'credit' 
                     AND current_balance > 0
                THEN current_balance 
                ELSE 0 
            END
        ), 0)::DECIMAL(12,2) as total_assets,
        
        -- Total liabilities (credit card balances, treated as positive debt)
        COALESCE(SUM(
            CASE 
                WHEN is_active = true AND include_in_totals = true 
                     AND account_type = 'credit'
                THEN ABS(current_balance)
                ELSE 0 
            END
        ), 0)::DECIMAL(12,2) as total_liabilities,
        
        -- Balance by account type
        COALESCE(SUM(
            CASE 
                WHEN is_active = true AND include_in_totals = true 
                     AND account_type = 'checking'
                THEN current_balance 
                ELSE 0 
            END
        ), 0)::DECIMAL(12,2) as checking_balance,
        
        COALESCE(SUM(
            CASE 
                WHEN is_active = true AND include_in_totals = true 
                     AND account_type = 'savings'
                THEN current_balance 
                ELSE 0 
            END
        ), 0)::DECIMAL(12,2) as savings_balance,
        
        COALESCE(SUM(
            CASE 
                WHEN is_active = true AND include_in_totals = true 
                     AND account_type = 'credit'
                THEN current_balance 
                ELSE 0 
            END
        ), 0)::DECIMAL(12,2) as credit_balance,
        
        COALESCE(SUM(
            CASE 
                WHEN is_active = true AND include_in_totals = true 
                     AND account_type = 'cash'
                THEN current_balance 
                ELSE 0 
            END
        ), 0)::DECIMAL(12,2) as cash_balance,
        
        COALESCE(SUM(
            CASE 
                WHEN is_active = true AND include_in_totals = true 
                     AND account_type = 'investment'
                THEN current_balance 
                ELSE 0 
            END
        ), 0)::DECIMAL(12,2) as investment_balance
        
    FROM manual_accounts 
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Migration Steps

1. **Run the basic account table migration** (if not already done):
   - Execute `lib/db/migrations/012_create_manual_accounts_simple.sql`

2. **Run the balance history migration** (recommended):
   - Copy and paste the SQL from section 1 above into your Supabase SQL Editor
   - Execute it

3. **Run the balance history trigger** (recommended):
   - Copy and paste the SQL from section 2 above into your Supabase SQL Editor
   - Execute it

4. **Optional: Run the summary function**:
   - Copy and paste the SQL from section 3 above into your Supabase SQL Editor
   - Execute it

## After Migration

Once you've run the balance history migration, you can enable full balance history tracking by updating `lib/db/postgres.ts`:

1. In the `selectAccountBalanceHistory` function, remove the early return and uncomment the actual implementation
2. This will enable the balance history tab in the Edit Account modal

## Verification

After running the migrations, you should be able to:

1. ✅ Access the `/accounts` page without errors
2. ✅ Create new accounts
3. ✅ View account summaries and balances
4. ✅ Edit account information
5. ✅ Update account balances (with history tracking if enabled)
6. ✅ Delete accounts

## Troubleshooting

If you encounter any issues:

1. Check that all required environment variables are set in `.env.local`
2. Verify that the `manual_accounts` table exists and has the correct structure
3. Ensure RLS policies are properly configured
4. Check the browser console and server logs for specific error messages

## Notes

- The account management system works without the optional migrations, but you'll get better functionality with them
- Balance history tracking helps users understand how their account balances have changed over time
- The summary function provides better performance for dashboard calculations
- All migrations include proper Row Level Security (RLS) to ensure user data isolation