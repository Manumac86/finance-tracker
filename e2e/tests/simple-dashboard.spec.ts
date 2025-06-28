import { test, expect } from '@playwright/test';

test.describe('Simple Dashboard Tests (No Auth)', () => {
  test('should redirect unauthenticated users to signin', async ({ page }) => {
    // Navigate to dashboard without auth
    await page.goto('/dashboard');
    
    // Should redirect to signin
    await expect(page).toHaveURL(/\/signin/);
    
    // Should include redirect URL
    const url = page.url();
    expect(url).toContain('redirect_url');
    expect(url).toContain('dashboard');
  });

  test('should show signin page elements', async ({ page }) => {
    await page.goto('/signin');
    
    // Should show Clerk signin component
    await expect(page.locator('.cl-component')).toBeVisible();
    
    // Should have sign in form or identifier input
    const identifierInput = page.locator('input[name="identifier"]');
    const hasInput = await identifierInput.count() > 0;
    
    if (hasInput) {
      await expect(identifierInput).toBeVisible();
    }
  });

  test('non-authenticated pages should work', async ({ page }) => {
    // Home page
    await page.goto('/');
    await expect(page).toHaveURL('/');
    
    // Sign up page
    await page.goto('/signup');
    await expect(page).toHaveURL(/\/signup/);
  });
});