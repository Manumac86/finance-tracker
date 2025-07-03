import { test, expect } from '@playwright/test';
import { authenticateTestUser } from '../utils/test-auth';
import { testTransactions, testCategories } from '../fixtures/test-data';
import { setupTestDatabase, cleanupTestData, createTestSupabaseClient, getTestCategoryByName } from '../utils/database-seeder';

test.describe('Authenticated Transactions', () => {
  let testUserId: string;
  let supabase: ReturnType<typeof createTestSupabaseClient>;

  test.beforeAll(async () => {
    // Setup test database with categories
    supabase = await setupTestDatabase();
  });

  test.beforeEach(async ({ page }) => {
    // Authenticate (this should set up a test user)
    await authenticateTestUser(page);
    
    // For testing purposes, use a fixed test user ID
    testUserId = 'e2e-test-user-' + Date.now();
    
    // Clean up any existing test data for this user
    if (supabase) {
      await cleanupTestData(supabase, testUserId);
    }
    
    // Navigate to transactions
    await page.goto('/transactions');
  });

  test.afterEach(async () => {
    // Clean up test data after each test
    if (testUserId && supabase) {
      await cleanupTestData(supabase, testUserId);
    }
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
    const addButton = page.getByTestId('floating-add-transaction-button').first();
    await expect(addButton).toBeVisible();
    
    const bulkButton = page.getByRole('button', { name: /bulk/i });
    await expect(bulkButton).toBeVisible();
  });

  test('should create a new expense transaction', async ({ page }) => {
    const testTransaction = testTransactions.coffeeExpense;
    const expectedCategory = getTestCategoryByName('Food & Drink');
    
    // Click add button
    const addButton = page.getByTestId('floating-add-transaction-button').first();
    await addButton.click();
    
    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Fill transaction form
    await page.getByLabel(/description|name/i).fill(testTransaction.name);
    await page.getByLabel(/amount/i).fill(testTransaction.amount.toString());
    
    // Select category if available
    const categorySelect = page.getByRole('combobox', { name: /category/i });
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      
      // Wait for dropdown and select Food & Drink category
      const categoryOption = page.getByRole('option', { name: new RegExp(expectedCategory.name, 'i') });
      if (await categoryOption.isVisible({ timeout: 3000 })) {
        await categoryOption.click();
      } else {
        // Fallback: press escape to close dropdown
        await page.keyboard.press('Escape');
      }
    }
    
    // Add description if field exists
    const descriptionField = page.getByLabel(/description/i);
    if (await descriptionField.isVisible()) {
      await descriptionField.fill(testTransaction.description);
    }
    
    // Submit transaction
    await page.getByRole('button', { name: /add.*transaction|create|save/i }).click();
    
    // Wait for modal to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
    
    // Wait for data to update
    await page.waitForTimeout(3000);
    
    // Transaction should appear in the list
    await expect(page.getByText(testTransaction.name)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(`$${testTransaction.amount.toFixed(2)}`)).toBeVisible();
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
    
    // Enter test transactions using our test data
    const textArea = page.locator('textarea');
    const bulkText = [
      `${testTransactions.groceryExpense.name} $${testTransactions.groceryExpense.amount}`,
      `${testTransactions.gasExpense.name} $${testTransactions.gasExpense.amount}`,
      `Restaurant $28.75`
    ].join('\n');
    
    await textArea.fill(bulkText);
    
    // Parse transactions if parse button exists
    const parseButton = page.getByRole('button', { name: /parse/i });
    if (await parseButton.isVisible()) {
      await parseButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Submit bulk transactions
    const submitButton = page.getByRole('button', { name: /add.*transaction|import|create/i });
    await submitButton.click();
    
    // Wait for modal to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 15000 });
    
    // Wait for data to update
    await page.waitForTimeout(3000);
    
    // Verify at least one transaction was added
    await expect(page.getByText(testTransactions.groceryExpense.name)).toBeVisible({ timeout: 15000 });
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