import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db/postgres';

export async function POST() {
  try {
    console.log('🚀 Running direct budget categories migration...');
    
    // Step 1: Check current state
    console.log('🔍 Checking current state...');
    
    // Check budget_categories table exists and is accessible
    const { count: bcCount, error: bcError } = await supabase
      .from('budget_categories')
      .select('*', { count: 'exact', head: true });
      
    if (bcError) {
      console.error('❌ Cannot access budget_categories table:', bcError.message);
      return NextResponse.json(
        { error: `Cannot access budget_categories table: ${bcError.message}` },
        { status: 500 }
      );
    }
    
    console.log(`✅ budget_categories table exists with ${bcCount} rows`);
    
    // Step 2: Get budgets with category_id
    console.log('🔍 Looking for budgets with category_id...');
    
    const { data: budgetsWithCategories, error: budgetsError } = await supabase
      .from('budgets')
      .select('id, category_id')
      .not('category_id', 'is', null);
      
    if (budgetsError) {
      console.error('❌ Cannot query budgets:', budgetsError.message);
      return NextResponse.json(
        { error: `Cannot query budgets: ${budgetsError.message}` },
        { status: 500 }
      );
    }
    
    console.log(`✅ Found ${budgetsWithCategories?.length || 0} budgets with category_id`);
    
    if (budgetsWithCategories && budgetsWithCategories.length > 0) {
      // Step 3: Migrate data to budget_categories table
      console.log('🔄 Migrating budget-category associations...');
      
      const budgetCategories = budgetsWithCategories.map(budget => ({
        budget_id: budget.id,
        category_id: budget.category_id
      }));
      
      const { data: insertData, error: insertError } = await supabase
        .from('budget_categories')
        .upsert(budgetCategories, { 
          onConflict: 'budget_id,category_id',
          ignoreDuplicates: true 
        })
        .select();
        
      if (insertError) {
        console.error('❌ Failed to insert budget categories:', insertError.message);
        return NextResponse.json(
          { error: `Failed to insert budget categories: ${insertError.message}` },
          { status: 500 }
        );
      }
      
      console.log(`✅ Migrated ${insertData?.length || 0} budget-category associations`);
    }
    
    // Step 4: Verify migration worked
    const { count: finalCount, error: finalError } = await supabase
      .from('budget_categories')
      .select('*', { count: 'exact', head: true });
      
    if (finalError) {
      console.error('❌ Cannot verify migration:', finalError.message);
    } else {
      console.log(`✅ Final budget_categories count: ${finalCount}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Budget categories migration completed successfully',
      budgets_migrated: budgetsWithCategories?.length || 0,
      final_budget_categories_count: finalCount || 0,
      note: 'category_id column removal requires manual database access'
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
    // Detailed migration status check
    console.log('🔍 Checking detailed migration status...');
    
    // Check budget_categories table
    const { data: bcData, count: bcCount, error: bcError } = await supabase
      .from('budget_categories')
      .select('budget_id, category_id', { count: 'exact' });
      
    // Check budgets with category_id
    const { data: budgetsData, count: budgetsCount, error: budgetsError } = await supabase
      .from('budgets')
      .select('id, category_id', { count: 'exact' })
      .not('category_id', 'is', null);
      
    // Get sample budget to check schema
    const { data: budgetSample, error: sampleError } = await supabase
      .from('budgets')
      .select('*')
      .limit(1);
    
    return NextResponse.json({
      budget_categories: {
        accessible: !bcError,
        count: bcCount || 0,
        error: bcError?.message || null,
        sample_data: bcData?.slice(0, 3) || []
      },
      budgets_with_category_id: {
        accessible: !budgetsError,
        count: budgetsCount || 0,
        error: budgetsError?.message || null,
        sample_data: budgetsData?.slice(0, 3) || []
      },
      budgets_schema: {
        accessible: !sampleError,
        columns: budgetSample?.[0] ? Object.keys(budgetSample[0]) : [],
        has_category_id: budgetSample?.[0] ? 'category_id' in budgetSample[0] : false,
        error: sampleError?.message || null
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