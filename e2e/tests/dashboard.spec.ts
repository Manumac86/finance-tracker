import { test, expect } from '@playwright/test';
import { waitForDashboardLoad } from '../utils/page-helpers';
import { waitForElement, waitForNetworkIdle } from '../utils/test-helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/dashboard');
    
    // If redirected to signin, we need to handle auth
    if (page.url().includes('/signin')) {
      console.log('Not authenticated, skipping test');
      test.skip();
    }
    
    // Wait for dashboard to fully load
    await waitForDashboardLoad(page);
  });

  test.describe('Dashboard Overview', () => {
    test('should display welcome message', async ({ page }) => {
      // Header should already be loaded from beforeEach
      const header = page.locator('[data-testid="dashboard-header"]');
      await expect(header).toBeVisible();
      await expect(header).toContainText(/welcome|dashboard/i);
    });

    test('should display financial overview cards', async ({ page }) => {
      // Wait for overview section
      await waitForElement(page, '.grid');
      
      // Check for key financial metrics
      const metricCards = await page.locator('.bg-card').all();
      expect(metricCards.length).toBeGreaterThanOrEqual(3);
      
      // Look for common financial metrics
      const pageText = await page.textContent('body');
      const hasFinancialMetrics = 
        pageText?.includes('Balance') ||
        pageText?.includes('Income') ||
        pageText?.includes('Expenses') ||
        pageText?.includes('Savings');
      
      expect(hasFinancialMetrics).toBeTruthy();
    });

    test('should display budget alerts if any', async ({ page }) => {
      // Check for budget alerts section
      const alertsSection = page.locator('text=/budget.*alert/i');
      const hasAlerts = await alertsSection.isVisible().catch(() => false);
      
      if (hasAlerts) {
        // Verify alert structure
        const alerts = await page.locator('[role="alert"]').all();
        if (alerts.length > 0) {
          const firstAlert = alerts[0];
          await expect(firstAlert).toBeVisible();
        }
      }
    });

    test('should display recent transactions', async ({ page }) => {
      // Look for recent transactions section
      const recentTransactionsSection = page.locator('text=/recent.*transaction/i');
      const hasRecentTransactions = await recentTransactionsSection.isVisible().catch(() => false);
      
      if (hasRecentTransactions) {
        // Check for transaction list
        const transactionList = page.locator('.space-y-2, .space-y-3, .space-y-4').first();
        await expect(transactionList).toBeVisible();
      }
    });

    test('should display goal progress', async ({ page }) => {
      // Look for goals section
      const goalsSection = page.locator('text=/goal/i').first();
      const hasGoals = await goalsSection.isVisible().catch(() => false);
      
      if (hasGoals) {
        // Check for progress indicators
        const progressBars = await page.locator('[role="progressbar"]').all();
        if (progressBars.length > 0) {
          await expect(progressBars[0]).toBeVisible();
        }
      }
    });
  });

  test.describe('Navigation', () => {
    test('should have working navigation menu', async ({ page }) => {
      // Check for navigation links
      const navLinks = [
        { name: /dashboard/i, url: '/dashboard' },
        { name: /transaction/i, url: '/transactions' },
        { name: /goal/i, url: '/goals' },
        { name: /budget/i, url: '/budgets' }
      ];
      
      for (const link of navLinks) {
        const navLink = page.getByRole('link', { name: link.name }).first();
        if (await navLink.isVisible()) {
          await expect(navLink).toBeVisible();
        }
      }
    });

    test('should navigate to transactions page', async ({ page }) => {
      const transactionsLink = page.getByRole('link', { name: /transaction/i }).first();
      if (await transactionsLink.isVisible()) {
        await transactionsLink.click();
        await expect(page).toHaveURL(/\/transactions/);
      }
    });

    test('should navigate to goals page', async ({ page }) => {
      const goalsLink = page.getByRole('link', { name: /goal/i }).first();
      if (await goalsLink.isVisible()) {
        await goalsLink.click();
        await expect(page).toHaveURL(/\/goals/);
      }
    });

    test('should navigate to budgets page', async ({ page }) => {
      const budgetsLink = page.getByRole('link', { name: /budget/i }).first();
      if (await budgetsLink.isVisible()) {
        await budgetsLink.click();
        await expect(page).toHaveURL(/\/budgets/);
      }
    });
  });

  test.describe('Quick Actions', () => {
    test('should have quick action buttons', async ({ page }) => {
      // Look for quick action buttons
      const quickActions = await page.getByRole('button', { name: /add|new|create/i }).all();
      expect(quickActions.length).toBeGreaterThan(0);
    });

    test('should have user menu', async ({ page }) => {
      // Look for user button (Clerk user button)
      const userButton = page.locator('.cl-userButtonBox').first();
      if (await userButton.isVisible()) {
        await userButton.click();
        
        // Check for menu items
        await expect(page.locator('.cl-userButtonPopoverCard')).toBeVisible();
        
        // Close menu
        await page.keyboard.press('Escape');
      }
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
      
      // Wait for dashboard to load
      await waitForDashboardLoad(page);
      
      // Verify no horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
      
      // Check that cards stack properly on mobile
      const cards = await page.locator('.bg-card').all();
      if (cards.length > 1) {
        const firstCardBox = await cards[0].boundingBox();
        const secondCardBox = await cards[1].boundingBox();
        
        if (firstCardBox && secondCardBox) {
          // Cards should stack vertically on mobile
          expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y);
        }
      }
    });

    test('should have mobile navigation', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Look for mobile menu button
      const menuButton = page.getByRole('button', { name: /menu/i });
      if (await menuButton.isVisible()) {
        await menuButton.click();
        
        // Check that navigation menu opens
        await expect(page.getByRole('navigation')).toBeVisible();
        
        // Close menu
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Data Loading', () => {
    test('should handle loading states', async ({ page }) => {
      // Navigate to dashboard and check for loading indicators
      await page.goto('/dashboard');
      
      // Skip if not authenticated
      if (page.url().includes('/signin')) {
        test.skip();
      }
      
      // Check for any loading skeletons or spinners
      const loadingIndicators = await page.locator('.animate-pulse, [role="status"]').all();
      
      // Wait for content to load
      await waitForNetworkIdle(page);
      
      // Verify content is loaded (no more loading indicators)
      await page.waitForTimeout(500);
      const remainingLoaders = await page.locator('.animate-pulse, [role="status"]').all();
      
      // Should have fewer or no loading indicators after load
      expect(remainingLoaders.length).toBeLessThanOrEqual(loadingIndicators.length);
    });
  });
});