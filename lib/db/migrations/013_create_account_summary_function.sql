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