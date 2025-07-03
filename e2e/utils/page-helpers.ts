import { Page, expect } from '@playwright/test';
import { waitForElement, waitForNetworkIdle, waitForDataUpdate } from './test-helpers';

/**
 * Wait for dashboard page to fully load
 */
export async function waitForDashboardLoad(page: Page) {
  // Wait for navigation
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  
  // Wait for dashboard header
  await waitForElement(page, '[data-testid="dashboard-header"]');
  
  // Wait for network to settle
  await waitForNetworkIdle(page);
}

/**
 * Wait for transactions page to load
 */
export async function waitForTransactionsLoad(page: Page) {
  // Wait for navigation
  await page.waitForURL('**/transactions', { timeout: 30000 });
  
  // Wait for stats cards or empty state
  await Promise.race([
    waitForElement(page, '.grid.gap-4'), // Stats grid
    waitForElement(page, 'text=No transactions found'), // Empty state
  ]);
  
  // Wait for network to settle
  await waitForNetworkIdle(page);
}

/**
 * Wait for a transaction to be created and appear in the list
 */
export async function waitForTransactionCreated(page: Page, description: string) {
  // Wait for modal to close
  await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 10000 });
  
  // Wait for data update
  await waitForDataUpdate(page);
  
  // Wait for transaction to appear with retry
  let found = false;
  for (let i = 0; i < 3; i++) {
    try {
      await page.getByText(description).waitFor({ timeout: 5000 });
      found = true;
      break;
    } catch {
      // Retry after a short delay
      await page.waitForTimeout(1000);
    }
  }
  
  if (!found) {
    throw new Error(`Transaction "${description}" did not appear within timeout`);
  }
}

/**
 * Wait for goals page to load
 */
export async function waitForGoalsLoad(page: Page) {
  // Wait for navigation
  await page.waitForURL('**/goals', { timeout: 30000 });
  
  // Wait for content
  await Promise.race([
    waitForElement(page, '[data-testid="goals-list"]'),
    waitForElement(page, 'text=No goals yet'),
  ]);
  
  // Wait for network to settle
  await waitForNetworkIdle(page);
}

/**
 * Wait for budgets page to load
 */
export async function waitForBudgetsLoad(page: Page) {
  // Wait for navigation
  await page.waitForURL('**/budgets', { timeout: 30000 });
  
  // Wait for content
  await Promise.race([
    waitForElement(page, '[data-testid="budgets-list"]'),
    waitForElement(page, 'text=No budgets set'),
  ]);
  
  // Wait for network to settle
  await waitForNetworkIdle(page);
}

/**
 * Wait for authentication pages to load
 */
export async function waitForAuthPageLoad(page: Page, type: 'signin' | 'signup') {
  // Wait for navigation
  await page.waitForURL(`**/${type}`, { timeout: 30000 });
  
  // Wait for auth container
  await waitForElement(page, '[data-testid="auth-container"]');
  
  // Wait for Clerk form to load
  await waitForElement(page, type === 'signin' ? 'input[name="identifier"]' : 'input[name="emailAddress"]');
}

/**
 * Wait for a modal to open or close
 */
export async function waitForModal(page: Page, action: 'open' | 'close') {
  const state = action === 'open' ? 'visible' : 'hidden';
  await page.waitForSelector('[role="dialog"]', { 
    state, 
    timeout: 10000 
  });
}

/**
 * Select a category in a transaction form
 */
export async function selectCategory(page: Page, categoryName: string) {
  try {
    // Find and click category selector
    const categorySelect = page.getByRole('combobox', { name: /category/i });
    if (!(await categorySelect.isVisible())) {
      console.warn('Category selector not found');
      return false;
    }
    
    await categorySelect.click();
    
    // Wait for dropdown to open
    await page.waitForTimeout(500);
    
    // Look for the category option
    const categoryOption = page.getByRole('option', { name: new RegExp(categoryName, 'i') });
    
    if (await categoryOption.isVisible({ timeout: 3000 })) {
      await categoryOption.click();
      return true;
    } else {
      // Close dropdown if category not found
      await page.keyboard.press('Escape');
      console.warn(`Category '${categoryName}' not found in dropdown`);
      return false;
    }
  } catch (error) {
    console.warn('Failed to select category:', error);
    return false;
  }
}

/**
 * Fill transaction form with data
 */
export async function fillTransactionForm(page: Page, transaction: {
  name: string;
  amount: number;
  description?: string;
  categoryName?: string;
}) {
  // Fill required fields
  await page.getByLabel(/name|description/i).first().fill(transaction.name);
  await page.getByLabel(/amount/i).fill(transaction.amount.toString());
  
  // Fill optional description
  if (transaction.description) {
    const descField = page.getByLabel(/description/i).last();
    if (await descField.isVisible()) {
      await descField.fill(transaction.description);
    }
  }
  
  // Select category if provided
  if (transaction.categoryName) {
    await selectCategory(page, transaction.categoryName);
  }
}

/**
 * Wait for transaction to appear in list with retry
 */
export async function waitForTransactionInList(page: Page, transactionName: string, amount?: number) {
  const maxRetries = 5;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Check for transaction name
      await expect(page.getByText(transactionName)).toBeVisible({ timeout: 3000 });
      
      // Check for amount if provided
      if (amount) {
        await expect(page.getByText(`$${amount.toFixed(2)}`)).toBeVisible({ timeout: 1000 });
      }
      
      return true;
    } catch {
      retries++;
      if (retries < maxRetries) {
        console.log(`Retry ${retries}/${maxRetries} - waiting for transaction to appear`);
        await page.waitForTimeout(2000);
        // Refresh the page data
        await page.reload();
        await waitForTransactionsLoad(page);
      }
    }
  }
  
  throw new Error(`Transaction '${transactionName}' did not appear after ${maxRetries} retries`);
}