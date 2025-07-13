import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    console.log('🚀 Creating budget_categories table...');
    
    // Use Supabase admin client with service role key for DDL operations
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Step 1: Create the table using raw SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS budget_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
          category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          
          -- Ensure unique budget-category combinations
          UNIQUE(budget_id, category_id)
      );
    `;
    
    console.log('📝 Creating table...');
    const { data: createResult, error: createError } = await supabaseAdmin.rpc('exec', {
      sql: createTableSQL
    });
    
    if (createError) {
      console.log('⚠️ Table creation via exec failed, trying alternative approach...');
      console.log('Error:', createError.message);
      
      // Alternative: Try using the REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: createTableSQL })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ REST API failed:', errorText);
        
        return NextResponse.json({
          error: 'Cannot create table via API. Manual database access required.',
          sql_to_run: createTableSQL,
          note: 'Please run this SQL in Supabase SQL Editor or database admin tool'
        }, { status: 500 });
      }
    }
    
    console.log('✅ Table creation successful');
    
    // Step 2: Create indexes
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_budget_categories_budget_id ON budget_categories(budget_id);
      CREATE INDEX IF NOT EXISTS idx_budget_categories_category_id ON budget_categories(category_id);
    `;
    
    console.log('📝 Creating indexes...');
    const { error: indexError } = await supabaseAdmin.rpc('exec', {
      sql: indexSQL
    });
    
    if (indexError) {
      console.log('⚠️ Index creation failed:', indexError.message);
    } else {
      console.log('✅ Indexes created');
    }
    
    // Step 3: Enable RLS
    const rlsSQL = `
      ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY budget_categories_user_policy ON budget_categories
      FOR ALL
      USING (
          budget_id IN (
              SELECT id FROM budgets WHERE user_id = auth.uid()
          )
      );
    `;
    
    console.log('📝 Setting up RLS...');
    const { error: rlsError } = await supabaseAdmin.rpc('exec', {
      sql: rlsSQL
    });
    
    if (rlsError) {
      console.log('⚠️ RLS setup failed:', rlsError.message);
    } else {
      console.log('✅ RLS enabled');
    }
    
    return NextResponse.json({
      success: true,
      message: 'budget_categories table created successfully',
      next_steps: 'Run migration to populate data'
    });
    
  } catch (error) {
    console.error('❌ Table creation failed:', error);
    return NextResponse.json(
      { error: `Table creation failed: ${error}` },
      { status: 500 }
    );
  }
}