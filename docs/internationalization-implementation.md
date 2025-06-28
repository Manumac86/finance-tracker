# Internationalization (i18n) Implementation Plan

## Overview
This document outlines the implementation of bilingual support (Spanish/English) for the Finance Tracker platform using Next.js App Router's internationalization features with a sub-path routing strategy.

## Technology Stack
- **Framework**: next-intl (recommended for Next.js App Router)
- **Locale Detection**: negotiator + @formatjs/intl-localematcher
- **Routing Strategy**: Sub-path routing (/en/dashboard, /es/dashboard)

## Implementation Steps

### Phase 1: Infrastructure Setup ✅

#### 1.1 Install Dependencies (COMPLETED)
```bash
pnpm add next-intl negotiator @formatjs/intl-localematcher
pnpm add -D @types/negotiator
```

#### 1.2 Create i18n Configuration
Create the following configuration files:

**lib/i18n/config.ts**
- Define supported locales: ['en', 'es']
- Set default locale: 'en'
- Export locale configuration

**lib/i18n/navigation.ts**
- Create navigation helpers
- Locale-aware link components
- Route utilities

**lib/i18n/request.ts**
- Locale detection logic
- Cookie management
- Header parsing

### Phase 2: Project Structure Migration

#### 2.1 Create Translation Files
```
messages/
├── en.json          # English translations
├── es.json          # Spanish translations
└── index.ts         # Translation loader
```

#### 2.2 Restructure App Directory
Move all routes under `[locale]` directory:
```
app/
├── [locale]/
│   ├── (auth)/
│   │   ├── signin/
│   │   │   └── [[...rest]]/
│   │   │       └── page.tsx
│   │   └── signup/
│   │       └── [[...rest]]/
│   │           └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── transactions/
│   │   │   └── page.tsx
│   │   ├── budgets/
│   │   │   └── page.tsx
│   │   ├── goals/
│   │   │   └── page.tsx
│   │   ├── recurring/
│   │   │   └── page.tsx
│   │   ├── categories/
│   │   │   └── page.tsx
│   │   ├── banking/
│   │   │   └── page.tsx
│   │   ├── family/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── export/
│   │   │       └── page.tsx
│   │   └── onboarding/
│   │       └── page.tsx
│   ├── layout.tsx   # Locale-specific layout
│   └── page.tsx      # Landing page
├── api/              # API routes (no locale needed)
├── layout.tsx        # Root layout (minimal)
└── not-found.tsx
```

### Phase 3: Middleware Configuration

#### 3.1 Update middleware.ts
- Integrate locale detection with Clerk authentication
- Handle locale routing
- Preserve authentication flows
- Cookie-based locale persistence

### Phase 4: Component Internationalization

#### 4.1 Priority Components
1. **Header/Navigation** - All menu items, search placeholder
2. **Dashboard** - Titles, metrics, chart labels
3. **Transaction Components** - Forms, filters, status messages
4. **Budget Components** - Alerts, progress indicators
5. **Goal Tracking** - Progress messages, achievements
6. **Family Features** - Member roles, invitations
7. **Banking Integration** - Connection flows, status messages

#### 4.2 Translation Structure
Organize translations by feature:
```json
{
  "common": {
    "appName": "FinTrack",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "transactions": "Transactions",
    "budgets": "Budgets",
    "goals": "Goals",
    "recurring": "Recurring",
    "manage": "Manage",
    "reports": "Reports",
    "banking": "Banking",
    "family": "Family"
  },
  "dashboard": {
    "title": "Financial Overview",
    "welcome": "Welcome back, {name}!",
    "totalBalance": "Total Balance",
    "monthlyIncome": "Monthly Income",
    "monthlyExpenses": "Monthly Expenses",
    "recentTransactions": "Recent Transactions",
    "budgetOverview": "Budget Overview",
    "goalProgress": "Goal Progress"
  },
  "transactions": {
    "title": "Transactions",
    "addTransaction": "Add Transaction",
    "searchPlaceholder": "Search transactions...",
    "filters": {
      "all": "All",
      "income": "Income",
      "expense": "Expense",
      "category": "Category",
      "dateRange": "Date Range"
    },
    "form": {
      "description": "Description",
      "amount": "Amount",
      "category": "Category",
      "date": "Date",
      "type": "Type"
    }
  },
  "budgets": {
    "title": "Budgets",
    "createBudget": "Create Budget",
    "monthlyBudget": "Monthly Budget",
    "spent": "Spent",
    "remaining": "Remaining",
    "overspent": "Overspent",
    "alerts": {
      "title": "Budget Alerts",
      "warning": "You've used {percentage}% of your {category} budget",
      "exceeded": "You've exceeded your {category} budget by {amount}"
    }
  }
}
```

### Phase 5: Special Considerations

#### 5.1 Currency Formatting
- Use Intl.NumberFormat with locale
- Support multiple currencies (USD, EUR, MXN)
- Store amounts in cents

#### 5.2 Date/Time Formatting
- Use date-fns with locale support
- Display in user's timezone
- Relative time formatting ("2 days ago" → "hace 2 días")

#### 5.3 Form Validation
- Translate Zod error messages
- Custom validation messages
- Field-specific errors

#### 5.4 Database Content
- System categories: Translated
- User content: Original language
- Search: Works in both languages

### Phase 6: Language Switcher

#### 6.1 Component Features
- Dropdown in header
- Flag icons (optional)
- Saves preference to cookie
- Maintains current page state
- Smooth transition

### Phase 7: Testing Strategy

#### 7.1 Unit Tests
- Translation hook tests
- Locale detection tests
- Navigation helper tests

#### 7.2 E2E Tests
- Language switching flow
- Form submission in both languages
- Navigation consistency

### Phase 8: Deployment

#### 8.1 Environment Setup
- No additional environment variables needed
- Translations bundled with app

#### 8.2 Performance
- Static generation for localized pages
- Lazy load translations
- Minimal client bundle impact

## Timeline

| Phase | Task | Estimated Time | Status |
|-------|------|----------------|---------|
| 1 | Infrastructure Setup | 2 hours | ✅ Started |
| 2 | Project Structure | 3 hours | 🔄 In Progress |
| 3 | Middleware Config | 2 hours | ⏳ Pending |
| 4 | Component i18n | 8-10 hours | ⏳ Pending |
| 5 | Special Features | 3 hours | ⏳ Pending |
| 6 | Language Switcher | 2 hours | ⏳ Pending |
| 7 | Testing | 4 hours | ⏳ Pending |
| 8 | Deployment | 1 hour | ⏳ Pending |

**Total Estimated Time**: ~25 hours

## Success Criteria

- [ ] All UI text is translatable
- [ ] Language preference persists across sessions
- [ ] SEO-friendly URLs for both languages
- [ ] No performance degradation
- [ ] Forms validate in selected language
- [ ] Search works in both languages
- [ ] All tests pass

## Future Enhancements

1. **Additional Languages**: Portuguese, French
2. **RTL Support**: Arabic, Hebrew
3. **Regional Variations**: Mexican Spanish, British English
4. **AI Translation**: For user-generated content
5. **Voice Input**: Language-specific

## Resources

- [Next.js Internationalization Docs](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [date-fns Internationalization](https://date-fns.org/docs/I18n)