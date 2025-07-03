# Budget System Redesign - Development Plan

## Overview

This document outlines the comprehensive redesign of the budget-transaction relationship system to address critical architectural gaps and enhance the budget management functionality.

## Current Issues Identified

### Critical Problems
1. **Missing Category Selection UI** - Budget creation form has category selection commented out
2. **No Transaction-Budget Direct Assignment** - Transactions cannot be manually assigned to specific budgets
3. **No Multi-Category Budget Support** - Budgets can only track one category at a time
4. **Incomplete Custom Budget Implementation** - Custom budget type exists but has no logic
5. **No Database Persistence** - Budget progress is calculated in real-time but never stored
6. **No Budget Impact Preview** - Users don't see which budgets will be affected when creating transactions

### Secondary Issues
- No transaction exclusion capability from budget calculations
- No manual budget progress adjustments
- No bulk transaction-to-budget assignment tools
- No audit trail for budget changes

## Implementation Plan

### Phase 1: Fix Immediate Issues (High Priority)

#### 1.1 Fix Budget-Category Connection
**Files to modify:**
- `components/budgets/create-budget-modal.tsx`
- `components/budgets/edit-budget-modal.tsx` (if exists)
- `app/api/budgets/route.ts`

**Tasks:**
- [ ] Uncomment and implement category selection dropdown in budget creation
- [ ] Add category validation for "category" type budgets
- [ ] Import and use `useTranslatedCategories` hook
- [ ] Update form submission to include categoryId
- [ ] Add conditional rendering: show category selector only for "category" type budgets
- [ ] Test category selection functionality

**Code Changes:**
```tsx
// In CreateBudgetModal - uncomment and enhance category selection
{formData.budgetType === "category" && (
  <div className="space-y-2">
    <Label htmlFor="category">{t("selectCategory")} *</Label>
    <Select
      value={formData.categoryId}
      onValueChange={(value) => updateFormData("categoryId", value)}
    >
      <SelectTrigger className="bg-gray-800 border-gray-700">
        <SelectValue placeholder={t("selectCategoryPlaceholder")} />
      </SelectTrigger>
      <SelectContent>
        {translatedCategories?.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.translatedName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}
```

#### 1.2 Add Transaction-Budget Impact Preview
**Files to modify:**
- `components/add-transaction-button.tsx`
- `components/transactions/edit-transaction-modal.tsx`
- `contexts/budget-alerts.tsx`

**Tasks:**
- [ ] Create budget impact calculation hook `useBudgetImpact`
- [ ] Add real-time budget impact display in transaction forms
- [ ] Show affected budgets when selecting category or entering amount
- [ ] Display format: "This transaction will impact: Food Budget (+$15.00)"
- [ ] Add visual indicators for budget status (on track, warning, exceeded)

**New Hook Structure:**
```tsx
// hooks/use-budget-impact.ts
export function useBudgetImpact(transaction: Partial<UITransaction>) {
  const { data: budgets } = useBudgets();
  
  return useMemo(() => {
    // Calculate which budgets would be affected
    // Return impact preview data
  }, [transaction, budgets]);
}
```

#### 1.3 Implement Database Budget Updates
**Files to modify:**
- `app/api/transactions/route.ts`
- `app/api/transactions/[id]/route.ts`
- `lib/services/budget-calculation.ts` (new file)
- `lib/db/migrations/` (new migration)

**Tasks:**
- [ ] Create budget recalculation service
- [ ] Add automatic budget updates when transactions are modified
- [ ] Create database function for efficient budget recalculation
- [ ] Add `last_calculated_at` timestamp updates
- [ ] Implement error handling and rollback mechanisms

**New Service Structure:**
```typescript
// lib/services/budget-calculation.ts
export class BudgetCalculationService {
  static async recalculateBudget(budgetId: string): Promise<void>
  static async recalculateUserBudgets(userId: string): Promise<void>
  static async updateBudgetProgress(budgetId: string, newSpent: number): Promise<void>
}
```

