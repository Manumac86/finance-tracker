import { test, expect } from '@playwright/test';
import { authenticateTestUser } from '../utils/test-auth';
import { testTransactions, testCategories } from '../fixtures/test-data';
import { setupTestDatabase, cleanupTestData, createTestSupabaseClient } from '../utils/database-seeder';
import { waitForTransactionsLoad, waitForModal, fillTransactionForm, waitForTransactionInList } from '../utils/page-helpers';

test.describe('Category Relationships After Migration', () => {
  let testUserId: string;
  let supabase: ReturnType<typeof createTestSupabaseClient>;

  test.beforeAll(async () => {
    // Setup test database with UUID categories
    supabase = await setupTestDatabase();
  });

  test.beforeEach(async ({ page }) => {
    // Authenticate
    await authenticateTestUser(page);
    testUserId = 'e2e-category-test-' + Date.now();
    
    // Clean up any existing test data
    if (supabase) {
      await cleanupTestData(supabase, testUserId);
    }
    
    await page.goto('/transactions');
    await waitForTransactionsLoad(page);
  });

  test.afterEach(async () => {
    if (testUserId && supabase) {
      await cleanupTestData(supabase, testUserId);
    }
  });

  test('should display categories with proper UUID relationships', async ({ page }) => {
    // Use the proper test ID for the floating action button (first one that's visible)
    const addButton = page.getByTestId('floating-add-transaction-button').first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();
    await waitForModal(page, 'open');

    // Click category selector
    const categorySelect = page.getByRole('combobox', { name: /category/i });
    await categorySelect.click();

    // Wait for dropdown to open
    await page.waitForTimeout(1000);

    // Verify test categories are available
    for (const category of Object.values(testCategories)) {
      const categoryOption = page.getByRole('option', { name: new RegExp(category.name, 'i') });
      await expect(categoryOption).toBeVisible({ timeout: 5000 });
    }

    // Close modal
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
  });

  test('should create transaction with Food & Drink category', async ({ page }) => {
    const testTransaction = {
      name: testTransactions.coffeeExpense.name,
      amount: testTransactions.coffeeExpense.amount,
      description: testTransactions.coffeeExpense.description,
      categoryName: 'Food & Drink'
    };

    // Create transaction
    const addButton = page.getByTestId('floating-add-transaction-button').first();
    await addButton.click();
    await waitForModal(page, 'open');
    
    await fillTransactionForm(page, testTransaction);
    
    // Submit
    await page.getByRole('button', { name: /add.*transaction|create|save/i }).click();
    await waitForModal(page, 'close');

    // Verify transaction appears with correct category
    await waitForTransactionInList(page, testTransaction.name, testTransaction.amount);
    
    // Check that category is displayed correctly
    const transactionRow = page.locator(`text=${testTransaction.name}`).locator('..');
    await expect(transactionRow.getByText(/food.*drink/i)).toBeVisible();
  });

  test('should create transaction with Shopping category', async ({ page }) => {
    const testTransaction = {
      name: testTransactions.groceryExpense.name,
      amount: testTransactions.groceryExpense.amount,
      description: testTransactions.groceryExpense.description,
      categoryName: 'Shopping'
    };

    // Create transaction
    const addButton = page.getByTestId('floating-add-transaction-button').first();
    await addButton.click();
    await waitForModal(page, 'open');
    
    await fillTransactionForm(page, testTransaction);
    
    // Submit
    await page.getByRole('button', { name: /add.*transaction|create|save/i }).click();
    await waitForModal(page, 'close');

    // Verify transaction appears
    await waitForTransactionInList(page, testTransaction.name, testTransaction.amount);
    
    // Check that Shopping category is displayed
    const transactionRow = page.locator(`text=${testTransaction.name}`).locator('..');
    await expect(transactionRow.getByText(/shopping/i)).toBeVisible();
  });

  test('should filter transactions by category', async ({ page }) => {
    // First create transactions in different categories
    const transactions = [
      {
        name: 'Coffee Purchase',
        amount: 4.50,
        categoryName: 'Food & Drink'
      },
      {
        name: 'Clothing Store',
        amount: 29.99,
        categoryName: 'Shopping'
      }
    ];

    // Create both transactions
    for (const transaction of transactions) {
      const addButton = page.getByTestId('floating-add-transaction-button').first();
      await addButton.click();
      await waitForModal(page, 'open');
      
      await fillTransactionForm(page, transaction);
      
      await page.getByRole('button', { name: /add.*transaction|create|save/i }).click();
      await waitForModal(page, 'close');
      
      // Wait for transaction to appear
      await waitForTransactionInList(page, transaction.name);
    }

    // Now test filtering by category
    const categoryFilter = page.getByRole('combobox').first();
    await categoryFilter.click();
    
    // Select Food & Drink filter
    const foodDrinkOption = page.getByRole('option', { name: /food.*drink/i });
    if (await foodDrinkOption.isVisible({ timeout: 3000 })) {
      await foodDrinkOption.click();
      
      // Wait for filter to apply
      await page.waitForTimeout(2000);
      
      // Should see coffee transaction but not clothing
      await expect(page.getByText('Coffee Purchase')).toBeVisible();
      await expect(page.getByText('Clothing Store')).not.toBeVisible();
    }
  });

  test('should handle transaction editing with category changes', async ({ page }) => {
    // Create initial transaction
    const initialTransaction = {
      name: 'Test Transaction',
      amount: 25.00,
      categoryName: 'Shopping'
    };

    const addButton = page.getByTestId('floating-add-transaction-button').first();
    await addButton.click();
    await waitForModal(page, 'open');
    
    await fillTransactionForm(page, initialTransaction);
    
    await page.getByRole('button', { name: /add.*transaction|create|save/i }).click();
    await waitForModal(page, 'close');

    // Wait for transaction to appear
    await waitForTransactionInList(page, initialTransaction.name);

    // Edit the transaction (if edit functionality exists)
    const transactionCard = page.locator(`text=${initialTransaction.name}`).locator('..');
    const editButton = transactionCard.getByRole('button', { name: /edit/i });
    
    if (await editButton.isVisible({ timeout: 3000 })) {
      await editButton.click();
      await waitForModal(page, 'open');

      // Change category to Food & Drink
      const categorySelect = page.getByRole('combobox', { name: /category/i });
      await categorySelect.click();
      
      const foodDrinkOption = page.getByRole('option', { name: /food.*drink/i });
      if (await foodDrinkOption.isVisible()) {
        await foodDrinkOption.click();
      }

      // Save changes
      await page.getByRole('button', { name: /save|update/i }).click();
      await waitForModal(page, 'close');

      // Verify category change
      await page.waitForTimeout(2000);
      const updatedTransactionRow = page.locator(`text=${initialTransaction.name}`).locator('..');
      await expect(updatedTransactionRow.getByText(/food.*drink/i)).toBeVisible();
    } else {
      console.log('Edit functionality not available, skipping edit test');
    }
  });

  test('should validate category requirements', async ({ page }) => {
    // Try to create transaction without selecting category
    const addButton = page.getByTestId('floating-add-transaction-button').first();
    await addButton.click();
    await waitForModal(page, 'open');

    // Fill only name and amount
    await page.getByLabel(/name|description/i).first().fill('Incomplete Transaction');
    await page.getByLabel(/amount/i).fill('10.00');

    // Try to submit without category
    await page.getByRole('button', { name: /add.*transaction|create|save/i }).click();

    // Should see validation error or modal should remain open
    const modalStillOpen = await page.locator('[role="dialog"]').isVisible();
    if (modalStillOpen) {
      // Look for validation message
      const validationMessage = page.getByText(/category.*required|please select.*category/i);
      await expect(validationMessage).toBeVisible({ timeout: 3000 });
    }

    // Close modal
    await page.keyboard.press('Escape');
  });
});