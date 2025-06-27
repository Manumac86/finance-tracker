import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

test.describe('Authenticated User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup Clerk testing token for each test
    await setupClerkTestingToken({ page });
    
    // Navigate to dashboard - should already be authenticated
    await page.goto('/dashboard');
  });

  test('should access dashboard after authentication', async ({ page }) => {
    // Should be on dashboard after auth
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
  });

  test('should create and view a transaction', async ({ page }) => {
    // Navigate to transactions
    await page.goto('/transactions');
    
    // Click add transaction button
    const addButton = page.locator('button').filter({ hasText: '+' });
    await addButton.click();
    
    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Fill transaction details
    await page.getByLabel(/description/i).fill('Test Transaction from E2E');
    await page.getByLabel(/amount/i).fill('25.99');
    
    // Submit
    await page.getByRole('button', { name: /add transaction/i }).click();
    
    // Wait for modal to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
    
    // Verify transaction appears (wait for SWR update)
    await page.waitForTimeout(2000);
    
    // Look for the transaction we just created
    const transactionText = await page.getByText('Test Transaction from E2E');
    await expect(transactionText).toBeVisible({ timeout: 10000 });
  });

  test('should create a financial goal', async ({ page }) => {
    // Navigate to goals page
    await page.goto('/goals');
    
    // Click add goal button - use first() to handle multiple matching buttons
    const addGoalButton = page.getByRole('button', { name: /add.*goal|new.*goal|create.*goal/i }).first();
    await addGoalButton.click();
    
    // Wait for goal form/modal
    await page.waitForTimeout(1000);
    
    // Fill goal details
    const nameInput = page.getByLabel(/goal.*name|name/i);
    await nameInput.fill('E2E Test Savings Goal');
    
    const amountInput = page.getByLabel(/target.*amount|amount/i);
    await amountInput.fill('1000');
    
    // Select goal type if available
    const typeSelect = page.getByRole('combobox', { name: /type/i });
    if (await typeSelect.isVisible()) {
      await typeSelect.click();
      const savingsOption = page.getByRole('option', { name: /savings/i });
      if (await savingsOption.isVisible()) {
        await savingsOption.click();
      }
    }
    
    // Submit goal
    const submitButton = page.getByRole('button', { name: /create|save|add/i });
    await submitButton.click();
    
    // Verify goal appears
    await page.waitForTimeout(2000);
    const goalText = await page.getByText('E2E Test Savings Goal');
    await expect(goalText).toBeVisible({ timeout: 10000 });
  });

  test('should create a budget', async ({ page }) => {
    // Navigate to budgets page
    await page.goto('/budgets');
    
    // Click add budget button
    const addBudgetButton = page.getByRole('button', { name: /add.*budget|new.*budget|create.*budget/i });
    await addBudgetButton.click();
    
    // Wait for budget form/modal
    await page.waitForTimeout(1000);
    
    // Fill budget amount
    const amountInput = page.getByLabel(/amount/i);
    await amountInput.fill('500');
    
    // Select category if available
    const categorySelect = page.getByRole('combobox', { name: /category/i });
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      await page.waitForTimeout(500);
      // Select first available category
      const firstOption = page.getByRole('option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }
    
    // Submit budget
    const submitButton = page.getByRole('button', { name: /create|save|add/i });
    await submitButton.click();
    
    // Verify budget appears
    await page.waitForTimeout(2000);
    await expect(page.getByText('$500')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate between main sections', async ({ page }) => {
    // Start at dashboard
    await page.goto('/dashboard');
    
    // Navigate to transactions
    await page.getByRole('link', { name: /transaction/i }).first().click();
    await expect(page).toHaveURL(/\/transactions/);
    
    // Navigate to goals
    await page.getByRole('link', { name: /goal/i }).first().click();
    await expect(page).toHaveURL(/\/goals/);
    
    // Navigate to budgets
    await page.getByRole('link', { name: /budget/i }).first().click();
    await expect(page).toHaveURL(/\/budgets/);
    
    // Return to dashboard
    await page.getByRole('link', { name: /dashboard/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should handle user menu actions', async ({ page }) => {
    // Look for Clerk user button
    const userButton = page.locator('.cl-userButtonBox').first();
    await expect(userButton).toBeVisible();
    
    // Click user button
    await userButton.click();
    
    // Verify menu opens
    await expect(page.locator('.cl-userButtonPopoverCard')).toBeVisible();
    
    // Check for sign out option
    const signOutButton = page.getByRole('button', { name: /sign out/i });
    await expect(signOutButton).toBeVisible();
    
    // Close menu without signing out
    await page.keyboard.press('Escape');
  });
});