### Phase 2: Enhanced Budget-Transaction Relationships (Medium Priority)

#### 2.1 Optional Transaction-Budget Assignment
**Database Changes:**
```sql
-- Add optional budget assignment to transactions
ALTER TABLE transactions ADD COLUMN budget_id UUID REFERENCES budgets(id);
CREATE INDEX idx_transactions_budget_id ON transactions(budget_id);
```

**Files to modify:**
- `lib/db/schemas/transaction.ts`
- `components/add-transaction-button.tsx`
- `app/api/transactions/route.ts`

**Tasks:**
- [ ] Add `budget_id` field to transaction schema
- [ ] Add budget selection dropdown in transaction forms (optional)
- [ ] Update transaction creation/update logic
- [ ] Implement priority logic: direct assignment > category matching
- [ ] Add "Assign to Budget" section in transaction forms

#### 2.2 Multi-Category Budget Support
**Database Changes:**
```sql
-- Multi-category budget support
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(budget_id, category_id)
);
```

**Files to modify:**
- `lib/db/schemas/budget.ts`
- `components/budgets/create-budget-modal.tsx`
- `lib/services/budget-calculation.ts`

**Tasks:**
- [ ] Create budget-categories junction table
- [ ] Update budget schema to support multiple categories
- [ ] Add multi-category selection UI (checkboxes)
- [ ] Update budget progress calculation for multi-category budgets
- [ ] Add category management in budget editing

#### 2.3 Custom Budget Types Implementation
**Files to modify:**
- `lib/db/schemas/budget.ts`
- `components/budgets/create-budget-modal.tsx`
- `components/budgets/custom-budget-rules.tsx` (new component)

**Tasks:**
- [ ] Define custom budget rule schema
- [ ] Create UI for custom rule definition
- [ ] Implement rule evaluation engine
- [ ] Support filters: amount ranges, keywords, multiple categories, date patterns
- [ ] Store rules as JSON in budget metadata field

**Custom Rule Structure:**
```typescript
interface CustomBudgetRule {
  type: 'include' | 'exclude';
  conditions: {
    categories?: string[];
    amountRange?: { min?: number; max?: number };
    keywords?: string[];
    datePattern?: 'weekdays' | 'weekends' | 'specific-dates';
  };
}
```

### Phase 3: Advanced Features (Low Priority)

#### 3.1 Budget Exclusion Rules
**Database Changes:**
```sql
ALTER TABLE transactions ADD COLUMN excluded_from_budgets BOOLEAN DEFAULT FALSE;
```

**Tasks:**
- [ ] Add exclusion flag to transactions
- [ ] Add "Exclude from budgets" checkbox in transaction forms
- [ ] Update all budget calculations to respect exclusion flag
- [ ] Add bulk exclusion tools

#### 3.2 Manual Budget Adjustments
**Files to modify:**
- `components/budgets/budget-card.tsx`
- `components/budgets/manual-adjustment-modal.tsx` (new)
- `app/api/budgets/[id]/adjust/route.ts` (new)

**Tasks:**
- [ ] Add manual adjustment capability
- [ ] Create audit trail for manual changes
- [ ] Add adjustment history view
- [ ] Implement approval workflow for large adjustments

#### 3.3 Bulk Budget Assignment Tools
**Files to modify:**
- `components/transactions/bulk-budget-assignment.tsx` (new)
- `app/api/transactions/bulk-assign/route.ts` (new)

**Tasks:**
- [ ] Create bulk assignment interface
- [ ] Add smart assignment suggestions
- [ ] Implement undo functionality
- [ ] Add assignment history tracking

## Database Migration Plan

### Migration 1: Add budget_id to transactions
```sql
-- 012_add_budget_assignment.sql
ALTER TABLE transactions ADD COLUMN budget_id UUID REFERENCES budgets(id);
CREATE INDEX idx_transactions_budget_id ON transactions(budget_id);
```

