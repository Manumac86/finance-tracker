import { FullConfig } from '@playwright/test';
import { clerkSetup } from '@clerk/testing/playwright';
import dotenv from 'dotenv';
import path from 'path';
import { setupClerkEnvironment } from './setup-clerk-env';
import { setupTestDatabase } from './utils/database-seeder';

async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Starting E2E Tests Setup\n');
  
  // Load environment variables from .env.local
  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  
  // Check required environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'DATABASE_URL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Missing environment variables for E2E tests:');
    missingVars.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('\nSome tests may fail without these variables.');
  } else {
    console.log('✅ All required environment variables are set');
  }

  // Setup Clerk for testing
  try {
    console.log('\n🔐 Setting up Clerk testing environment...');
    
    // Setup Clerk environment variables
    const clerkEnv = setupClerkEnvironment();
    console.log(`✅ Clerk Frontend API URL: ${clerkEnv.frontendApi}`);
    console.log(`✅ Clerk Environment: ${clerkEnv.environment}`);
    
    // Ensure testing token is available
    if (!process.env.CLERK_TESTING_TOKEN) {
      console.warn('⚠️  CLERK_TESTING_TOKEN not found in environment');
      console.warn('   Authenticated tests may fail without testing token');
    } else {
      console.log('✅ Clerk testing token found');
    }
    
    // Call clerkSetup to initialize Clerk testing with explicit config
    await clerkSetup({
      frontendApiUrl: clerkEnv.frontendApi
    });
    console.log('✅ Clerk testing environment initialized');
    
  } catch (error) {
    console.error('\n❌ Failed to setup Clerk testing:', error);
    console.warn('Authenticated tests may fail');
  }

  console.log('\n📧 Clerk Testing Setup:');
  console.log('   - Clerk testing environment is ready');
  console.log('   - Use setupClerkTestingToken() in tests for authentication');
  console.log('   - No real user accounts needed\n');

  // Setup test database with categories
  try {
    console.log('🗄️  Setting up test database...');
    await setupTestDatabase();
    console.log('✅ Test database setup completed');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    console.warn('Database-dependent tests may fail');
  }
}

export default globalSetup;