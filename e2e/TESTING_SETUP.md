# E2E Testing Setup Options

## Option 1: Dynamic Token Creation (Recommended)

If your Clerk plan supports testing tokens, the tests will automatically create tokens.

**Requirements:**
- Clerk Pro plan or higher
- Valid `CLERK_SECRET_KEY` in `.env.local`

**If this fails**, see Option 2 below.

## Option 2: Manual Testing Token

If dynamic token creation is not available:

1. **Get a Testing Token from Clerk Dashboard**:
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Navigate to **Configure** → **API Keys**
   - Look for **Testing tokens** section
   - Click **Create testing token**
   - Copy the token

2. **Add to Environment**:
   Add to your `.env.local`:
   ```
   CLERK_TESTING_TOKEN=your_testing_token_here
   ```

3. **Update Global Setup**:
   Comment out the dynamic token creation in `e2e/global-setup.ts`:
   ```typescript
   // const testingToken = await createClerkTestingToken();
   // process.env.CLERK_TESTING_TOKEN = testingToken;
   ```

## Option 3: Skip Authentication Tests

For testing without authentication:

1. Use the auth tests only: `pnpm test:e2e e2e/tests/auth.spec.ts`
2. Skip authenticated tests until Clerk is configured

## Troubleshooting

### "Testing tokens not available"
- Testing tokens require Clerk Pro plan or higher
- Use Option 2 (manual token) instead

### "Invalid secret key"
- Verify `CLERK_SECRET_KEY` in `.env.local` is correct
- Should start with `sk_test_` or `sk_live_`

### "Cannot read properties of undefined"
- The Clerk backend API might have changed
- Check [@clerk/backend docs](https://clerk.com/docs/references/backend/overview) for updates