### Migration 2: Multi-category support
```sql
-- 013_budget_categories.sql
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(budget_id, category_id)
);
```

### Migration 3: Transaction exclusions
```sql
-- 014_transaction_exclusions.sql
ALTER TABLE transactions ADD COLUMN excluded_from_budgets BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_transactions_excluded ON transactions(excluded_from_budgets);
```

## Budget Progress Calculation Logic

### Priority Order:
1. **Direct Assignment**: If `transaction.budget_id` is set, count toward that budget
2. **Category Matching**: If no direct assignment, use `transaction.category_id` matching
3. **Multi-Category**: For budgets with multiple categories, include if category matches any
4. **Custom Rules**: For custom budgets, apply stored filtering rules
5. **Exclusions**: Skip transactions where `excluded_from_budgets = true`

### Calculation Algorithm:
```typescript
function calculateBudgetProgress(budget: UIBudget, transactions: UITransaction[]): number {
  return transactions
    .filter(transaction => {
      // Skip excluded transactions
      if (transaction.excludedFromBudgets) return false;
      
      // Check date range
      if (!isTransactionInBudgetPeriod(transaction, budget)) return false;
      
      // Only count expenses
      if (transaction.transactionType !== 'expense') return false;
      
      // Apply budget-specific logic
      return transactionMatchesBudget(transaction, budget);
    })
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
}
```

## Testing Strategy

### Unit Tests:
- [ ] Budget calculation service tests
- [ ] Budget impact hook tests
- [ ] Custom rule evaluation tests
- [ ] Transaction-budget matching logic tests

### Integration Tests:
- [ ] Budget creation with category selection
- [ ] Transaction creation with budget impact
- [ ] Automatic budget recalculation
- [ ] Multi-category budget progress calculation

### E2E Tests:
- [ ] Complete budget creation flow
- [ ] Transaction creation with budget preview
- [ ] Budget progress accuracy verification
- [ ] Custom budget rule definition and application

## Performance Considerations

### Database Optimizations:
- [ ] Add indexes on frequently queried fields
- [ ] Implement budget calculation caching
- [ ] Use database functions for complex calculations
- [ ] Consider materialized views for budget summaries

### Frontend Optimizations:
- [ ] Debounce budget impact calculations
- [ ] Cache budget data with SWR
- [ ] Implement optimistic updates for better UX
- [ ] Lazy load budget lists and transaction histories

## Success Criteria

### Phase 1 Success Metrics:
- [ ] Users can select categories when creating category-type budgets
- [ ] Transaction forms show real-time budget impact
- [ ] Budget progress persists accurately in database
- [ ] UI budget progress matches database calculations

### Phase 2 Success Metrics:
- [ ] Users can manually assign transactions to specific budgets
- [ ] Multi-category budgets calculate progress correctly
- [ ] Custom budget rules can be defined and applied
- [ ] All budget types work as expected

### Phase 3 Success Metrics:
- [ ] Transaction exclusions work correctly
- [ ] Manual budget adjustments are tracked and auditable
- [ ] Bulk assignment tools improve user productivity
- [ ] System handles edge cases gracefully

## Timeline Estimate

- **Phase 1**: 1-2 weeks (critical fixes)
- **Phase 2**: 2-3 weeks (enhanced functionality)
- **Phase 3**: 1-2 weeks (advanced features)
- **Testing & Polish**: 1 week

**Total Estimated Time**: 5-8 weeks

## Risk Assessment

### High Risk:
- Database migration complexity with existing data
- Performance impact of real-time budget calculations
- Data consistency between UI calculations and database

### Medium Risk:
- Complex custom rule evaluation logic
- Multi-category budget UI complexity
- Transaction-budget relationship edge cases

### Mitigation Strategies:
- Implement feature flags for gradual rollout
- Add comprehensive test coverage
- Create database backup and rollback procedures
- Monitor performance metrics during rollout