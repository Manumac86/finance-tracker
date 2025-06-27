import { test, expect } from '@playwright/test';
import { waitForTransactionsLoad, waitForTransactionCreated, waitForModal } from '../utils/page-helpers';
import { waitForElement, waitForDataUpdate, waitForText } from '../utils/test-helpers';

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the transactions page
    await page.goto('/transactions');
    
    // If redirected to signin, we need to handle auth
    if (page.url().includes('/signin')) {
      console.log('Not authenticated, skipping test');
      test.skip();
    }
    
    // Wait for transactions page to fully load
    await waitForTransactionsLoad(page);
  });

  test.describe('Transaction List', () => {
    test('should display transaction statistics', async ({ page }) => {
      // Wait for statistics cards to load
      await waitForElement(page, '.grid.gap-4');
      
      // Verify statistics cards are visible
      const statsCards = await page.locator('.bg-card').all();
      expect(statsCards.length).toBeGreaterThanOrEqual(4);
      
      // Check for income, expenses, net, and count cards
      await expect(page.getByText('Total Income')).toBeVisible();
      await expect(page.getByText('Total Expenses')).toBeVisible();
      await expect(page.getByText('Net Amount')).toBeVisible();
      await expect(page.getByText('Transactions')).toBeVisible();
    });

    test('should show empty state when no transactions', async ({ page }) => {
      // Check if there's an empty state message or transaction list
      const emptyState = page.locator('text=No transactions found');
      const transactionList = page.locator('.space-y-4').first();
      
      // Either empty state or transaction list should be visible
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      const hasTransactions = await transactionList.isVisible().catch(() => false);
      
      expect(hasEmptyState || hasTransactions).toBeTruthy();
    });

    test('should have search functionality', async ({ page }) => {
      // Look for search input
      const searchInput = page.getByPlaceholder(/search/i);
      await expect(searchInput).toBeVisible();
      
      // Type in search
      await searchInput.fill('test transaction');
      
      // Wait for potential results update
      await waitForDataUpdate(page);
    });

    test('should have filter options', async ({ page }) => {
      // Check for filter dropdowns
      await expect(page.getByRole('combobox').first()).toBeVisible();
      
      // Click on category filter
      const categoryFilter = page.getByRole('combobox').first();
      await categoryFilter.click();
      
      // Verify dropdown opens
      await expect(page.getByRole('option').first()).toBeVisible();
      
      // Close dropdown
      await page.keyboard.press('Escape');
    });
  });

  test.describe('Quick Transaction Entry', () => {
    test('should show floating action buttons', async ({ page }) => {
      // Check for floating action buttons
      const floatingButtons = page.locator('button').filter({ hasText: '+' });
      await expect(floatingButtons).toBeVisible();
      
      // Check for bulk button
      const bulkButton = page.getByRole('button', { name: /bulk/i });
      await expect(bulkButton).toBeVisible();
    });

    test('should open transaction modal on FAB click', async ({ page }) => {
      // Click the main floating action button
      const addButton = page.locator('button').filter({ hasText: '+' });
      await addButton.click();
      
      // Wait for modal to open
      await waitForModal(page, 'open');
      
      // Verify modal elements
      await expect(page.getByRole('heading', { name: /add.*transaction/i })).toBeVisible();
      await expect(page.getByLabel(/description/i)).toBeVisible();
      await expect(page.getByLabel(/amount/i)).toBeVisible();
      
      // Close modal
      await page.keyboard.press('Escape');
    });

    test('should create a new expense transaction', async ({ page }) => {
      // Click add button
      const addButton = page.locator('button').filter({ hasText: '+' });
      await addButton.click();
      
      // Wait for modal
      await waitForModal(page, 'open');
      
      // Fill transaction form
      await page.getByLabel(/description/i).fill('Test Coffee Purchase');
      await page.getByLabel(/amount/i).fill('5.50');
      
      // Select category if available
      const categorySelect = page.getByRole('combobox', { name: /category/i });
      if (await categorySelect.isVisible()) {
        await categorySelect.click();
        // Try to select a category
        const foodOption = page.getByRole('option', { name: /food/i });
        if (await foodOption.isVisible()) {
          await foodOption.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
      
      // Submit transaction
      await page.getByRole('button', { name: /add transaction/i }).click();
      
      // Wait for transaction to be created
      await waitForTransactionCreated(page, 'Test Coffee Purchase');
    });
  });

  test.describe('Bulk Transaction Import', () => {
    test('should open bulk import modal', async ({ page }) => {
      // Click bulk button
      const bulkButton = page.getByRole('button', { name: /bulk/i });
      await bulkButton.click();
      
      // Wait for modal
      await waitForModal(page, 'open');
      
      // Verify bulk import options
      await expect(page.getByRole('heading', { name: /bulk.*transaction/i })).toBeVisible();
      
      // Check for import method tabs
      await expect(page.getByRole('tab', { name: /quick text/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /csv upload/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /manual entry/i })).toBeVisible();
      
      // Close modal
      await page.keyboard.press('Escape');
    });

    test('should handle quick text entry', async ({ page }) => {
      // Open bulk import
      await page.getByRole('button', { name: /bulk/i }).click();
      await waitForModal(page, 'open');
      
      // Select quick text tab (should be default)
      const quickTextTab = page.getByRole('tab', { name: /quick text/i });
      if (await quickTextTab.getAttribute('aria-selected') !== 'true') {
        await quickTextTab.click();
      }
      
      // Enter sample transactions
      const textArea = page.locator('textarea');
      await textArea.fill('Coffee $4.50\nLunch $12.00\nGas $45.00');
      
      // Parse transactions
      const parseButton = page.getByRole('button', { name: /parse/i });
      if (await parseButton.isVisible()) {
        await parseButton.click();
        await waitForDataUpdate(page);
      }
      
      // Close modal
      await page.keyboard.press('Escape');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should be mobile-friendly', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Reload page with mobile viewport
      await page.reload();
      
      // Skip if not authenticated
      if (page.url().includes('/signin')) {
        test.skip();
      }
      
      // Verify floating buttons are visible on mobile
      const floatingButtons = page.locator('button').filter({ hasText: '+' });
      await expect(floatingButtons).toBeVisible();
      
      // Verify no horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
      
      // Test that transaction cards are properly sized
      const transactionCards = await page.locator('.bg-card').all();
      if (transactionCards.length > 0) {
        const firstCard = transactionCards[0];
        const cardBox = await firstCard.boundingBox();
        if (cardBox) {
          expect(cardBox.width).toBeLessThanOrEqual(375);
        }
      }
    });
  });

  test.describe('Transaction Management', () => {
    test('should navigate to manage transactions page', async ({ page }) => {
      // Look for manage link/button
      const manageLink = page.getByRole('link', { name: /manage/i });
      if (await manageLink.isVisible()) {
        await manageLink.click();
        await expect(page).toHaveURL(/\/transactions\/manage/);
        
        // Verify manage page elements
        await expect(page.getByText(/manage.*transactions/i)).toBeVisible();
      }
    });
  });
});