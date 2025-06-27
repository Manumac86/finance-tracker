import { Page } from '@playwright/test';
import { testUsers } from '../fixtures/test-data';

/**
 * Authenticates with Clerk using the test user credentials
 * This handles the email + verification code flow
 */
export async function authenticateTestUser(page: Page) {
  // Go to sign in page
  await page.goto('/signin');
  
  // Check if already authenticated
  if (page.url().includes('/dashboard')) {
    return; // Already logged in
  }
  
  // Wait for sign in form
  await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });
  
  // Enter test user email
  await page.fill('input[name="identifier"]', testUsers.clerkTestUser.email);
  await page.getByRole('button', { name: /continue/i }).click();
  
  // Wait for verification code input
  // Clerk might show different inputs based on configuration
  await page.waitForTimeout(2000);
  
  // Look for verification code input
  const codeInputs = await page.locator('input[type="text"], input[type="number"]').all();
  
  if (codeInputs.length > 0) {
    // If there are multiple inputs (like 6 separate digits), fill each
    if (codeInputs.length === 6) {
      const code = testUsers.clerkTestUser.verificationCode;
      for (let i = 0; i < codeInputs.length; i++) {
        await codeInputs[i].fill(code[i]);
      }
    } else {
      // Single input field
      await codeInputs[0].fill(testUsers.clerkTestUser.verificationCode);
    }
    
    // Submit if there's a button, otherwise it might auto-submit
    const submitButton = page.getByRole('button', { name: /continue|verify|submit/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
    }
  }
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

/**
 * Helper to setup authenticated state before tests
 */
export async function setupAuthenticatedTest(page: Page) {
  await authenticateTestUser(page);
  // Additional setup if needed
}