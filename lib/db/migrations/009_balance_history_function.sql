-- Function to calculate user balance before a specific date
CREATE OR REPLACE FUNCTION calculate_balance_before_date(
  p_user_id UUID,
  p_before_date DATE
) RETURNS DECIMAL(12,2) AS $$
DECLARE
  balance DECIMAL(12,2) := 0;
BEGIN
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN transaction_type = 'income' THEN amount
        ELSE -amount
      END
    ), 
    0
  ) INTO balance
  FROM transactions
  WHERE user_id = p_user_id
    AND is_active = true
    AND transaction_date < p_before_date;
    
  RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily balance changes for a date range
CREATE OR REPLACE FUNCTION get_daily_balance_changes(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE(
  transaction_date DATE,
  net_amount DECIMAL(12,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.transaction_date,
    SUM(
      CASE 
        WHEN t.transaction_type = 'income' THEN t.amount
        ELSE -t.amount
      END
    ) as net_amount
  FROM transactions t
  WHERE t.user_id = p_user_id
    AND t.is_active = true
    AND t.transaction_date >= p_start_date
    AND t.transaction_date <= p_end_date
  GROUP BY t.transaction_date
  ORDER BY t.transaction_date;
END;
$$ LANGUAGE plpgsql; 