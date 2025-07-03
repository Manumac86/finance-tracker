export const testUsers = {
  newUser: {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    confirmPassword: 'Test123!@#',
  },
  existingUser: {
    email: 'existing@example.com',
    password: 'Test123!@#',
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
  // Clerk test user with email verification code
  clerkTestUser: {
    email: 'your_email+clerk_test@example.com',
    verificationCode: '424242',
  },
};

export const errorMessages = {
  invalidCredentials: 'Invalid email or password',
  emailAlreadyExists: 'Email already exists',
  passwordMismatch: 'Passwords do not match',
  weakPassword: 'Password must be at least 8 characters',
  invalidEmail: 'Please enter a valid email',
};

// Test categories with UUID format (matching database schema)
export const testCategories = {
  shopping: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Shopping',
    icon: 'ShoppingBag',
    color: '#F59E0B',
  },
  foodDrink: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Food & Drink',
    icon: 'Coffee',
    color: '#10B981',
  },
  transportation: {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Transportation',
    icon: 'Car',
    color: '#EF4444',
  },
  entertainment: {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Entertainment',
    icon: 'Gamepad2',
    color: '#8B5CF6',
  },
  income: {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'Income',
    icon: 'ArrowDownLeft',
    color: '#10B981',
  },
};

// Test transactions with proper UUID category references
export const testTransactions = {
  coffeeExpense: {
    name: 'Coffee Shop',
    amount: 4.50,
    transactionType: 'expense' as const,
    categoryId: testCategories.foodDrink.id,
    description: 'Morning coffee',
  },
  groceryExpense: {
    name: 'Grocery Store',
    amount: 45.00,
    transactionType: 'expense' as const,
    categoryId: testCategories.shopping.id,
    description: 'Weekly groceries',
  },
  gasExpense: {
    name: 'Gas Station',
    amount: 35.50,
    transactionType: 'expense' as const,
    categoryId: testCategories.transportation.id,
    description: 'Fuel for car',
  },
  salaryIncome: {
    name: 'Salary Deposit',
    amount: 2500.00,
    transactionType: 'income' as const,
    categoryId: testCategories.income.id,
    description: 'Monthly salary',
  },
};

// Bulk transaction test data
export const bulkTransactionText = `Coffee Shop $4.50
Lunch Restaurant $12.00
Gas Station $45.00
Grocery Store $67.23
Movie Theater $15.99`;

// Expected parsed transactions from bulk text
export const expectedBulkTransactions = [
  { name: 'Coffee Shop', amount: 4.50 },
  { name: 'Lunch Restaurant', amount: 12.00 },
  { name: 'Gas Station', amount: 45.00 },
  { name: 'Grocery Store', amount: 67.23 },
  { name: 'Movie Theater', amount: 15.99 },
];

// API test endpoints
export const apiEndpoints = {
  transactions: '/api/transactions',
  categories: '/api/categories',
  goals: '/api/goals',
  budgets: '/api/budgets',
};

// Database seeding data
export const seedData = {
  categories: Object.values(testCategories),
  transactions: Object.values(testTransactions),
};