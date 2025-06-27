import { test as base } from '@playwright/test';

// Simple fixture that skips authentication for now
export const test = base.extend({
  // Override page to skip auth checks
  page: async ({ page }, use) => {
    // For now, just use the page as-is
    // You can add mock authentication here later
    await use(page);
  },
});

export { expect } from '@playwright/test';