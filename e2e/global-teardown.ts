import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Cleaning up E2E Tests\n');
  
  // Clean up the testing token from environment
  if (process.env.CLERK_TESTING_TOKEN) {
    delete process.env.CLERK_TESTING_TOKEN;
    console.log('✅ Clerk testing token cleaned up');
  }
  
  console.log('\n✨ E2E Tests cleanup complete\n');
}

export default globalTeardown;