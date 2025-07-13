import { test, expect } from '../fixtures/clerk-auth';

test.describe('E2E Authentication Bypass', () => {
  test('should bypass authentication and access dashboard', async ({ page }) => {
    // The page has authentication bypass enabled via the fixture
    await page.goto('/en/dashboard');
    
    // Should be on dashboard (with locale prefix)
    await expect(page).toHaveURL(/\/en\/dashboard/);
    
    // Wait for page to load and check for basic content
    await page.waitForLoadState('networkidle');
    
    // Look for common dashboard elements (not auth-specific)
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('should access protected routes with bypass', async ({ page }) => {
    // All protected routes should be accessible (with locale prefix)
    const protectedRoutes = [
      '/en/dashboard',
      '/en/transactions', 
      '/en/goals',
      '/en/budgets',
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(route);
      // Should not redirect to sign in
      await expect(page).not.toHaveURL(/\/signin/);
      
      // Wait for the page to fully load
      await page.waitForLoadState('networkidle');
    }
  });
});