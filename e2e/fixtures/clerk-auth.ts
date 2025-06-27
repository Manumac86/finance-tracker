import { test as base } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

// Extend basic test with Clerk authentication
export const test = base.extend({
  // Automatically setup Clerk testing token before each test
  page: async ({ page }, use) => {
    try {
      // Setup Clerk testing token
      await setupClerkTestingToken({ page });
      console.log('✅ Clerk testing token setup successful');
    } catch (error) {
      console.warn('⚠️  Clerk testing token setup failed:', error);
      console.warn('Running test without authentication');
    }
    
    // Use the page in the test
    await use(page);
  },
});

export { expect } from '@playwright/test';