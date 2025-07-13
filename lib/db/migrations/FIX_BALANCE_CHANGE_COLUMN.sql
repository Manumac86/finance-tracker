-- Fix the balance_change column issue in the trigger

-- Update the trigger function to handle balance_change correctly
CREATE OR REPLACE FUNCTION create_balance_history()
RETURNS TRIGGER AS $$
DECLARE
    prev_balance DECIMAL(12,2);
    change_amount DECIMAL(12,2);
BEGIN
    -- Only create history entry if balance actually changed
    IF OLD.current_balance IS DISTINCT FROM NEW.current_balance THEN
        -- Calculate previous balance and change
        prev_balance := COALESCE(OLD.current_balance, 0);
        change_amount := NEW.current_balance - prev_balance;
        
        INSERT INTO account_balance_history (
            account_id,
            user_id,
            previous_balance,
            new_balance,
            balance_change,
            change_type,
            description
        ) VALUES (
            NEW.id,
            NEW.user_id,
            prev_balance,
            NEW.current_balance,
            change_amount,
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

SELECT 'Balance change calculation fixed in trigger!' as status;