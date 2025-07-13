-- Create manual_accounts table for simplified account management
CREATE TABLE IF NOT EXISTS manual_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    
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