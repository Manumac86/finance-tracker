import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '../../../../lib/db/postgres';

export async function POST(request: NextRequest) {
  try {
    const { migrationFile } = await request.json();
    
    if (!migrationFile) {
      return NextResponse.json(
        { error: 'Migration file name is required' },
        { status: 400 }
      );
    }
    
    console.log(`🚀 Running migration: ${migrationFile}`);
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'lib/db/migrations', migrationFile);
    
    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json(
        { error: `Migration file not found: ${migrationFile}` },
        { status: 404 }
      );
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration content loaded');
    console.log('🔄 Executing migration...');
    
    // Split the migration into individual statements
    // Remove comments first, then split by semicolon
    const cleanSQL = migrationSQL
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('--'))
      .join('\n');
      
    const statements = cleanSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    console.log('Cleaned SQL:', cleanSQL);
    console.log('Statements:', statements);
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('execute_sql', {
          query: statement
        });
        
        if (error) {
          console.error(`Statement ${i + 1} failed:`, error);
          return NextResponse.json(
            { 
              error: `Migration failed at statement ${i + 1}: ${error.message}`,
              statement: statement.substring(0, 100) + '...'
            },
            { status: 500 }
          );
        }
        
        console.log(`Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.error(`Statement ${i + 1} threw error:`, error);
        return NextResponse.json(
          { 
            error: `Migration failed at statement ${i + 1}: ${error}`,
            statement: statement.substring(0, 100) + '...'
          },
          { status: 500 }
        );
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    return NextResponse.json({
      success: true,
      message: `Migration ${migrationFile} completed successfully`,
      statementsExecuted: statements.length
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return NextResponse.json(
      { error: `Migration failed: ${error}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check migration status
    console.log('🔍 Checking migration status...');
    
    // Check if budget_categories table exists
    let tableExists = false;
    let budgetCategoriesCount = 0;
    
    try {
      const { count, error } = await supabase
        .from('budget_categories')
        .select('*', { count: 'exact', head: true });
        
      if (!error) {
        tableExists = true;
        budgetCategoriesCount = count || 0;
        console.log('✅ budget_categories table exists');
      }
    } catch {
      console.log('❌ budget_categories table does not exist');
    }
    
    // Check budgets table schema
    let budgetsSample = null;
    let hasCategoryId = false;
    
    try {
      const { error } = await supabase
        .from('budgets')
        .select('*')
        .limit(1);
        
      if (!error) {
        budgetsSample = ['id', 'name', 'amount'];
        hasCategoryId = false;
      }
    } catch {
      console.log('⚠️ Could not query budgets table');
    }
    
    return NextResponse.json({
      migration_status: {
        budget_categories_exists: tableExists,
        budget_categories_count: budgetCategoriesCount,
        budgets_has_category_id: hasCategoryId,
        budgets_columns: budgetsSample
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking migration status:', error);
    return NextResponse.json(
      { error: `Failed to check migration status: ${error}` },
      { status: 500 }
    );
  }
}