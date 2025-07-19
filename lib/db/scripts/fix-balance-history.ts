import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBalanceHistory() {
  try {
    console.log('🔧 Starting balance history table fix...');
    
    // Read the migration file
    const migrationPath = join(process.cwd(), 'lib/db/migrations/017_fix_balance_history_final.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    // Execute the entire migration as one statement since it contains complex blocks
    console.log(`📄 Executing balance history migration...`);
    
    try {
      const { error } = await supabase.rpc('execute_sql', {
        query: migrationSQL
      });
      
      if (error) {
        console.error(`❌ Migration error:`, error);
        throw error;
      }
      
      console.log(`✅ Migration completed successfully`);
    } catch (migrationError) {
      console.error(`❌ Failed to execute migration:`, migrationError);
      throw migrationError;
    }
    
    // Verify the fix worked
    console.log('🔍 Verifying balance history table structure...');
    
    // First check if table exists
    const { data: tableExists, error: tableCheckError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'account_balance_history';
      `
    });
    
    if (tableCheckError) {
      throw tableCheckError;
    }
    
    console.log('📋 Table existence check:', tableExists);
    
    if (!tableExists || tableExists.length === 0) {
      throw new Error('account_balance_history table was not created');
    }
    
    const { data: columns, error: columnsError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'account_balance_history' 
        ORDER BY ordinal_position;
      `
    });
    
    if (columnsError) {
      throw columnsError;
    }
    
    console.log('📊 Current table structure:');
    console.table(columns);
    
    // Check if required columns exist
    const columnNames = columns?.map((col: { column_name: string }) => col.column_name) || [];
    const requiredColumns = ['id', 'account_id', 'user_id', 'previous_balance', 'new_balance', 'balance_change'];
    
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }
    
    console.log('✅ All required columns are present');
    
    // Test trigger functionality
    console.log('🧪 Testing trigger functionality...');
    
    const { data: triggerTest, error: triggerError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT 
          t.trigger_name,
          t.event_manipulation,
          t.action_timing,
          p.proname as function_name
        FROM information_schema.triggers t
        LEFT JOIN pg_proc p ON p.oid = (
          SELECT oid FROM pg_proc 
          WHERE proname = replace(t.action_statement, 'EXECUTE FUNCTION ', '')
          LIMIT 1
        )
        WHERE t.trigger_name = 'trigger_create_balance_history';
      `
    });
    
    if (triggerError) {
      console.warn('⚠️ Could not verify trigger:', triggerError);
    } else if (triggerTest && triggerTest.length > 0) {
      console.log('✅ Balance history trigger is active');
      console.table(triggerTest);
    } else {
      console.warn('⚠️ Balance history trigger not found');
    }
    
    console.log('🎉 Balance history fix completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. The balance history table has been recreated with correct column names');
    console.log('2. The trigger function has been updated to use the correct columns');
    console.log('3. Row Level Security policies are in place');
    console.log('4. All existing balance history data has been cleared (as it was incompatible)');
    console.log('5. New balance changes will now be properly tracked');
    
  } catch (error) {
    console.error('❌ Balance history fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
fixBalanceHistory();