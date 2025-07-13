-- Create manual_accounts table for simplified account management
CREATE TABLE IF NOT EXISTS manual_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL, -- Clerk user ID
    
    -- Basic account information
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit', 'cash', 'investment')),
    institution_name VARCHAR(100),
    
    -- Balance information
    currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    initial_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Account details
    account_number_last_4 VARCHAR(4) CHECK (account_number_last_4 ~ '^\d{4}$'),
    description TEXT,
    
    -- Status and settings
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    include_in_totals BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Display settings
    color VARCHAR(7) CHECK (color ~ '^#[0-9A-F]{6}$'),
    icon VARCHAR(50),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create account balance history table
CREATE TABLE IF NOT EXISTS account_balance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES manual_accounts(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    
    -- Balance change details
    previous_balance DECIMAL(12,2) NOT NULL,
    new_balance DECIMAL(12,2) NOT NULL,
    balance_change DECIMAL(12,2) GENERATED ALWAYS AS (new_balance - previous_balance) STORED,
    
    -- Change source
    transaction_id UUID, -- References transactions(id) but no FK constraint for flexibility
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('transaction', 'manual_adjustment', 'correction', 'initial')),
    description VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_manual_accounts_user_id ON manual_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_accounts_user_active ON manual_accounts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_manual_accounts_type ON manual_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_manual_accounts_include_totals ON manual_accounts(user_id, include_in_totals, is_active);

CREATE INDEX IF NOT EXISTS idx_account_balance_history_account_id ON account_balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_user_id ON account_balance_history(user_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_transaction_id ON account_balance_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_created_at ON account_balance_history(created_at);

-- Enable RLS (Row Level Security) for multi-tenancy
ALTER TABLE manual_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - users can only access their own accounts
CREATE POLICY manual_accounts_user_policy ON manual_accounts
FOR ALL
USING (user_id = auth.uid()::VARCHAR);

CREATE POLICY account_balance_history_user_policy ON account_balance_history
FOR ALL
USING (user_id = auth.uid()::VARCHAR);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_manual_account_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_manual_accounts_updated_at
    BEFORE UPDATE ON manual_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_manual_account_updated_at();

-- Function to create balance history entry
CREATE OR REPLACE FUNCTION create_balance_history_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert balance history record when balance changes
    IF TG_OP = 'INSERT' THEN
        -- Initial balance entry
        INSERT INTO account_balance_history (
            account_id, 
            user_id, 
            previous_balance, 
            new_balance, 
            change_type,
            description
        ) VALUES (
            NEW.id, 
            NEW.user_id, 
            0, 
            NEW.current_balance, 
            'initial',
            'Account created with initial balance'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND OLD.current_balance != NEW.current_balance THEN
        -- Balance change entry
        INSERT INTO account_balance_history (
            account_id, 
            user_id, 
            previous_balance, 
            new_balance, 
            change_type,
            description
        ) VALUES (
            NEW.id, 
            NEW.user_id, 
            OLD.current_balance, 
            NEW.current_balance, 
            'manual_adjustment',
            'Balance manually adjusted'
        );
        RETURN NEW;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for balance history
CREATE TRIGGER create_manual_account_balance_history
    AFTER INSERT OR UPDATE ON manual_accounts
    FOR EACH ROW
    EXECUTE FUNCTION create_balance_history_entry();

-- Function to update account balance from transactions
CREATE OR REPLACE FUNCTION update_account_balance_from_transaction(
    account_id_param UUID,
    transaction_amount DECIMAL(12,2),
    transaction_type VARCHAR(10),
    transaction_id_param UUID DEFAULT NULL,
    description_param VARCHAR(255) DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    current_account manual_accounts%ROWTYPE;
    new_balance DECIMAL(12,2);
    balance_change DECIMAL(12,2);
BEGIN
    -- Get current account
    SELECT * INTO current_account FROM manual_accounts WHERE id = account_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account not found: %', account_id_param;
    END IF;
    
    -- Calculate balance change based on transaction type and account type
    IF current_account.account_type = 'credit' THEN
        -- Credit cards: expenses increase balance (debt), income decreases balance
        balance_change := CASE 
            WHEN transaction_type = 'expense' THEN transaction_amount
            WHEN transaction_type = 'income' THEN -transaction_amount
            ELSE 0
        END;
    ELSE
        -- Other accounts: income increases balance, expenses decrease balance
        balance_change := CASE 
            WHEN transaction_type = 'income' THEN transaction_amount
            WHEN transaction_type = 'expense' THEN -transaction_amount
            ELSE 0
        END;
    END IF;
    
    new_balance := current_account.current_balance + balance_change;
    
    -- Update account balance
    UPDATE manual_accounts 
    SET current_balance = new_balance 
    WHERE id = account_id_param;
    
    -- Create balance history entry
    INSERT INTO account_balance_history (
        account_id, 
        user_id, 
        previous_balance, 
        new_balance, 
        transaction_id,
        change_type,
        description
    ) VALUES (
        account_id_param,
        current_account.user_id,
        current_account.current_balance,
        new_balance,
        transaction_id_param,
        'transaction',
        COALESCE(description_param, 'Transaction: ' || transaction_type || ' of ' || transaction_amount)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get account summary for a user
CREATE OR REPLACE FUNCTION get_account_summary(user_id_param VARCHAR(255))
RETURNS TABLE(
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
        COUNT(*)::INTEGER AS total_accounts,
        COUNT(*) FILTER (WHERE is_active = TRUE)::INTEGER AS active_accounts,
        COALESCE(SUM(CASE WHEN is_active AND include_in_totals THEN current_balance ELSE 0 END), 0) AS total_balance,
        COALESCE(SUM(CASE 
            WHEN is_active AND include_in_totals AND account_type != 'credit' 
            THEN current_balance ELSE 0 END), 0) AS total_assets,
        COALESCE(SUM(CASE 
            WHEN is_active AND include_in_totals AND account_type = 'credit' 
            THEN ABS(LEAST(current_balance, 0)) ELSE 0 END), 0) AS total_liabilities,
        COALESCE(SUM(CASE 
            WHEN is_active AND include_in_totals AND account_type = 'checking' 
            THEN current_balance ELSE 0 END), 0) AS checking_balance,
        COALESCE(SUM(CASE 
            WHEN is_active AND include_in_totals AND account_type = 'savings' 
            THEN current_balance ELSE 0 END), 0) AS savings_balance,
        COALESCE(SUM(CASE 
            WHEN is_active AND include_in_totals AND account_type = 'credit' 
            THEN current_balance ELSE 0 END), 0) AS credit_balance,
        COALESCE(SUM(CASE 
            WHEN is_active AND include_in_totals AND account_type = 'cash' 
            THEN current_balance ELSE 0 END), 0) AS cash_balance,
        COALESCE(SUM(CASE 
            WHEN is_active AND include_in_totals AND account_type = 'investment' 
            THEN current_balance ELSE 0 END), 0) AS investment_balance
    FROM manual_accounts 
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;