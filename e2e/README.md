# E2E Testing Guide

## Overview

This directory contains end-to-end tests for the Finance Tracker application using Playwright.

## Test Structure

```
e2e/
├── tests/              # Test files
├── fixtures/           # Test data and constants
├── utils/              # Helper functions
└── README.md          # This file
```

## Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run tests in UI mode
pnpm test:e2e:ui

# Run tests in debug mode
pnpm test:e2e:debug

# Run specific test file
pnpm test:e2e e2e/tests/auth.spec.ts

# Run tests on specific browser
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit
```

## Test Status

### ✅ Working Tests
- **Authentication Pages** (`auth.spec.ts`) - Sign in/up page functionality
- **Simple Navigation** (`simple-auth.spec.ts`) - Basic page navigation
- **Transaction Pages** (`transactions.spec.ts`) - Unauthenticated view
- **Dashboard Pages** (`dashboard.spec.ts`) - Unauthenticated view

### ⏸️ Skipped Tests
Tests requiring authentication are currently in `tests/skip/` directory:
- `authenticated-*.spec.ts` - Tests requiring logged-in user
- `clerk-auth-example.spec.ts` - Clerk authentication examples

## Running Tests

```bash
# Run all active tests
pnpm test:e2e

# Run specific test file
pnpm test:e2e e2e/tests/auth.spec.ts

# Run with UI mode for debugging
pnpm test:e2e:ui
```

## Clerk Authentication (Work in Progress)

The project is set up for Clerk testing, but authentication tests are currently disabled.

To enable authenticated tests:
1. Ensure Clerk is properly configured in your environment
2. Move tests from `tests/skip/` back to `tests/`
3. Configure Clerk testing tokens (see `TESTING_SETUP.md`)

## Test Suites

### 1. Authentication Tests (`auth.spec.ts`)
- Sign up page functionality
- Sign in page functionality
- Navigation between auth pages
- Mobile responsiveness
- Email validation

### 2. Dashboard Tests (`dashboard.spec.ts`)
- Dashboard overview display
- Financial metrics cards
- Recent transactions
- Goal progress
- Budget alerts
- Navigation menu
- Mobile responsiveness

### 3. Transaction Tests (`transactions.spec.ts`)
- Transaction list and statistics
- Search and filtering
- Quick transaction entry
- Bulk import functionality
- Transaction management
- Mobile responsiveness

### 4. Authenticated Flow Tests
Additional test files prefixed with `authenticated-` test features that require user login:
- `authenticated-flow.spec.ts` - Complete user flows
- `authenticated-dashboard.spec.ts` - Dashboard with real data
- `authenticated-transactions.spec.ts` - Transaction operations

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/page-url');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Handling Authentication

For tests that require authentication:

```typescript
import { authenticateTestUser } from '../utils/test-auth';

test.beforeEach(async ({ page }) => {
  await authenticateTestUser(page);
});
```

### Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Handle loading states** with appropriate waits
3. **Test mobile viewports** for responsive design
4. **Skip tests gracefully** when preconditions aren't met
5. **Use descriptive test names** that explain what is being tested
6. **Avoid hard-coded waits** - use Playwright's built-in waiting mechanisms

## CI/CD Integration

Tests run automatically on:
- Push to main or develop branches
- Pull requests

The GitHub Actions workflow runs tests on multiple browsers and uploads test artifacts on failure.

## Debugging Failed Tests

1. **Run in UI mode**: `pnpm test:e2e:ui`
2. **Check screenshots**: Located in `test-results/` directory
3. **View traces**: Available in the Playwright report
4. **Run specific test**: Isolate the failing test

## Environment Variables

Ensure these are set in your `.env.local` file:
- Clerk authentication keys
- Database connection strings
- Redis URL

See `.env.example` for the complete list.

## Future Improvements

- [ ] Add visual regression testing
- [ ] Implement API mocking for faster tests
- [ ] Add performance testing
- [ ] Create more comprehensive user journey tests
- [ ] Add accessibility testing