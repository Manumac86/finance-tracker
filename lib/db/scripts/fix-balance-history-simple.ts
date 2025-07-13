import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBalanceHistorySimple() {
  try {
    console.log('🔧 Starting simple balance history fix...');
    
    // Step 1: Check current table structure
    console.log('📋 Checking current table structure...');
    
    const { data: currentTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'account_balance_history');
    
    if (tablesError) {
      console.log('ℹ️ Could not check tables via Supabase client, trying direct approach');
    } else {
      console.log('📊 Current tables:', currentTables);
    }
    
    // Step 2: Try to access the account_balance_history table directly
    console.log('🔍 Testing direct table access...');
    
    const { data: testData, error: testError } = await supabase
      .from('account_balance_history')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('❌ Table access error:', testError.message);
      
      if (testError.message.includes('column') && testError.message.includes('does not exist')) {
        console.log('🔧 Column naming issue detected. The table exists but has wrong column names.');
        console.log('ℹ️ This confirms the issue we need to fix.');
      }
    } else {
      console.log('✅ Table is accessible:', testData);
    }
    
    // Step 3: Use a simpler approach - run the SQL through manual steps
    console.log('');
    console.log('📝 Manual fix required:');
    console.log('');
    console.log('Please run the following SQL commands in your Supabase SQL editor:');
    console.log('');
    console.log('1. Drop the existing problematic table and trigger:');
    console.log('   DROP TRIGGER IF EXISTS trigger_create_balance_history ON manual_accounts;');
    console.log('   DROP FUNCTION IF EXISTS create_balance_history();');
    console.log('   DROP TABLE IF EXISTS account_balance_history CASCADE;');
    console.log('');
    console.log('2. Create the new table with correct structure:');
    console.log(`
CREATE TABLE account_balance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    previous_balance DECIMAL(12,2) NOT NULL DEFAULT 0,
    new_balance DECIMAL(12,2) NOT NULL,
    balance_change DECIMAL(12,2) GENERATED ALWAYS AS (new_balance - previous_balance) STORED,
    transaction_id UUID,
    change_type VARCHAR(50) NOT NULL DEFAULT 'manual_adjustment' 
        CHECK (change_type IN ('transaction', 'manual_adjustment', 'correction', 'initial')),
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_account_balance_history_account 
        FOREIGN KEY (account_id) REFERENCES manual_accounts(id) ON DELETE CASCADE
);`);
    console.log('');
    console.log('3. Create indexes:');
    console.log(`
CREATE INDEX IF NOT EXISTS idx_account_balance_history_account_id ON account_balance_history(account_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_user_id ON account_balance_history(user_id);
CREATE INDEX IF NOT EXISTS idx_account_balance_history_created_at ON account_balance_history(created_at DESC);`);
    console.log('');
    console.log('4. Enable RLS and create policy:');
    console.log(`
ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY account_balance_history_user_policy ON account_balance_history
FOR ALL
USING (
    account_id IN (
        SELECT id FROM manual_accounts WHERE user_id = auth.uid()::VARCHAR
    )
);`);
    console.log('');
    console.log('5. Create trigger function:');
    console.log(`
CREATE OR REPLACE FUNCTION create_balance_history()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.current_balance IS DISTINCT FROM NEW.current_balance THEN
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
            COALESCE(OLD.current_balance, 0),
            NEW.current_balance,
            CASE 
                WHEN OLD.current_balance IS NULL THEN 'initial'
                ELSE 'manual_adjustment'
            END,
            'Balance updated'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`);
    console.log('');
    console.log('6. Create trigger:');
    console.log(`
CREATE TRIGGER trigger_create_balance_history
    AFTER INSERT OR UPDATE OF current_balance ON manual_accounts
    FOR EACH ROW
    EXECUTE FUNCTION create_balance_history();`);
    console.log('');
    console.log('After running these commands, the balance history system will be fixed!');
    
  } catch (error) {
    console.error('❌ Balance history diagnosis failed:', error);
  }
}

// Run the diagnosis
fixBalanceHistorySimple();