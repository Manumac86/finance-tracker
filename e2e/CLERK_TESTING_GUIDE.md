# Clerk E2E Testing Guide

## Current Status

The E2E testing infrastructure is set up but Clerk authentication tests are currently disabled due to configuration requirements.

## What's Working

✅ **Non-authenticated tests** - All tests that don't require login are passing:
- Authentication page UI tests
- Basic navigation tests
- Public page tests

✅ **Test Infrastructure** - Complete setup ready for authenticated tests:
- Playwright configured
- Clerk testing packages installed
- Test fixtures and helpers created
- GitHub Actions workflow ready

## What's Needed for Authenticated Tests

To enable authenticated tests, you need:

### 1. Clerk Frontend API URL

The error "The Clerk Frontend API URL is required" indicates we need to set the correct Clerk domain.

**To find your Frontend API URL:**
1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Look for your Frontend API URL (format: `https://your-app.clerk.accounts.dev`)
3. Add to `.env.local`:
   ```
   CLERK_FRONTEND_API=https://your-app.clerk.accounts.dev
   ```

### 2. Enable Testing Tokens (Pro Feature)

Testing tokens might require a Clerk Pro plan. Check if available:
1. Go to Clerk Dashboard → API Keys
2. Look for "Testing tokens" section
3. If not available, consider using alternative testing strategies

### 3. Alternative Testing Approaches

If testing tokens are not available:

**Option A: Use Test Mode**
- Create a separate Clerk application for testing
- Use test mode credentials
- Mock authentication in tests

**Option B: Use Real Test Account**
- Create a dedicated test user
- Use page objects to handle real login flow
- Store test credentials securely

## Running Tests

### Run Working Tests Only
```bash
# Run all non-authenticated tests
pnpm test:e2e

# Run specific test suite
pnpm test:e2e e2e/tests/auth.spec.ts
```

### Enable Authenticated Tests
1. Configure Clerk environment (see above)
2. Move tests from `e2e/tests/skip/` back to `e2e/tests/`
3. Run full test suite

## Test Organization

```
e2e/
├── tests/              # Active tests
│   ├── auth.spec.ts    # ✅ Working - UI tests
│   └── simple-auth.spec.ts  # ✅ Working - Navigation
├── tests/skip/         # Tests requiring auth (temporarily disabled)
│   ├── authenticated-*.spec.ts
│   └── clerk-auth-example.spec.ts
├── fixtures/           # Test helpers
└── utils/              # Utilities
```

## Next Steps

1. **Get Clerk Frontend API URL** from your dashboard
2. **Add to environment** variables
3. **Test authentication** with a simple test first
4. **Enable all tests** once authentication works

## Resources

- [Clerk Testing Docs](https://clerk.com/docs/testing/overview)
- [Playwright Docs](https://playwright.dev/docs/test-fixtures)
- [E2E Best Practices](https://playwright.dev/docs/best-practices)