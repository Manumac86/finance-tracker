# GitHub Actions Workflows

This directory contains the CI/CD workflows for the Finance Tracker application.

## Workflows

### 1. `ci.yml` - Comprehensive CI Pipeline

**Triggers:**
- Push to `main`, `develop`, `feature/*`, `bugfix/*`, `hotfix/*` branches
- Pull requests to `main` and `develop`
- Manual dispatch

**Jobs:**

#### Security Scan
- Runs `pnpm audit` to check for vulnerabilities
- Fails if high-severity vulnerabilities are found
- Continues on moderate-level issues with warnings

#### Lint and Type Check
- ESLint validation
- TypeScript type checking
- Code formatting check (if Prettier is configured)

#### Unit Tests
- Runs on Node.js 18.x and 20.x
- Generates coverage reports
- Uploads coverage to Codecov
- Creates test summary in GitHub Actions
- Enforces coverage thresholds:
  - Lines: 80%
  - Functions: 75%
  - Branches: 70%
  - Statements: 80%

#### Build Test
- Verifies production build succeeds
- Checks for required build artifacts
- Reports bundle sizes
- Archives build outputs

#### Coverage Report (PR only)
- Comments coverage results on pull requests
- Validates coverage thresholds
- Updates existing coverage comments

#### CI Summary
- Provides overall pipeline status
- Creates summary with job results
- Shows branch and commit information

### 2. `test-and-coverage.yml` - Simplified Test Runner

**Triggers:**
- Push to `main` and `develop`
- Pull requests to `main` and `develop`
- Manual dispatch

**Features:**
- Matrix testing on Node.js 18.x and 20.x
- Coverage reporting
- Codecov integration
- PR coverage comments

### 3. `e2e-tests.yml` - End-to-End Testing

**Triggers:**
- Push to `main` and `develop`
- Pull requests to `main` and `develop`

**Features:**
- Playwright testing on desktop and mobile browsers
- Authentication bypass for CI environment (`E2E_TEST_BYPASS=true`)
- Complete environment setup (Supabase, Redis, Clerk)
- Artifact uploads for test reports and screenshots

### 4. `deploy.yml` - Production & Staging Deployment

**Triggers:**
- Push to `main` (automatic production deployment)
- Manual dispatch (choose environment)

**Environments:**
- **Production**: Vercel deployment with production secrets
- **Staging**: Vercel deployment with staging secrets

**Features:**
- Pre-deployment validation (lint, type-check, build)
- Environment-specific configurations
- Post-deployment notifications
- Deployment status summaries

### 5. `lighthouse.yml` - Performance Auditing

**Triggers:**
- Push to `main`
- Pull requests to `main`
- Weekly schedule (Sundays at 02:00 UTC)

**Features:**
- Lighthouse CI performance audits
- Multiple page testing (home, dashboard, transactions, budgets, goals)
- Performance thresholds:
  - Performance: ≥70%
  - Accessibility: ≥90%
  - Best Practices: ≥85%
  - SEO: ≥80%
- PR comments with performance scores

## Setup Requirements

### 1. Required Secrets

For the complete CI/CD pipeline to work, configure these secrets in your repository:

**Authentication & Services:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY    # Clerk authentication
CLERK_SECRET_KEY                     # Clerk secret key
CLERK_TESTING_TOKEN                  # Clerk testing token for E2E

DATABASE_URL                         # PostgreSQL connection string
SUPABASE_URL                         # Supabase project URL
SUPABASE_ANON_KEY                    # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY           # Supabase service role key
NEXT_PUBLIC_SUPABASE_URL            # Public Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY       # Public Supabase key

REDIS_URL                           # Redis connection string
UPSTASH_REDIS_REST_URL             # Upstash Redis REST URL
UPSTASH_REDIS_REST_TOKEN           # Upstash Redis token
```

**Deployment (Vercel):**
```
VERCEL_TOKEN                        # Vercel deployment token
VERCEL_ORG_ID                      # Vercel organization ID
VERCEL_PROJECT_ID                  # Vercel project ID (production)
VERCEL_STAGING_PROJECT_ID          # Vercel project ID (staging)
```

**Staging Environment (Optional):**
```
STAGING_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
STAGING_CLERK_SECRET_KEY
STAGING_NEXT_PUBLIC_SUPABASE_URL
STAGING_NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Code Quality & Performance:**
```
CODECOV_TOKEN                       # Codecov integration
LHCI_GITHUB_APP_TOKEN              # Lighthouse CI GitHub app
```

### 2. Codecov Integration (Optional)

To enable Codecov coverage reporting:

1. Sign up at [codecov.io](https://codecov.io)
2. Connect your GitHub repository
3. Add `CODECOV_TOKEN` to your repository secrets:
   - Go to Settings → Secrets and variables → Actions
   - Add new repository secret: `CODECOV_TOKEN`
   - Use the token from your Codecov dashboard

### 2. Repository Settings

Recommended branch protection rules for `main`:

```yaml
Required status checks:
  - Security Scan
  - Lint and Type Check  
  - Unit Tests (Node 18.x)
  - Unit Tests (Node 20.x)
  - Build Test

Settings:
  - Require branches to be up to date before merging
  - Require review from code owners
  - Dismiss stale reviews when new commits are pushed
  - Require status checks to pass before merging
```

## Local Development

### Running Tests Locally

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in CI mode (for local CI simulation)
pnpm test:ci

# Open coverage report in browser
pnpm coverage:open
```

### Coverage Thresholds

The Jest configuration enforces these coverage thresholds:

- **Lines:** 80%
- **Functions:** 75% 
- **Branches:** 70%
- **Statements:** 80%

Tests will fail locally and in CI if these thresholds aren't met.

### Excluded from Coverage

The following files/directories are excluded from coverage:

- Layout, loading, error, and not-found pages
- Configuration files
- Type definition files
- Coverage directory
- Build outputs (`.next/`)

## Troubleshooting

### Common Issues

1. **Coverage threshold failures:**
   - Add more tests to increase coverage
   - Or adjust thresholds in `jest.config.js`

2. **Build failures:**
   - Check for TypeScript errors: `npx tsc --noEmit`
   - Verify all imports are correct
   - Ensure environment variables are properly set

3. **Security audit failures:**
   - Run `pnpm audit fix` to auto-fix issues
   - For unfixable issues, consider updating dependencies
   - Use `pnpm audit --audit-level high` to check locally

4. **Lint failures:**
   - Run `pnpm lint --fix` to auto-fix issues
   - Check ESLint configuration in `.eslintrc.json`

### Debug Workflow Runs

To debug failed workflow runs:

1. Check the Actions tab in your GitHub repository
2. Click on the failed workflow run
3. Expand the failed job and step
4. Review logs for error details
5. Download artifacts if available for local inspection

## Artifact Retention

- **Test results:** 7 days
- **Build artifacts:** 1 day
- **Coverage reports:** Used for PR comments, then cleaned up

## Performance Considerations

- Uses `pnpm` with frozen lockfile for faster, consistent installs
- Caches Node.js dependencies between runs
- Runs tests with `maxWorkers=2` in CI for better resource usage
- Matrix builds run in parallel for faster feedback