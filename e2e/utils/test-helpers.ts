import { Page } from '@playwright/test';

/**
 * Clear browser storage (localStorage, sessionStorage, cookies)
 */
export async function clearBrowserStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Clear cookies
  const context = page.context();
  await context.clearCookies();
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch {
    // Network might not become completely idle, continue anyway
  }
}

/**
 * Wait for data to update after a mutation (SWR revalidation)
 */
export async function waitForDataUpdate(page: Page, timeout = 5000) {
  // Small delay for mutation to complete
  await page.waitForTimeout(500);
  // Wait for network to settle
  await waitForNetworkIdle(page, timeout);
}

/**
 * Wait for an element with better defaults
 */
export async function waitForElement(
  page: Page, 
  selector: string, 
  options?: { 
    timeout?: number; 
    state?: 'visible' | 'hidden' | 'attached' | 'detached' 
  }
) {
  const defaultOptions = { timeout: 10000, state: 'visible' as const };
  return page.waitForSelector(selector, { ...defaultOptions, ...options });
}

/**
 * Wait for text to appear on the page
 */
export async function waitForText(
  page: Page,
  text: string | RegExp,
  options?: { timeout?: number }
) {
  return page.waitForFunction(
    (searchText) => {
      const body = document.body.innerText || document.body.textContent || '';
      if (typeof searchText === 'string') {
        return body.includes(searchText);
      } else {
        // Handle RegExp by converting to string and back
        const pattern = searchText.toString();
        const flags = pattern.substring(pattern.lastIndexOf('/') + 1);
        const source = pattern.substring(1, pattern.lastIndexOf('/'));
        return new RegExp(source, flags).test(body);
      }
    },
    text,
    { timeout: options?.timeout || 10000 }
  );
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
 * Take a screenshot with a descriptive name
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `test-results/debug-${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Check if an element exists without throwing
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Retry an action multiple times
 */
export async function retryAction<T>(
  action: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}