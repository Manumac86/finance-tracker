import { createClient } from '@supabase/supabase-js';
import { testCategories, testTransactions } from '../fixtures/test-data';

// Initialize Supabase client for testing
export function createTestSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables for E2E tests');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Seed test categories for E2E tests
 */
export async function seedTestCategories(supabase: ReturnType<typeof createTestSupabaseClient>) {
  console.log('🌱 Seeding test categories...');
  
  try {
    // Insert categories with proper UUID IDs
    const categoriesToInsert = Object.values(testCategories).map(category => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      category_type: 'personal',
      is_system_category: true,
      is_active: true,
      user_id: null, // System categories
      description: `Test category for ${category.name}`,
      parent_category_id: null,
      is_tax_deductible: false,
      tax_category_code: null,
      business_expense_type: null,
      tags: [],
      project_id: null,
      sort_order: 0,
      translations: null,
    }));
    
    // Use upsert to avoid conflicts
    const { data, error } = await supabase
      .from('categories')
      .upsert(categoriesToInsert, { 
        onConflict: 'id',
        ignoreDuplicates: true 
      })
      .select();
    
    if (error) {
      console.warn('Category seeding warning:', error.message);
      // Don't throw error for categories that already exist
      if (!error.message.includes('duplicate key') && !error.message.includes('already exists')) {
        throw error;
      }
    }
    
    console.log(`✅ Seeded ${categoriesToInsert.length} test categories`);
    return data;
  } catch (error) {
    console.error('❌ Failed to seed categories:', error);
    throw error;
  }
}

/**
 * Clean up test data for a specific user
 */
export async function cleanupTestData(supabase: ReturnType<typeof createTestSupabaseClient>, userId: string) {
  console.log(`🧹 Cleaning up test data for user: ${userId}`);
  
  try {
    // Delete test transactions
    await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId);
    
    // Delete test goals
    await supabase
      .from('goals')
      .delete()
      .eq('user_id', userId);
    
    // Delete test budgets
    await supabase
      .from('budgets')
      .delete()
      .eq('user_id', userId);
    
    // Delete user-specific categories (keep system categories)
    await supabase
      .from('categories')
      .delete()
      .eq('user_id', userId);
    
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.error('❌ Failed to cleanup test data:', error);
    throw error;
  }
}

/**
 * Seed test transactions for a specific user
 */
export async function seedTestTransactions(
  supabase: ReturnType<typeof createTestSupabaseClient>, 
  userId: string
) {
  console.log(`🌱 Seeding test transactions for user: ${userId}`);
  
  try {
    // First ensure categories exist
    await seedTestCategories(supabase);
    
    // Create transactions with proper format
    const transactionsToInsert = Object.values(testTransactions).map(transaction => ({
      user_id: userId,
      name: transaction.name,
      description: transaction.description,
      amount: transaction.transactionType === 'expense' ? -transaction.amount : transaction.amount,
      transaction_type: transaction.transactionType,
      category_id: transaction.categoryId,
      category_name: Object.values(testCategories).find(cat => cat.id === transaction.categoryId)?.name || 'Unknown',
      category_icon: Object.values(testCategories).find(cat => cat.id === transaction.categoryId)?.icon || 'Circle',
      transaction_date: new Date().toISOString(),
      is_active: true,
    }));
    
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Seeded ${transactionsToInsert.length} test transactions`);
    return data;
  } catch (error) {
    console.error('❌ Failed to seed transactions:', error);
    throw error;
  }
}

/**
 * Verify database schema and foreign key relationships
 */
export async function verifyDatabaseSchema(supabase: ReturnType<typeof createTestSupabaseClient>) {
  console.log('🔍 Verifying database schema...');
  
  try {
    // Check if categories table has required columns
    const { error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, user_id, is_system_category')
      .limit(1);
    
    if (categoriesError) {
      throw new Error(`Categories table issue: ${categoriesError.message}`);
    }
    
    // Check if transactions table has UUID category_id
    const { error: transactionsError } = await supabase
      .from('transactions')
      .select('id, category_id, category_name, category_icon')
      .limit(1);
    
    if (transactionsError) {
      throw new Error(`Transactions table issue: ${transactionsError.message}`);
    }
    
    console.log('✅ Database schema verification passed');
    return true;
  } catch (error) {
    console.error('❌ Database schema verification failed:', error);
    throw error;
  }
}

/**
 * Complete test database setup
 */
export async function setupTestDatabase(userId?: string) {
  const supabase = createTestSupabaseClient();
  
  try {
    console.log('🚀 Setting up test database...');
    
    // Verify schema
    await verifyDatabaseSchema(supabase);
    
    // Seed categories (system-wide)
    await seedTestCategories(supabase);
    
    // Seed transactions for specific user if provided
    if (userId) {
      await seedTestTransactions(supabase, userId);
    }
    
    console.log('✅ Test database setup completed');
    return supabase;
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
}

/**
 * Get test category by name for use in tests
 */
export function getTestCategoryByName(name: string) {
  const category = Object.values(testCategories).find(cat => cat.name === name);
  if (!category) {
    throw new Error(`Test category '${name}' not found`);
  }
  return category;
}

/**
 * Generate a test transaction with random data
 */
export function generateTestTransaction(overrides: Partial<typeof testTransactions.coffeeExpense> = {}) {
  const timestamp = Date.now();
  const categories = Object.values(testCategories);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  
  return {
    name: `Test Transaction ${timestamp}`,
    amount: Math.round((Math.random() * 100 + 1) * 100) / 100, // $1-$100
    transactionType: Math.random() > 0.7 ? 'income' : 'expense' as const,
    categoryId: randomCategory.id,
    description: `E2E test transaction created at ${new Date().toISOString()}`,
    ...overrides,
  };
}