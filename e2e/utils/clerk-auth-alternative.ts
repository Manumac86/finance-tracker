import { Page } from '@playwright/test';

/**
 * Alternative Clerk authentication that simulates a real user login
 * This bypasses the need for testing tokens which may require Pro plan
 */
export async function authenticateWithClerk(page: Page, options?: {
  email?: string;
  waitForDashboard?: boolean;
}) {
  const { 
    email = 'test@example.com',
    waitForDashboard = true 
  } = options || {};

  try {
    // Check if already authenticated by looking for dashboard elements
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      // Already on dashboard, check if truly authenticated
      try {
        await page.waitForSelector('[data-testid="dashboard-header"]', { timeout: 2000 });
        console.log('✅ Already authenticated');
        return;
      } catch {
        // Not actually authenticated, continue with login
      }
    }

    // Navigate to sign in page
    await page.goto('/signin');
    
    // Wait for Clerk to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give Clerk time to initialize

    // Check if we're redirected to dashboard (might have session)
    if (page.url().includes('/dashboard')) {
      console.log('✅ Session still active, already authenticated');
      return;
    }

    // For testing purposes, we'll use a mock authentication approach
    // This simulates being logged in without actually going through Clerk
    
    // Option 1: Set authentication cookies/storage if you have test tokens
    // await page.context().addCookies([...]); 
    
    // Option 2: Use page route to mock authentication responses
    await page.route('**/v1/client**', async route => {
      // Mock Clerk API responses
      const url = route.request().url();
      
      if (url.includes('/sessions')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test_session_id',
            status: 'active',
            user: {
              id: 'test_user_id',
              email: email,
              first_name: 'Test',
              last_name: 'User'
            }
          })
        });
      } else {
        await route.continue();
      }
    });

    // Option 3: Direct navigation with mocked auth state
    // This is the most reliable approach for E2E tests
    await page.evaluate(() => {
      // Set a flag that our app can check to bypass auth in test mode
      window.localStorage.setItem('e2e_test_mode', 'true');
      window.localStorage.setItem('e2e_test_user', JSON.stringify({
        id: 'test_user_id',
        email: 'test@example.com',
        name: 'Test User'
      }));
    });

    // Navigate directly to dashboard
    await page.goto('/dashboard');

    if (waitForDashboard) {
      // Wait for dashboard to load
      await page.waitForSelector('[data-testid="dashboard-header"]', { 
        timeout: 10000,
        state: 'visible' 
      });
      console.log('✅ Successfully authenticated and reached dashboard');
    }

  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  }
}

/**
 * Helper to check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check URL
    if (!page.url().includes('/dashboard')) {
      return false;
    }

    // Check for dashboard elements
    await page.waitForSelector('[data-testid="dashboard-header"]', { 
      timeout: 2000,
      state: 'visible'
    });
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper to logout
 */
export async function logout(page: Page) {
  try {
    // Clear test mode flags
    await page.evaluate(() => {
      window.localStorage.removeItem('e2e_test_mode');
      window.localStorage.removeItem('e2e_test_user');
    });

    // Navigate to home
    await page.goto('/');
    
    console.log('✅ Logged out successfully');
  } catch (error) {
    console.error('❌ Logout failed:', error);
  }
}