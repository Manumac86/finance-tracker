#!/usr/bin/env node

/**
 * Direct migration runner for account integration
 * Executes SQL statements directly against Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDirectSQL(sql, description) {
  console.log(`🚀 ${description}`);
  
  try {
    // Split SQL into individual statements and execute them
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed.length === 0) continue;
      
      console.log(`   Executing: ${trimmed.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('execute_sql', { 
        sql: trimmed + ';' 
      });
      
      if (error) {
        console.error(`❌ Failed: ${error.message}`);
        return false;
      }
    }
    
    console.log(`✅ Completed: ${description}`);
    return true;
  } catch (err) {
    console.error(`❌ Error: ${description}`);
    console.error(err.message);
    return false;
  }
}

async function runAccountMigrations() {
  console.log('🎯 Running account integration migrations...\n');

  // Migration 015: Add account_id to transactions
  const migration015 = `
    -- Add account support to transactions table
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_id UUID;
    
    -- Add foreign key constraint
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_transactions_account'
        ) THEN
            ALTER TABLE transactions 
            ADD CONSTRAINT fk_transactions_account 
            FOREIGN KEY (account_id) REFERENCES manual_accounts(id) ON DELETE SET NULL;
        END IF;
    END $$;
    
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_account ON transactions(user_id, account_id);
  `;

  const success1 = await runDirectSQL(migration015, 'Adding account_id to transactions table');
  if (!success1) {
    console.error('❌ First migration failed, stopping');
    return;
  }

  console.log('');

  // Migration 016: Add denormalized account fields
  const migration016 = `
    -- Add denormalized account fields
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_name VARCHAR(100);
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_color VARCHAR(7);
    
    -- Update existing transactions with account information
    UPDATE transactions 
    SET 
        account_name = ma.name,
        account_color = ma.color
    FROM manual_accounts ma 
    WHERE transactions.account_id = ma.id 
    AND transactions.account_id IS NOT NULL
    AND transactions.account_name IS NULL;
    
    -- Create index for account name
    CREATE INDEX IF NOT EXISTS idx_transactions_account_name ON transactions(account_name);
  `;

  const success2 = await runDirectSQL(migration016, 'Adding denormalized account fields');
  if (!success2) {
    console.error('❌ Second migration failed');
    return;
  }

  console.log('\n🎉 All account migrations completed successfully!');
  console.log('✨ Account selection in transactions is now ready to use.');
}

// Run the migrations
runAccountMigrations().catch(console.error);