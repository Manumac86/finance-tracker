import { Page } from '@playwright/test';
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