import { test as base } from '@playwright/test';

// Extend basic test with E2E authentication bypass
export const test = base.extend({
  // Automatically setup authentication bypass for tests
  page: async ({ page }, use) => {
    // Set the bypass header for all requests during this test
    await page.setExtraHTTPHeaders({
      'x-e2e-test-bypass': 'true'
    });
    
    console.log('✅ E2E authentication bypass enabled');
    
    // Use the page in the test
    await use(page);
  },
});

export { expect } from '@playwright/test';