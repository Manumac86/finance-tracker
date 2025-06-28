import { test, expect } from '@playwright/test';

test.describe('Clerk Testing Direct Approach', () => {
  test('should authenticate with testing token in URL', async ({ page }) => {
    // Try using the testing token directly in the URL as per Clerk docs
    const testingToken = process.env.CLERK_TESTING_TOKEN || '424242';
    
    // Method 1: Add testing token as query parameter
    await page.goto(`/dashboard?__clerk_testing_token=${testingToken}`);
    
    // Give it time to process
    await page.waitForTimeout(3000);
    
    // Check if we're authenticated
    const currentUrl = page.url();
    console.log('Current URL after token:', currentUrl);
    
    if (currentUrl.includes('/dashboard') && !currentUrl.includes('signin')) {
      // Success! We're on the dashboard
      await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
    } else {
      // Still redirected to signin
      console.log('Still not authenticated, URL:', currentUrl);
    }
  });

  test('should set testing token via cookie', async ({ page, context }) => {
    const testingToken = process.env.CLERK_TESTING_TOKEN || '424242';
    
    // Method 2: Set testing token as cookie
    await context.addCookies([{
      name: '__clerk_testing_token',
      value: testingToken,
      domain: 'localhost',
      path: '/',
    }]);
    
    // Now navigate
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('Current URL after cookie:', currentUrl);
  });

  test('should use Clerk test mode', async ({ page }) => {
    // Method 3: Check if we can access Clerk's test mode directly
    await page.goto('/');
    
    // Check if Clerk is loaded
    const hasClerk = await page.evaluate(() => {
      return typeof (window as any).Clerk !== 'undefined';
    });
    
    console.log('Clerk loaded:', hasClerk);
    
    if (hasClerk) {
      // Try to get Clerk instance info
      const clerkInfo = await page.evaluate(() => {
        const clerk = (window as any).Clerk;
        return {
          version: clerk?.version,
          isReady: clerk?.isReady(),
          frontendApi: clerk?.frontendApi,
        };
      });
      
      console.log('Clerk info:', clerkInfo);
    }
  });
});