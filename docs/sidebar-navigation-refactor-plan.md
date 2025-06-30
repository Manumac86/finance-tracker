# Sidebar Navigation Refactor Plan

## Overview

This document outlines the plan to refactor the current top navigation bar to implement the shadcn/ui dashboard-01 sidebar design pattern. The refactor will modernize the navigation structure while maintaining all existing functionality including internationalization, theme switching, and authentication.

## Objectives

1. Replace the current horizontal header navigation with a sidebar-based layout
2. Implement the exact component structure from shadcn/ui dashboard-01
3. Add the balance chart to the dashboard page
4. Maintain all existing features (i18n, themes, auth, etc.)
5. Ensure mobile-responsive design with sheet overlay pattern

## Current State Analysis

### Existing Components
- **Header Component** (`/components/header.tsx`)
  - Top navigation bar with logo
  - Navigation links (Dashboard, Transactions, Budgets, Goals)
  - Search functionality
  - Theme switcher
  - Language switcher
  - User menu with sign out

- **Layout Structure** (`/app/[locale]/(dashboard)/layout.tsx`)
  - Simple wrapper with Header component
  - Main content area with max-width constraint
  - Add transaction floating button

- **Balance Chart** (`/components/balance-chart.tsx`)
  - Already implemented with recharts
  - Supports year/month/10-day views
  - Currently using sample data
  - Ready for integration

### Dependencies
- Already have required Radix UI components
- Missing components that need to be created:
  - Sidebar provider and components
  - Sheet component for mobile navigation
  - Updated navigation structure

## Implementation Plan

### Phase 1: Create Core UI Components

#### 1.1 Sheet Component
Create `/components/ui/sheet.tsx` with:
- Sheet overlay for mobile navigation
- Sheet content with proper animations
- Sheet trigger, header, footer components
- Based on Radix UI Dialog primitive

#### 1.2 Sidebar Components
Create the following components:
- `/components/ui/sidebar.tsx` - Core sidebar components (Sidebar, SidebarContent, SidebarHeader, etc.)
- `/components/app-sidebar.tsx` - Application-specific sidebar implementation
- `/components/nav-user.tsx` - User navigation dropdown in sidebar
- `/components/nav-main.tsx` - Main navigation links
- `/components/nav-secondary.tsx` - Secondary navigation items

#### 1.3 Collapsible Component
Create `/components/ui/collapsible.tsx` for expandable menu sections

### Phase 2: Implement Sidebar Structure

#### 2.1 App Sidebar Implementation
The `app-sidebar.tsx` will include:
- Company/app branding with logo
- Main navigation items with icons:
  - Dashboard
  - Transactions
  - Budgets
  - Goals
- Secondary navigation:
  - Reports (placeholder)
  - Settings (placeholder)
- User menu at bottom with:
  - User avatar and name
  - Theme switcher
  - Language switcher
  - Sign out option

#### 2.2 Mobile Navigation
- Use Sheet component for mobile sidebar
- Hamburger menu trigger in top bar
- Full-height overlay with navigation items
- Close on navigation or outside click

### Phase 3: Refactor Layout Structure

#### 3.1 Update Dashboard Layout
Modify `/app/[locale]/(dashboard)/layout.tsx`:
- Wrap with SidebarProvider
- Add sidebar component
- Update main content area structure
- Implement mobile-responsive behavior
- Keep AddTransactionButton in appropriate position

#### 3.2 Create Top Bar Component
Create `/components/top-bar.tsx` for:
- Mobile menu trigger
- Search functionality (moved from header)
- Breadcrumbs or page title
- Quick actions

### Phase 4: Dashboard Enhancements

#### 4.1 Integrate Balance Chart
Update `/app/[locale]/(dashboard)/dashboard/page.tsx`:
- Add balance chart as primary widget
- Position similar to shadcn/ui example
- Connect to real transaction data
- Style with proper card container

#### 4.2 Dashboard Layout
- Reorganize dashboard widgets
- Add proper grid layout
- Ensure responsive design
- Match shadcn/ui dashboard-01 aesthetic

### Phase 5: Feature Migration

#### 5.1 Search Functionality
- Move search from header to top bar or sidebar
- Maintain keyboard shortcuts
- Update search UI to match new design

#### 5.2 Theme Switcher
- Integrate into user menu in sidebar
- Keep same functionality
- Update UI to match sidebar design

#### 5.3 Language Switcher
- Add to user menu or sidebar footer
- Maintain route updating logic
- Ensure visibility on mobile

### Phase 6: Polish and Testing

#### 6.1 Animations and Transitions
- Sidebar collapse/expand animations
- Mobile sheet animations
- Hover states and active indicators
- Loading states

#### 6.2 Accessibility
- Keyboard navigation
- ARIA labels and roles
- Focus management
- Screen reader support

#### 6.3 Testing
- Test all navigation paths
- Verify mobile responsiveness
- Check theme switching
- Validate language switching
- Ensure all existing features work

## Component Structure

```
components/
├── ui/
│   ├── sheet.tsx          # Mobile navigation overlay
│   ├── sidebar.tsx        # Core sidebar components
│   └── collapsible.tsx    # Expandable sections
├── app-sidebar.tsx        # Main sidebar implementation
├── nav-main.tsx          # Primary navigation
├── nav-secondary.tsx     # Secondary navigation
├── nav-user.tsx          # User menu in sidebar
├── top-bar.tsx           # Top bar with search
└── header.tsx            # (to be removed/replaced)
```

## Migration Checklist

- [ ] Create Sheet component
- [ ] Create Sidebar components
- [ ] Create Collapsible component
- [ ] Implement AppSidebar with navigation
- [ ] Create NavMain component
- [ ] Create NavSecondary component
- [ ] Create NavUser component
- [ ] Create TopBar component
- [ ] Update dashboard layout with sidebar
- [ ] Integrate balance chart in dashboard
- [ ] Migrate search functionality
- [ ] Integrate theme switcher in sidebar
- [ ] Integrate language switcher in sidebar
- [ ] Test mobile navigation
- [ ] Test all existing features
- [ ] Remove old Header component
- [ ] Update any component imports

## Style Considerations

1. **Color Scheme**: Use existing theme variables
2. **Spacing**: Follow shadcn/ui patterns
3. **Icons**: Use lucide-react consistently
4. **Typography**: Maintain current font system
5. **Dark Mode**: Ensure all components support theme switching

## Breaking Changes

None expected. All existing functionality will be preserved with improved UX.

## Rollback Plan

If issues arise:
1. Switch back to main branch
2. Old Header component remains until fully replaced
3. Layout changes are isolated to dashboard layout file

## Success Criteria

1. Sidebar navigation matches shadcn/ui dashboard-01 design
2. All existing features work correctly
3. Mobile navigation is smooth and intuitive
4. Balance chart is displayed on dashboard
5. No regression in functionality
6. Improved user experience