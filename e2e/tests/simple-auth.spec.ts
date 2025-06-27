import { test, expect } from '@playwright/test';

test.describe('Simple Tests Without Authentication', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads (title might be "Create Next App" or custom)
    await expect(page).toHaveTitle(/Create Next App|Finance|Tracker/i);
    
    // Check for main navigation elements
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/');
    
    // Click sign in link
    await page.getByRole('link', { name: /sign in/i }).click();
    
    // Should be on sign in page
    await expect(page).toHaveURL(/\/signin/);
    await expect(page.locator('[data-testid="auth-container"]')).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.goto('/');
    
    // Click sign up link
    await page.getByRole('link', { name: /sign up/i }).first().click();
    
    // Should be on sign up page
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.locator('[data-testid="auth-container"]')).toBeVisible();
  });

  test('should show 404 for non-existent page', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should show 404 or redirect
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/404|not found|sign in/i);
  });
});