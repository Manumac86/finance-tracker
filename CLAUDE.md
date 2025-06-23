# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build the application for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint on the codebase

## Architecture Overview

This is a Next.js 15 finance tracker application using the App Router with TypeScript. The application tracks financial transactions and categories with MongoDB as the database.

### Key Technical Stack
- **Framework**: Next.js 15 with App Router
- **UI**: Radix UI components with Tailwind CSS
- **Database**: MongoDB with Zod schemas for validation
- **Data Fetching**: SWR for client-side data fetching
- **State Management**: React Context API
- **Package Manager**: pnpm

### Core Architecture Patterns

1. **Data Layer**: 
   - Database schemas defined in `lib/db/schemas.ts` using Zod
   - MongoDB connection and utilities in `lib/db/mongo.ts`
   - API routes in `app/api/` follow RESTful patterns

2. **State Management**:
   - Context providers in `contexts/` directory (categories.tsx, transactions.tsx)
   - SWR used for server state synchronization
   - All providers composed in `app/providers.tsx`

3. **Component Structure**:
   - UI components in `components/ui/` (shadcn/ui pattern)
   - Feature components in `components/` root
   - Server/Client components follow Next.js App Router conventions

4. **Type Safety**:
   - Shared types in `types/common.type.ts`
   - Database models exported from schema definitions
   - Strict TypeScript configuration

### Data Flow
- Client components use SWR hooks via context providers
- API routes handle CRUD operations with MongoDB
- Zod schemas validate data at API boundaries
- Context providers manage client-side state updates

### Route Structure
- `(auth)/` - Authentication pages (signin/signup)
- `(dashboard)/` - Protected dashboard pages
- `api/` - API endpoints for transactions and categories

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