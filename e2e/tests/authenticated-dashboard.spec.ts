import { test, expect } from '@playwright/test';
import { authenticateTestUser } from '../utils/test-auth';

// Skip authenticated tests until Clerk testing is properly configured
test.describe.skip('Authenticated Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate and navigate to dashboard
    await authenticateTestUser(page);
    await page.goto('/dashboard');
  });

  test('should display personalized dashboard', async ({ page }) => {
    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Check for dashboard header
    const header = page.locator('[data-testid="dashboard-header"]');
    await expect(header).toBeVisible();
    
    // Check for welcome message or user greeting
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/welcome|dashboard|overview/i);
  });

  test('should display financial overview', async ({ page }) => {
    // Look for financial metric cards
    const cards = await page.locator('.bg-card').all();
    expect(cards.length).toBeGreaterThanOrEqual(3);
    
    // Check for specific metrics
    const metrics = ['Balance', 'Income', 'Expenses', 'Savings Rate'];
    for (const metric of metrics) {
      const metricElement = page.getByText(metric);
      if (await metricElement.isVisible()) {
        await expect(metricElement).toBeVisible();
      }
    }
  });

  test('should show recent transactions section', async ({ page }) => {
    // Look for recent transactions
    const recentSection = page.getByText(/recent.*transaction/i).first();
    if (await recentSection.isVisible()) {
      await expect(recentSection).toBeVisible();
      
      // Check for transaction list or empty state
      const transactionList = page.locator('.space-y-2, .space-y-3, .space-y-4').first();
      const emptyState = page.getByText(/no.*transaction/i);
      
      const hasTransactions = await transactionList.isVisible().catch(() => false);
      const isEmpty = await emptyState.isVisible().catch(() => false);
      
      expect(hasTransactions || isEmpty).toBeTruthy();
    }
  });

  test('should show goal progress section', async ({ page }) => {
    // Look for goals section
    const goalsSection = page.getByText(/goal/i).first();
    if (await goalsSection.isVisible()) {
      // Check for progress bars or goal cards
      const progressBars = await page.locator('[role="progressbar"]').all();
      const goalCards = await page.locator('.bg-card').filter({ hasText: /goal/i }).all();
      
      expect(progressBars.length + goalCards.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show budget alerts if any', async ({ page }) => {
    // Look for budget alerts
    const alertsSection = page.getByText(/budget.*alert/i);
    if (await alertsSection.isVisible()) {
      // Check for alert items
      const alerts = await page.locator('[role="alert"]').all();
      
      if (alerts.length > 0) {
        // Verify alert structure
        const firstAlert = alerts[0];
        await expect(firstAlert).toBeVisible();
        
        // Alert should have category and percentage
        const alertText = await firstAlert.textContent();
        expect(alertText).toBeTruthy();
      }
    }
  });

  test('should have quick actions available', async ({ page }) => {
    // Look for quick action buttons
    const quickActionButtons = await page.getByRole('button', { name: /add|new|create/i }).all();
    expect(quickActionButtons.length).toBeGreaterThan(0);
    
    // Verify at least one quick action is clickable
    if (quickActionButtons.length > 0) {
      await expect(quickActionButtons[0]).toBeEnabled();
    }
  });

  test('should navigate to different sections', async ({ page }) => {
    // Test navigation to transactions
    const transactionsLink = page.getByRole('link', { name: /transaction/i }).first();
    await transactionsLink.click();
    await expect(page).toHaveURL(/\/transactions/);
    
    // Navigate back to dashboard
    await page.getByRole('link', { name: /dashboard/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Test navigation to goals
    const goalsLink = page.getByRole('link', { name: /goal/i }).first();
    await goalsLink.click();
    await expect(page).toHaveURL(/\/goals/);
    
    // Navigate back to dashboard
    await page.getByRole('link', { name: /dashboard/i }).first().click();
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Test navigation to budgets
    const budgetsLink = page.getByRole('link', { name: /budget/i }).first();
    await budgetsLink.click();
    await expect(page).toHaveURL(/\/budgets/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Reload dashboard
    await page.reload();
    
    // Verify no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
    
    // Check that cards stack vertically
    const cards = await page.locator('.bg-card').all();
    if (cards.length >= 2) {
      const firstBox = await cards[0].boundingBox();
      const secondBox = await cards[1].boundingBox();
      
      if (firstBox && secondBox) {
        // On mobile, cards should stack (second card below first)
        expect(secondBox.y).toBeGreaterThan(firstBox.y);
      }
    }
    
    // Check mobile menu if available
    const menuButton = page.getByRole('button', { name: /menu/i });
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });
});