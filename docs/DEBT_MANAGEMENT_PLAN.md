# Debt Management System - Implementation Plan

**Phase 2 Core Features**  
**Priority**: HIGH  
**Timeline**: 2-3 days  

---

## 🎯 Overview

The Debt Management System will enable users to track and manage various types of debt, including credit cards, loans, mortgages, and other liabilities. This system will integrate with the existing budgets and goals features to provide comprehensive debt payoff strategies.

---

## 📊 Debt Types to Support

1. **Credit Card Debt**
   - Balance tracking
   - Interest rates (APR)
   - Minimum payments
   - Credit limits
   - Due dates

2. **Personal Loans**
   - Principal amount
   - Interest rate
   - Monthly payment
   - Remaining balance
   - Term length

3. **Mortgages**
   - Property associated
   - Principal balance
   - Interest rate
   - Monthly payment
   - Remaining term

4. **Student Loans**
   - Loan provider
   - Interest rate
   - Payment plans
   - Deferment status

5. **Other Debts**
   - Custom debt types
   - Flexible tracking

---

## 🗄️ Database Schema

### Table: `debts`
```sql
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  debt_type TEXT NOT NULL, -- 'credit_card', 'loan', 'mortgage', 'student_loan', 'other'
  original_amount DECIMAL(12,2) NOT NULL,
  current_balance DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,2), -- Annual percentage rate
  minimum_payment DECIMAL(12,2),
  payment_day INTEGER, -- Day of month (1-31)
  due_date DATE,
  account_id UUID, -- Link to accounts table
  lender_name TEXT,
  account_number TEXT, -- Encrypted
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);
```

### Table: `debt_payments`
```sql
CREATE TABLE debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  principal_amount DECIMAL(12,2),
  interest_amount DECIMAL(12,2),
  balance_after DECIMAL(12,2),
  payment_type TEXT, -- 'minimum', 'extra', 'payoff'
  transaction_id UUID, -- Link to transactions
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);
```

### Table: `debt_payoff_strategies`
```sql
CREATE TABLE debt_payoff_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  strategy_type TEXT NOT NULL, -- 'avalanche', 'snowball', 'custom'
  target_date DATE,
  extra_payment_amount DECIMAL(12,2),
  debt_order JSONB, -- Array of debt IDs in payoff order
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🔌 API Endpoints

### Debt Management
- `GET /api/debts` - List all user debts
- `GET /api/debts/:id` - Get specific debt details
- `POST /api/debts` - Create new debt
- `PUT /api/debts/:id` - Update debt
- `DELETE /api/debts/:id` - Delete debt
- `GET /api/debts/summary` - Get debt summary statistics

### Debt Payments
- `GET /api/debts/:id/payments` - List payments for a debt
- `POST /api/debts/:id/payments` - Record a payment
- `PUT /api/debt-payments/:id` - Update payment
- `DELETE /api/debt-payments/:id` - Delete payment

### Payoff Strategies
- `GET /api/debt-strategies` - List payoff strategies
- `POST /api/debt-strategies` - Create strategy
- `PUT /api/debt-strategies/:id` - Update strategy
- `POST /api/debt-strategies/:id/calculate` - Calculate payoff timeline

---

## 🎨 UI Components

### 1. **Debt Overview Dashboard**
- Total debt amount
- Number of active debts
- Monthly minimum payments
- Interest being paid
- Debt-to-income ratio
- Progress charts

### 2. **Debt List/Grid View**
- Card-based layout for each debt
- Quick stats (balance, rate, minimum)
- Payment due dates
- Progress indicators
- Quick actions (pay, edit, view)

### 3. **Add/Edit Debt Modal**
- Form with debt type selection
- Dynamic fields based on type
- Interest calculator
- Account linking
- Payment scheduling

### 4. **Debt Detail Page**
- Payment history
- Amortization schedule
- Interest vs principal chart
- Extra payment calculator
- Transaction linking

### 5. **Payoff Strategy Builder**
- Strategy selection (avalanche/snowball)
- Debt prioritization
- Timeline visualization
- What-if scenarios
- Extra payment allocation

### 6. **Payment Recording**
- Quick payment entry
- Split principal/interest
- Link to transactions
- Recurring payment setup

---

## 🔗 Integration Points

### With Budgets
- Auto-create budget categories for debt payments
- Track debt payments against budget
- Alert when payment due
- Include in budget planning

### With Goals
- Create debt payoff goals
- Track progress
- Celebrate milestones
- Link strategies to goals

### With Transactions
- Auto-categorize debt payments
- Link payments to debts
- Track interest expenses
- Generate payment transactions

### With Accounts
- Link debts to accounts
- Update balances on payment
- Track net worth impact
- Credit utilization tracking

---

## 📱 Mobile Optimization

- Touch-friendly payment entry
- Swipe actions for quick pay
- Mobile-optimized charts
- Simplified forms
- Quick payment widgets

---

## 🚀 Implementation Steps

### Phase 1: Database & Core API (Day 1)
1. Create database migrations
2. Implement debt CRUD API
3. Create TypeScript types/schemas
4. Add validation and security

### Phase 2: Basic UI (Day 2)
1. Create debt list/grid component
2. Build add/edit debt modal
3. Implement debt detail view
4. Add payment recording

### Phase 3: Advanced Features (Day 3)
1. Build payoff strategy calculator
2. Create analytics/charts
3. Implement integrations
4. Add mobile optimizations

---

## 🎯 Success Metrics

- Users can track all debt types
- Accurate interest calculations
- Clear payoff timelines
- Seamless transaction integration
- Mobile-friendly interface
- Performance under 200ms load time

---

## 🔒 Security Considerations

- Encrypt sensitive account numbers
- Audit log all debt operations
- Validate payment amounts
- Secure API endpoints
- Rate limit strategy calculations