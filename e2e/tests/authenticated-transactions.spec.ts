import { test, expect } from '@playwright/test';
import { authenticateTestUser } from '../utils/test-auth';

test.describe('Authenticated Transactions', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate and navigate to transactions
    await authenticateTestUser(page);
    await page.goto('/transactions');
  });

  test('should display transaction page elements', async ({ page }) => {
    // Verify we're on transactions page
    await expect(page).toHaveURL(/\/transactions/);
    
    // Check statistics cards
    await expect(page.getByText('Total Income')).toBeVisible();
    await expect(page.getByText('Total Expenses')).toBeVisible();
    await expect(page.getByText('Net Amount')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
    
    // Check for search input
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
    
    // Check for floating action buttons
    const addButton = page.locator('button').filter({ hasText: '+' });
    await expect(addButton).toBeVisible();
    
    const bulkButton = page.getByRole('button', { name: /bulk/i });
    await expect(bulkButton).toBeVisible();
  });

  test('should create a new expense transaction', async ({ page }) => {
    // Click add button
    const addButton = page.locator('button').filter({ hasText: '+' });
    await addButton.click();
    
    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Fill transaction form
    await page.getByLabel(/description/i).fill('Coffee Shop');
    await page.getByLabel(/amount/i).fill('4.50');
    
    // Submit transaction
    await page.getByRole('button', { name: /add transaction/i }).click();
    
    // Wait for modal to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 });
    
    // Success notification might appear
    await page.waitForTimeout(2000);
    
    // Transaction should appear in the list
    await expect(page.getByText('Coffee Shop')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('$4.50')).toBeVisible();
  });

  test('should filter transactions by type', async ({ page }) => {
    // Click on type filter
    const typeFilter = page.getByRole('combobox').nth(1); // Assuming second combobox is type
    await typeFilter.click();
    
    // Select expense option
    const expenseOption = page.getByRole('option', { name: /expense/i });
    if (await expenseOption.isVisible()) {
      await expenseOption.click();
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);
      
      // Verify URL or filter state updated
      const url = page.url();
      expect(url).toContain('type=expense');
    }
  });

  test('should use bulk import with quick text', async ({ page }) => {
    // Click bulk button
    await page.getByRole('button', { name: /bulk/i }).click();
    
    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Ensure we're on quick text tab
    const quickTextTab = page.getByRole('tab', { name: /quick text/i });
    if (await quickTextTab.getAttribute('aria-selected') !== 'true') {
      await quickTextTab.click();
    }
    
    // Enter transactions
    const textArea = page.locator('textarea');
    await textArea.fill('Grocery Store $45.00\nGas Station $35.50\nRestaurant $28.75');
    
    // Parse and submit
    const parseButton = page.getByRole('button', { name: /parse/i });
    if (await parseButton.isVisible()) {
      await parseButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Submit bulk transactions
    const submitButton = page.getByRole('button', { name: /add.*transaction|import/i });
    await submitButton.click();
    
    // Wait for modal to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
    
    // Verify transactions were added
    await page.waitForTimeout(2000);
    await expect(page.getByText('Grocery Store')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to manage transactions', async ({ page }) => {
    // Look for manage link
    const manageLink = page.getByRole('link', { name: /manage/i });
    if (await manageLink.isVisible()) {
      await manageLink.click();
      await expect(page).toHaveURL(/\/transactions\/manage/);
      
      // Verify manage page loaded
      await expect(page.getByText(/manage.*transactions/i)).toBeVisible();
    }
  });
});