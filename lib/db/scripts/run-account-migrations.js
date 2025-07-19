#!/usr/bin/env node

/**
 * Migration runner for account integration
 * Runs the necessary database migrations for account selection in transactions
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(filename) {
  const migrationPath = path.join(__dirname, '..', 'lib', 'db', 'migrations', filename);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${filename}`);
    return false;
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log(`🚀 Running migration: ${filename}`);
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`❌ Migration failed: ${filename}`);
      console.error(error);
      return false;
    }
    
    console.log(`✅ Migration completed: ${filename}`);
    return true;
  } catch (err) {
    console.error(`❌ Migration failed: ${filename}`);
    console.error(err);
    return false;
  }
}

async function runAccountMigrations() {
  console.log('🎯 Running account integration migrations...\n');

  const migrations = [
    '015_add_account_to_transactions.sql',
    '016_add_account_denormalized_fields.sql'
  ];

  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (!success) {
      console.error('❌ Migration process stopped due to error');
      process.exit(1);
    }
    console.log(''); // Add spacing
  }

  console.log('🎉 All account migrations completed successfully!');
  console.log('✨ Account selection in transactions is now ready to use.');
}

// Run if called directly
if (require.main === module) {
  runAccountMigrations().catch(console.error);
}

module.exports = { runAccountMigrations };