-- Migration: Create Bank Accounts and Related Tables
-- This migration creates the foundation for multi-regional banking integration
-- Supports US (Plaid) and EU/Spain (TrueLayer)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for bank account management
CREATE TYPE bank_provider AS ENUM ('plaid', 'truelayer');
CREATE TYPE bank_region AS ENUM ('US', 'ES', 'EU');
CREATE TYPE account_type AS ENUM ('checking', 'savings', 'credit', 'investment', 'loan');
CREATE TYPE sync_status AS ENUM ('manual', 'synced', 'pending', 'failed', 'disconnected');

-- Create bank_accounts table
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    
    -- Regional provider identification
    provider bank_provider NOT NULL,
    region bank_region NOT NULL,
    
    -- Provider-specific IDs (only one will be populated per account)
    -- These store encrypted access tokens and account IDs
    plaid_account_id TEXT,
    plaid_access_token TEXT, -- Encrypted
    truelayer_account_id TEXT,
    truelayer_access_token TEXT, -- Encrypted
    
    -- Universal account information
    account_name TEXT NOT NULL,
    account_type account_type NOT NULL,
    account_subtype TEXT,
    institution_name TEXT NOT NULL,
    institution_id TEXT NOT NULL,
    
    -- Account details (NEVER store full account numbers, CVCs, or sensitive data)
    mask TEXT CHECK (mask ~ '^\d{4}$'), -- Only last 4 digits
    official_name TEXT,
    
    -- Balance information
    currency_code TEXT NOT NULL DEFAULT 'USD' CHECK (LENGTH(currency_code) = 3),
    current_balance DECIMAL(15, 2),
    available_balance DECIMAL(15, 2),
    
    -- Status and sync tracking
    is_active BOOLEAN NOT NULL DEFAULT true,
    sync_status sync_status NOT NULL DEFAULT 'manual',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_provider_account UNIQUE (provider, plaid_account_id, truelayer_account_id),
    CONSTRAINT provider_account_consistency CHECK (
        (provider = 'plaid' AND plaid_account_id IS NOT NULL AND truelayer_account_id IS NULL) OR
        (provider = 'truelayer' AND truelayer_account_id IS NOT NULL AND plaid_account_id IS NULL)
    )
);

-- Create indexes for bank_accounts
CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_provider ON bank_accounts(provider);
CREATE INDEX idx_bank_accounts_region ON bank_accounts(region);
CREATE INDEX idx_bank_accounts_sync_status ON bank_accounts(sync_status);
CREATE INDEX idx_bank_accounts_active ON bank_accounts(is_active) WHERE is_active = true;
CREATE INDEX idx_bank_accounts_last_synced ON bank_accounts(last_synced_at) WHERE last_synced_at IS NOT NULL;

-- Create regional_bank_configs table for provider configuration
CREATE TABLE regional_bank_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region bank_region NOT NULL,
    provider bank_provider NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    config_data JSONB, -- Provider-specific configuration
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_region_provider UNIQUE (region, provider)
);

-- Create enhanced transactions table that extends the existing transactions
-- This table links bank transactions to provider-specific data
CREATE TABLE bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    transaction_id UUID, -- Links to existing transactions table
    
    -- Bank account linkage
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
    
    -- Provider-specific transaction IDs
    plaid_transaction_id TEXT,
    truelayer_transaction_id TEXT,
    
    -- Enhanced transaction data from banks
    merchant_name TEXT,
    merchant_category TEXT,
    location_address TEXT,
    location_city TEXT,
    location_country TEXT,
    
    -- Account balance after transaction
    account_balance_after DECIMAL(15, 2),
    
    -- Sync metadata
    sync_status sync_status NOT NULL DEFAULT 'manual',
    is_synced BOOLEAN NOT NULL DEFAULT false,
    pending_transaction_id TEXT, -- For pending transactions that may change
    
    -- Standard transaction fields for compatibility
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID,
    transaction_date DATE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT provider_transaction_consistency CHECK (
        (plaid_transaction_id IS NOT NULL AND truelayer_transaction_id IS NULL) OR
        (truelayer_transaction_id IS NOT NULL AND plaid_transaction_id IS NULL) OR
        (plaid_transaction_id IS NULL AND truelayer_transaction_id IS NULL)
    )
);

-- Create indexes for bank_transactions
CREATE INDEX idx_bank_transactions_user_id ON bank_transactions(user_id);
CREATE INDEX idx_bank_transactions_bank_account ON bank_transactions(bank_account_id);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX idx_bank_transactions_sync_status ON bank_transactions(sync_status);
CREATE INDEX idx_bank_transactions_synced ON bank_transactions(is_synced);
CREATE INDEX idx_bank_transactions_provider_plaid ON bank_transactions(plaid_transaction_id) WHERE plaid_transaction_id IS NOT NULL;
CREATE INDEX idx_bank_transactions_provider_truelayer ON bank_transactions(truelayer_transaction_id) WHERE truelayer_transaction_id IS NOT NULL;

-- Create transaction_duplicates table for duplicate detection
CREATE TABLE transaction_duplicates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL,
    potential_duplicate_id UUID NOT NULL,
    similarity_score DECIMAL(3, 2) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'dismissed')),
    detection_method TEXT NOT NULL CHECK (detection_method IN ('amount_date', 'merchant_match', 'exact_match')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_duplicate_pair UNIQUE (transaction_id, potential_duplicate_id)
);

-- Create indexes for transaction_duplicates
CREATE INDEX idx_transaction_duplicates_transaction ON transaction_duplicates(transaction_id);
CREATE INDEX idx_transaction_duplicates_status ON transaction_duplicates(status);
CREATE INDEX idx_transaction_duplicates_similarity ON transaction_duplicates(similarity_score) WHERE similarity_score > 0.8;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_bank_accounts_updated_at 
    BEFORE UPDATE ON bank_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_transactions_updated_at 
    BEFORE UPDATE ON bank_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default regional configurations
INSERT INTO regional_bank_configs (region, provider, is_enabled, config_data) VALUES
('US', 'plaid', true, '{"products": ["transactions", "accounts"], "country_codes": ["US"]}'),
('ES', 'truelayer', true, '{"scopes": ["accounts", "transactions", "balance"], "country": "ES"}'),
('EU', 'truelayer', true, '{"scopes": ["accounts", "transactions", "balance"], "countries": ["ES", "IT", "FR", "DE", "NL", "BE", "AT", "PT", "GB", "IE"]}');

-- Add comments for documentation
COMMENT ON TABLE bank_accounts IS 'Multi-regional bank account integration supporting Plaid (US) and TrueLayer (EU)';
COMMENT ON TABLE bank_transactions IS 'Enhanced transaction data from bank providers with duplicate detection and sync tracking';
COMMENT ON TABLE transaction_duplicates IS 'Duplicate transaction detection and management';
COMMENT ON TABLE regional_bank_configs IS 'Regional banking provider configuration and feature flags';

COMMENT ON COLUMN bank_accounts.plaid_access_token IS 'Encrypted Plaid access token for API calls';
COMMENT ON COLUMN bank_accounts.truelayer_access_token IS 'Encrypted TrueLayer access token for API calls';
COMMENT ON COLUMN bank_accounts.mask IS 'Last 4 digits of account number only - NEVER store full account numbers';
COMMENT ON COLUMN bank_transactions.pending_transaction_id IS 'Temporary ID for pending transactions that may change when settled';