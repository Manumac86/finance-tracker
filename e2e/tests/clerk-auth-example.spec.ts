import { test, expect } from '../fixtures/clerk-auth';

test.describe('Clerk Authentication Example', () => {
  test('should authenticate and access dashboard', async ({ page }) => {
    // The page is already authenticated via the fixture
    await page.goto('/dashboard');
    
    // Should be on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Dashboard header should be visible
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
  });

  test('should show user button when authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Clerk user button should be visible
    const userButton = page.locator('.cl-userButtonBox').first();
    await expect(userButton).toBeVisible();
  });

  test('should access protected routes', async ({ page }) => {
    // All protected routes should be accessible
    const protectedRoutes = [
      '/dashboard',
      '/transactions', 
      '/goals',
      '/budgets',
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(route);
      // Should not redirect to sign in
      await expect(page).not.toHaveURL(/\/signin/);
    }
  });
});