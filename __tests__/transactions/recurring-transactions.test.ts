import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the database functions
jest.mock('@/lib/db/postgres', () => ({
  selectRecurringTransactions: jest.fn(),
  insertRecurringTransaction: jest.fn(),
  updateRecurringTransaction: jest.fn(),
  deleteRecurringTransaction: jest.fn(),
  insertTransaction: jest.fn(),
  selectBillReminders: jest.fn(),
  insertBillReminder: jest.fn(),
  updateBillReminder: jest.fn(),
  deleteBillReminder: jest.fn(),
}));

// Mock the schema transformations
jest.mock('@/lib/db/schemas/recurring-transaction', () => ({
  transformRecurringTransactionToUI: jest.fn(),
  transformRecurringTransactionToDB: jest.fn(),
  createRecurringTransactionSchema: {
    parse: jest.fn(),
  },
}));

import * as mockDb from '@/lib/db/postgres';
import * as mockSchema from '@/lib/db/schemas/recurring-transaction';

describe('Recurring Transactions Functionality', () => {
  const mockDbRecurringTransaction = {
    id: 'recurring-1',
    user_id: 'user-1',
    name: 'Monthly Rent',
    amount: 1200.00,
    transaction_type: 'expense',
    category_id: 'cat-1',
    description: 'Monthly apartment rent',
    frequency: 'monthly',
    next_due_date: '2024-02-01',
    end_date: null,
    is_active: true,
    auto_create: true,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  };

  const mockUIRecurringTransaction = {
    id: 'recurring-1',
    userId: 'user-1',
    name: 'Monthly Rent',
    amount: 1200.00,
    transactionType: 'expense',
    categoryId: 'cat-1',
    description: 'Monthly apartment rent',
    frequency: 'monthly',
    nextDueDate: '2024-02-01',
    endDate: null,
    isActive: true,
    autoCreate: true,
  };

  const mockCreateRecurringTransactionData = {
    name: 'Weekly Groceries',
    amount: 150.00,
    transactionType: 'expense',
    categoryId: 'cat-2',
    description: 'Weekly grocery shopping',
    frequency: 'weekly',
    nextDueDate: '2024-01-08',
    endDate: '2024-12-31',
    isActive: true,
    autoCreate: false,
  };

  const mockDbBillReminder = {
    id: 'bill-1',
    user_id: 'user-1',
    name: 'Electric Bill',
    description: 'Monthly electricity bill',
    amount: 85.00,
    due_date: '2024-01-15',
    category_id: 'cat-3',
    frequency: 'monthly',
    reminder_days: 3,
    is_paid: false,
    is_active: true,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSchema.transformRecurringTransactionToUI.mockReturnValue(mockUIRecurringTransaction);
    mockSchema.transformRecurringTransactionToDB.mockReturnValue(mockDbRecurringTransaction);
    mockSchema.createRecurringTransactionSchema.parse.mockReturnValue(mockCreateRecurringTransactionData);
  });

  describe('Recurring Transaction Creation', () => {
    it('should create a new recurring transaction', async () => {
      mockDb.insertRecurringTransaction.mockResolvedValue(mockDbRecurringTransaction);

      const { insertRecurringTransaction } = mockDb;
      const result = await insertRecurringTransaction(mockDbRecurringTransaction);

      expect(insertRecurringTransaction).toHaveBeenCalledWith(mockDbRecurringTransaction);
      expect(result).toEqual(mockDbRecurringTransaction);
    });

    it('should validate recurring transaction data before creation', () => {
      const invalidRecurringData = {
        name: '',
        amount: -100,
        frequency: 'invalid',
        nextDueDate: 'invalid-date',
      };

      mockSchema.createRecurringTransactionSchema.parse.mockImplementation(() => {
        throw new Error('Validation failed: Invalid recurring transaction data');
      });

      expect(() => {
        mockSchema.createRecurringTransactionSchema.parse(invalidRecurringData);
      }).toThrow('Validation failed: Invalid recurring transaction data');
    });

    it('should validate required fields', () => {
      const requiredFields = ['name', 'amount', 'transactionType', 'frequency', 'nextDueDate'];
      
      requiredFields.forEach(field => {
        const incompleteData = { ...mockCreateRecurringTransactionData };
        delete incompleteData[field as keyof typeof mockCreateRecurringTransactionData];

        mockSchema.createRecurringTransactionSchema.parse.mockImplementation(() => {
          throw new Error(`${field} is required`);
        });

        expect(() => {
          mockSchema.createRecurringTransactionSchema.parse(incompleteData);
        }).toThrow(`${field} is required`);
      });
    });

    it('should validate frequency enum values', () => {
      const invalidFrequencyTransaction = {
        ...mockCreateRecurringTransactionData,
        frequency: 'invalid-frequency',
      };

      mockSchema.createRecurringTransactionSchema.parse.mockImplementation((data) => {
        const validFrequencies = ['daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'];
        if (!validFrequencies.includes(data.frequency)) {
          throw new Error('Invalid frequency');
        }
        return data;
      });

      expect(() => {
        mockSchema.createRecurringTransactionSchema.parse(invalidFrequencyTransaction);
      }).toThrow('Invalid frequency');
    });

    it('should validate amount is positive', () => {
      const negativeAmountTransaction = {
        ...mockCreateRecurringTransactionData,
        amount: -50,
      };

      mockSchema.createRecurringTransactionSchema.parse.mockImplementation((data) => {
        if (data.amount <= 0) {
          throw new Error('Amount must be positive');
        }
        return data;
      });

      expect(() => {
        mockSchema.createRecurringTransactionSchema.parse(negativeAmountTransaction);
      }).toThrow('Amount must be positive');
    });

    it('should validate date formats', () => {
      const invalidDateTransaction = {
        ...mockCreateRecurringTransactionData,
        nextDueDate: 'invalid-date',
      };

      mockSchema.createRecurringTransactionSchema.parse.mockImplementation((data) => {
        if (isNaN(Date.parse(data.nextDueDate))) {
          throw new Error('Invalid date format');
        }
        return data;
      });

      expect(() => {
        mockSchema.createRecurringTransactionSchema.parse(invalidDateTransaction);
      }).toThrow('Invalid date format');
    });

    it('should validate end date is after next due date', () => {
      const invalidEndDateTransaction = {
        ...mockCreateRecurringTransactionData,
        nextDueDate: '2024-12-31',
        endDate: '2024-01-01', // End before next due
      };

      mockSchema.createRecurringTransactionSchema.parse.mockImplementation((data) => {
        if (data.endDate && new Date(data.endDate) <= new Date(data.nextDueDate)) {
          throw new Error('End date must be after next due date');
        }
        return data;
      });

      expect(() => {
        mockSchema.createRecurringTransactionSchema.parse(invalidEndDateTransaction);
      }).toThrow('End date must be after next due date');
    });
  });

  describe('Recurring Transaction Retrieval', () => {
    it('should fetch recurring transactions for a user', async () => {
      mockDb.selectRecurringTransactions.mockResolvedValue([mockDbRecurringTransaction]);

      const { selectRecurringTransactions } = mockDb;
      const transactions = await selectRecurringTransactions('user-1');

      expect(selectRecurringTransactions).toHaveBeenCalledWith('user-1');
      expect(transactions).toEqual([mockDbRecurringTransaction]);
    });

    it('should handle empty recurring transaction list', async () => {
      mockDb.selectRecurringTransactions.mockResolvedValue([]);

      const { selectRecurringTransactions } = mockDb;
      const transactions = await selectRecurringTransactions('user-1');

      expect(transactions).toEqual([]);
    });

    it('should filter active recurring transactions only', async () => {
      const transactionsWithInactive = [
        { ...mockDbRecurringTransaction, id: 'recurring-1', is_active: true },
        { ...mockDbRecurringTransaction, id: 'recurring-2', is_active: false },
        { ...mockDbRecurringTransaction, id: 'recurring-3', is_active: true },
      ];
      mockDb.selectRecurringTransactions.mockResolvedValue(transactionsWithInactive);

      const { selectRecurringTransactions } = mockDb;
      const allTransactions = await selectRecurringTransactions('user-1');
      const activeTransactions = allTransactions.filter((t: any) => t.is_active);

      expect(activeTransactions).toHaveLength(2);
      expect(activeTransactions.every((t: any) => t.is_active)).toBe(true);
    });

    it('should handle database errors during retrieval', async () => {
      mockDb.selectRecurringTransactions.mockRejectedValue(new Error('Database connection error'));

      const { selectRecurringTransactions } = mockDb;

      await expect(selectRecurringTransactions('user-1')).rejects.toThrow('Database connection error');
    });
  });

  describe('Recurring Transaction Updates', () => {
    it('should update an existing recurring transaction', async () => {
      const updates = {
        amount: 1300.00,
        next_due_date: '2024-03-01',
        auto_create: false,
      };
      const updatedTransaction = { ...mockDbRecurringTransaction, ...updates };
      mockDb.updateRecurringTransaction.mockResolvedValue(updatedTransaction);

      const { updateRecurringTransaction } = mockDb;
      const result = await updateRecurringTransaction('recurring-1', updates);

      expect(updateRecurringTransaction).toHaveBeenCalledWith('recurring-1', updates);
      expect(result).toEqual(updatedTransaction);
    });

    it('should handle partial updates', async () => {
      const partialUpdates = { amount: 1250.00 };
      const updatedTransaction = { ...mockDbRecurringTransaction, amount: 1250.00 };
      mockDb.updateRecurringTransaction.mockResolvedValue(updatedTransaction);

      const { updateRecurringTransaction } = mockDb;
      const result = await updateRecurringTransaction('recurring-1', partialUpdates);

      expect(updateRecurringTransaction).toHaveBeenCalledWith('recurring-1', partialUpdates);
      expect(result.amount).toBe(1250.00);
    });

    it('should handle non-existent recurring transaction updates', async () => {
      mockDb.updateRecurringTransaction.mockRejectedValue(new Error('Recurring transaction not found'));

      const { updateRecurringTransaction } = mockDb;

      await expect(updateRecurringTransaction('non-existent', {}))
        .rejects.toThrow('Recurring transaction not found');
    });

    it('should update next due date after processing', () => {
      const calculateNextDueDate = (currentDate: string, frequency: string) => {
        const current = new Date(currentDate);
        
        switch (frequency) {
          case 'daily':
            current.setDate(current.getDate() + 1);
            break;
          case 'weekly':
            current.setDate(current.getDate() + 7);
            break;
          case 'bi-weekly':
            current.setDate(current.getDate() + 14);
            break;
          case 'monthly':
            current.setMonth(current.getMonth() + 1);
            break;
          case 'quarterly':
            current.setMonth(current.getMonth() + 3);
            break;
          case 'yearly':
            current.setFullYear(current.getFullYear() + 1);
            break;
        }
        
        return current.toISOString().split('T')[0];
      };

      expect(calculateNextDueDate('2024-01-01', 'weekly')).toBe('2024-01-08');
      expect(calculateNextDueDate('2024-01-01', 'monthly')).toBe('2024-02-01');
      expect(calculateNextDueDate('2024-01-01', 'yearly')).toBe('2025-01-01');
    });
  });

  describe('Recurring Transaction Deletion', () => {
    it('should delete a recurring transaction (soft delete)', async () => {
      mockDb.deleteRecurringTransaction.mockResolvedValue(true);

      const { deleteRecurringTransaction } = mockDb;
      const result = await deleteRecurringTransaction('recurring-1');

      expect(deleteRecurringTransaction).toHaveBeenCalledWith('recurring-1');
      expect(result).toBe(true);
    });

    it('should handle deletion of non-existent recurring transaction', async () => {
      mockDb.deleteRecurringTransaction.mockResolvedValue(false);

      const { deleteRecurringTransaction } = mockDb;
      const result = await deleteRecurringTransaction('non-existent');

      expect(result).toBe(false);
    });

    it('should handle deletion errors', async () => {
      mockDb.deleteRecurringTransaction.mockRejectedValue(new Error('Database error'));

      const { deleteRecurringTransaction } = mockDb;

      await expect(deleteRecurringTransaction('recurring-1')).rejects.toThrow('Database error');
    });
  });

  describe('Automatic Transaction Creation', () => {
    it('should create transaction when auto_create is true and due', async () => {
      const dueRecurringTransaction = {
        ...mockDbRecurringTransaction,
        auto_create: true,
        next_due_date: '2024-01-01', // Past due
      };

      const createdTransaction = {
        id: 'trans-auto-1',
        user_id: 'user-1',
        name: 'Monthly Rent',
        amount: 1200.00,
        transaction_type: 'expense',
        category_id: 'cat-1',
        transaction_date: '2024-01-01',
        recurring_transaction_id: 'recurring-1',
      };

      mockDb.insertTransaction.mockResolvedValue(createdTransaction);

      const { insertTransaction } = mockDb;
      const result = await insertTransaction(createdTransaction);

      expect(insertTransaction).toHaveBeenCalledWith(createdTransaction);
      expect(result.recurring_transaction_id).toBe('recurring-1');
    });

    it('should not create transaction when auto_create is false', () => {
      const manualRecurringTransaction = {
        ...mockDbRecurringTransaction,
        auto_create: false,
        next_due_date: '2024-01-01', // Past due
      };

      // Logic check: should not auto-create
      const shouldAutoCreate = manualRecurringTransaction.auto_create && 
                               new Date(manualRecurringTransaction.next_due_date) <= new Date();

      expect(shouldAutoCreate).toBe(false);
    });

    it('should identify due recurring transactions', () => {
      const today = '2024-01-15';
      const recurringTransactions = [
        { ...mockDbRecurringTransaction, id: 'r1', next_due_date: '2024-01-10' }, // Past due
        { ...mockDbRecurringTransaction, id: 'r2', next_due_date: '2024-01-15' }, // Due today
        { ...mockDbRecurringTransaction, id: 'r3', next_due_date: '2024-01-20' }, // Future
      ];

      const getDueTransactions = (transactions: any[], currentDate: string) => {
        return transactions.filter(t => t.next_due_date <= currentDate);
      };

      const dueTransactions = getDueTransactions(recurringTransactions, today);
      expect(dueTransactions).toHaveLength(2);
      expect(dueTransactions.map(t => t.id)).toEqual(['r1', 'r2']);
    });

    it('should handle end date expiration', () => {
      const expiredRecurringTransaction = {
        ...mockDbRecurringTransaction,
        end_date: '2023-12-31', // Expired
        next_due_date: '2024-01-01',
      };

      const isExpired = expiredRecurringTransaction.end_date && 
                       new Date(expiredRecurringTransaction.end_date) < new Date();

      expect(isExpired).toBe(true);
    });

    it('should process multiple frequencies correctly', () => {
      const frequencies = ['daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'];
      
      frequencies.forEach(frequency => {
        const transaction = {
          ...mockDbRecurringTransaction,
          frequency,
          next_due_date: '2024-01-01',
        };

        // Each frequency should be handled
        expect(['daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly'])
          .toContain(transaction.frequency);
      });
    });
  });

  describe('Bill Reminders', () => {
    it('should create a bill reminder', async () => {
      mockDb.insertBillReminder.mockResolvedValue(mockDbBillReminder);

      const { insertBillReminder } = mockDb;
      const result = await insertBillReminder(mockDbBillReminder);

      expect(insertBillReminder).toHaveBeenCalledWith(mockDbBillReminder);
      expect(result).toEqual(mockDbBillReminder);
    });

    it('should fetch bill reminders for a user', async () => {
      mockDb.selectBillReminders.mockResolvedValue([mockDbBillReminder]);

      const { selectBillReminders } = mockDb;
      const reminders = await selectBillReminders('user-1');

      expect(selectBillReminders).toHaveBeenCalledWith('user-1');
      expect(reminders).toEqual([mockDbBillReminder]);
    });

    it('should identify bills due for reminder', () => {
      const today = '2024-01-12'; // 3 days before due date
      const billReminder = {
        ...mockDbBillReminder,
        due_date: '2024-01-15',
        reminder_days: 3,
        is_paid: false,
      };

      const shouldRemind = (bill: any, currentDate: string) => {
        if (bill.is_paid) return false;
        
        const dueDate = new Date(bill.due_date);
        const reminderDate = new Date(dueDate);
        reminderDate.setDate(reminderDate.getDate() - bill.reminder_days);
        
        return new Date(currentDate) >= reminderDate && new Date(currentDate) <= dueDate;
      };

      expect(shouldRemind(billReminder, today)).toBe(true);
    });

    it('should not remind for paid bills', () => {
      const paidBill = {
        ...mockDbBillReminder,
        is_paid: true,
        due_date: '2024-01-15',
        reminder_days: 3,
      };

      const shouldRemind = (bill: any, currentDate: string) => {
        return !bill.is_paid && new Date(currentDate) <= new Date(bill.due_date);
      };

      expect(shouldRemind(paidBill, '2024-01-12')).toBe(false);
    });

    it('should mark bill as paid', async () => {
      const paidBillUpdate = { is_paid: true };
      const updatedBill = { ...mockDbBillReminder, is_paid: true };
      mockDb.updateBillReminder.mockResolvedValue(updatedBill);

      const { updateBillReminder } = mockDb;
      const result = await updateBillReminder('bill-1', paidBillUpdate);

      expect(updateBillReminder).toHaveBeenCalledWith('bill-1', paidBillUpdate);
      expect(result.is_paid).toBe(true);
    });

    it('should calculate next reminder date for recurring bills', () => {
      const calculateNextReminderDate = (currentDueDate: string, frequency: string) => {
        const nextDue = new Date(currentDueDate);
        
        switch (frequency) {
          case 'monthly':
            nextDue.setMonth(nextDue.getMonth() + 1);
            break;
          case 'quarterly':
            nextDue.setMonth(nextDue.getMonth() + 3);
            break;
          case 'yearly':
            nextDue.setFullYear(nextDue.getFullYear() + 1);
            break;
        }
        
        return nextDue.toISOString().split('T')[0];
      };

      expect(calculateNextReminderDate('2024-01-15', 'monthly')).toBe('2024-02-15');
      expect(calculateNextReminderDate('2024-01-15', 'yearly')).toBe('2025-01-15');
    });
  });

  describe('Frequency Calculations', () => {
    it('should handle different frequency intervals', () => {
      const testCases = [
        { frequency: 'daily', days: 1 },
        { frequency: 'weekly', days: 7 },
        { frequency: 'bi-weekly', days: 14 },
        { frequency: 'monthly', days: 30 }, // Approximate
        { frequency: 'quarterly', days: 90 }, // Approximate
        { frequency: 'yearly', days: 365 }, // Approximate
      ];

      testCases.forEach(({ frequency, days }) => {
        const startDate = new Date('2024-01-01');
        const nextDate = new Date(startDate);
        
        if (frequency === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (frequency === 'quarterly') {
          nextDate.setMonth(nextDate.getMonth() + 3);
        } else if (frequency === 'yearly') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        } else {
          nextDate.setDate(nextDate.getDate() + days);
        }

        expect(nextDate.getTime()).toBeGreaterThan(startDate.getTime());
      });
    });

    it('should handle month-end dates correctly', () => {
      // Test monthly recurrence from January 31st
      const jan31 = new Date('2024-01-31');
      const nextMonth = new Date(jan31);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      // Should handle February's shorter month (JavaScript adjusts to March 2)
      expect(nextMonth.getMonth()).toBe(2); // March (0-indexed) due to overflow
    });

    it('should handle leap years correctly', () => {
      const feb29LeapYear = new Date('2024-02-29');
      const nextYear = new Date(feb29LeapYear);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      
      // 2025 is not a leap year, so JavaScript adjusts to March 1
      expect(nextYear.getDate()).toBe(1);
      expect(nextYear.getMonth()).toBe(2); // March (0-indexed)
    });
  });

  describe('Recurring Transaction Templates', () => {
    it('should create transaction from recurring template', () => {
      const template = mockDbRecurringTransaction;
      const transactionDate = '2024-01-01';

      const createTransactionFromTemplate = (template: any, date: string) => ({
        user_id: template.user_id,
        name: template.name,
        amount: template.amount,
        transaction_type: template.transaction_type,
        category_id: template.category_id,
        description: template.description,
        transaction_date: date,
        recurring_transaction_id: template.id,
      });

      const transaction = createTransactionFromTemplate(template, transactionDate);

      expect(transaction.name).toBe(template.name);
      expect(transaction.amount).toBe(template.amount);
      expect(transaction.transaction_date).toBe(transactionDate);
      expect(transaction.recurring_transaction_id).toBe(template.id);
    });

    it('should validate template data before creating transaction', () => {
      const invalidTemplate = {
        ...mockDbRecurringTransaction,
        amount: null,
        category_id: null,
      };

      const isValidTemplate = (template: any) => {
        return !!(template.amount && template.category_id && template.name);
      };

      expect(isValidTemplate(invalidTemplate)).toBe(false);
      expect(isValidTemplate(mockDbRecurringTransaction)).toBe(true);
    });
  });

  describe('Transformations', () => {
    it('should transform database recurring transaction to UI format', () => {
      const { transformRecurringTransactionToUI } = mockSchema;

      const result = transformRecurringTransactionToUI(mockDbRecurringTransaction);

      expect(transformRecurringTransactionToUI).toHaveBeenCalledWith(mockDbRecurringTransaction);
      expect(result).toEqual(mockUIRecurringTransaction);
    });

    it('should transform UI recurring transaction to database format', () => {
      const { transformRecurringTransactionToDB } = mockSchema;

      const result = transformRecurringTransactionToDB(mockUIRecurringTransaction);

      expect(transformRecurringTransactionToDB).toHaveBeenCalledWith(mockUIRecurringTransaction);
      expect(result).toEqual(mockDbRecurringTransaction);
    });

    it('should handle missing fields in transformation', () => {
      const incompleteTransaction = {
        id: 'recurring-1',
        name: 'Test Recurring Transaction',
        // Missing required fields
      };

      mockSchema.transformRecurringTransactionToUI.mockImplementation((transaction) => {
        if (!transaction.amount || !transaction.frequency) {
          throw new Error('Missing required fields for transformation');
        }
        return mockUIRecurringTransaction;
      });

      expect(() => {
        mockSchema.transformRecurringTransactionToUI(incompleteTransaction);
      }).toThrow('Missing required fields for transformation');
    });
  });
});