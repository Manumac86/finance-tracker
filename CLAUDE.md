# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build the application for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint on the codebase

## Architecture Overview

This is a Next.js 15 finance tracker application using the App Router with TypeScript. The application tracks financial transactions, categories, goals, and budgets with PostgreSQL as the primary database and Redis for caching.

### Key Technical Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: Clerk for user management and session handling
- **UI**: Radix UI components with Tailwind CSS (mobile-first design)
- **Database**: PostgreSQL with Supabase integration
- **Caching**: Redis with Upstash for performance optimization
- **Data Fetching**: SWR for client-side data fetching and real-time updates
- **State Management**: React Context API with SWR integration
- **Package Manager**: pnpm
- **Testing**: Jest with React Testing Library (TDD approach)

### Core Architecture Patterns

1. **Data Layer**:

   - Database schemas defined in `lib/db/schemas/` using TypeScript interfaces
   - PostgreSQL connection and utilities in `lib/db/postgres.ts`
   - Redis caching layer in `lib/db/redis.ts`
   - SQL migrations in `lib/db/migrations/`
   - API routes in `app/api/` follow RESTful patterns

2. **State Management**:

   - Context providers in `contexts/` directory (categories.tsx, transactions.tsx, budget-alerts.tsx)
   - SWR used for server state synchronization with automatic revalidation
   - All providers composed in `app/providers.tsx`
   - Real-time budget alerts and goal progress tracking

3. **Component Structure**:

   - UI components in `components/ui/` (shadcn/ui pattern)
   - Feature components organized by domain (`components/goals/`, `components/budgets/`)
   - Server/Client components follow Next.js App Router conventions
   - Mobile-first responsive design throughout

4. **Type Safety**:

   - Strict TypeScript configuration with no `any` types
   - Database models exported from schema definitions
   - Transform functions for database/UI type conversion (snake_case ↔ camelCase)
   - Comprehensive type checking for API boundaries

5. **Performance Optimization**:

   - Redis caching for frequently accessed data
   - PostgreSQL indexing for query optimization
   - SWR with smart caching and background revalidation
   - Mobile-optimized bundle sizes and lazy loading

6. **Testing**:

   - Jest for unit and integration testing
   - React Testing Library for component testing
   - Test-driven development approach
   - Mocking for database operations and external dependencies
   - Integration tests for API endpoints and data flow
   - End-to-end tests for user flows
   - Test coverage for critical functionality
   - Test files organized by domain (`__tests__/budgets/`, `__tests__/transactions/`)
   - Use import instead of require for mocking and importing modules
   - Coverage thresholds: Lines 80%, Functions 75%, Branches 70%, Statements 80%
   - Automated CI/CD pipeline with GitHub Actions for testing and coverage reporting

### Data Flow

- Client components use SWR hooks via context providers
- API routes handle CRUD operations with PostgreSQL
- Redis caching layer reduces database load and improves response times
- Real-time updates through SWR revalidation and context state management
- Budget alerts and goal progress calculated server-side with caching

### Route Structure

- `(auth)/signin/[[...rest]]/` - Clerk-powered authentication pages
- `(dashboard)/` - Protected dashboard pages with middleware
  - `/dashboard` - Financial overview with budget alerts
  - `/goals` - Goal setting and tracking system
  - `/budgets` - Budget management and spending alerts
  - `/transactions` - Transaction history with infinite scroll
  - `/onboarding` - Interactive user onboarding flow
- `api/` - RESTful API endpoints
  - `/api/goals` - Goal CRUD operations
  - `/api/budgets` - Budget management
  - `/api/transactions` - Transaction processing
  - `/api/categories` - Category management
  - `/api/budget-alerts` - Real-time alert system

## Development Guidelines (from Cursor Rules)

### Next.js Conventions

- Use Server Components by default, mark client components with 'use client'
- Follow App Router directory structure
- Implement proper loading and error states for routes
- Use Zod for form validation with server-side validation
- Minimize client-side state, prefer server state when possible

### React Patterns

- Use functional components with custom hooks for reusable logic
- Follow Rules of Hooks with proper dependency arrays
- Implement proper memoization (useMemo, useCallback, React.memo)
- Keep state close to where it's used, avoid prop drilling
- Use Error Boundaries and handle async errors properly

### TypeScript Standards

- Prefer interfaces over types for object definitions
- Avoid `any`, use `unknown` for unknown types
- Use strict TypeScript configuration
- Use PascalCase for types/interfaces, camelCase for variables
- Export types from dedicated files when shared across components

### Styling with Tailwind

- Use utility classes over custom CSS
- Use shadcn/ui components when available
- Follow mobile-first responsive design approach
- Implement proper color contrast and accessibility
- Use semantic color naming and proper state variants

## Git Commit Standards

### Conventional Commits Specification

Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification for all commit messages:

#### Format

```
<type>[optional scope]: <description>

[optional body]
```

#### Types

- **feat**: A new feature for the user (not a new feature for build script)
- **fix**: A bug fix for the user (not a fix to a build script)
- **docs**: Changes to documentation
- **style**: Formatting, missing semi colons, etc; no production code change
- **refactor**: Refactoring production code, eg. renaming a variable
- **test**: Adding missing tests, refactoring tests; no production code change
- **chore**: Updating grunt tasks etc; no production code change
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **perf**: A code change that improves performance
- **revert**: Reverts a previous commit

#### Scopes (optional)

- **auth**: Authentication related changes
- **ui**: User interface components
- **api**: API routes and backend logic
- **db**: Database schemas and operations
- **config**: Configuration files
- **deps**: Dependency updates

#### Examples

```bash
# Simple feature addition
feat: add voice-to-text for transaction descriptions

# Feature with scope
feat(auth): implement password reset functionality

# Bug fix with body
fix: resolve PostgreSQL connection timeout issue

Fixed environment variable fallback logic that was causing
connection failures when SUPABASE_SERVICE_ROLE_KEY was undefined.

# Breaking change
feat!: migrate from MongoDB to PostgreSQL

BREAKING CHANGE: Database structure completely changed.
All existing data needs to be migrated using the provided scripts.

# Multi-line commit with footer
feat(ui): add bulk transaction import

- Support CSV file upload
- Manual bulk entry interface
- Smart category suggestions for imported data
- Progress indicators and error handling

Closes #123
```

#### Rules

1. **Use lowercase** for type and description
2. **No period** at the end of description
3. **Imperative mood** in description ("add" not "added")
4. **Limit first line** to 50 characters when possible
5. **Body and footer** separated by blank lines
6. **Reference issues** in footer when applicable
7. **Breaking changes** must be indicated with `!` or `BREAKING CHANGE:`

#### Complete Example

```bash
git commit -m "$(cat <<'EOF'
feat(ui): add comprehensive goal tracking system

- Multiple goal types: savings, debt payoff, spending limits
- Visual progress tracking with animated progress bars
- Goal achievement celebrations with confetti animations
- Smart deadline reminders and milestone notifications
- Integration with budget alerts for spending goal monitoring

The goal system supports both individual and family shared goals,
with proper permission controls and progress synchronization.

Implements User Story US-006 from Phase 1 development plan.
All acceptance criteria verified and tests passing.
EOF
)"
```
