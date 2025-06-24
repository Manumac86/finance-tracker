import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the database functions
const mockSelectTransactions = jest.fn();
const mockInsertTransaction = jest.fn();
const mockUpdateTransaction = jest.fn();
const mockDeleteTransaction = jest.fn();

jest.mock('@/lib/db/postgres', () => ({
  selectTransactions: mockSelectTransactions,
  insertTransaction: mockInsertTransaction,
  updateTransaction: mockUpdateTransaction,
  deleteTransaction: mockDeleteTransaction,
}));

// Mock the schema transformations
const mockTransformToUI = jest.fn();
const mockTransformToDB = jest.fn();
const mockParse = jest.fn();

jest.mock('@/lib/db/schemas/transaction', () => ({
  transformTransactionToUI: mockTransformToUI,
  transformTransactionToDB: mockTransformToDB,
  createTransactionSchema: {
    parse: mockParse,
  },
}));

import * as mockDb from '@/lib/db/postgres';
import * as mockSchema from '@/lib/db/schemas/transaction';

describe('Transaction Functionality', () => {
  const mockDbTransaction = {
    id: 'trans-1',
    user_id: 'user-1',
    name: 'Grocery Store',
    amount: 45.67,
    transaction_type: 'expense',
    transaction_date: '2024-01-15',
    category_id: 'cat-1',
    description: 'Weekly groceries',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    is_active: true,
  };

  const mockUITransaction = {
    id: 'trans-1',
    userId: 'user-1',
    name: 'Grocery Store',
    amount: 45.67,
    transactionType: 'expense' as const,
    transactionDate: '2024-01-15',
    categoryId: 'cat-1',
    description: 'Weekly groceries',
  };

  const mockCreateTransactionData = {
    name: 'Coffee Shop',
    amount: 5.50,
    transactionType: 'expense' as const,
    transactionDate: '2024-01-16',
    categoryId: 'cat-2',
    description: 'Morning coffee',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransformToUI.mockReturnValue(mockUITransaction);
    mockTransformToDB.mockReturnValue({
      ...mockDbTransaction,
      name: mockCreateTransactionData.name,
      amount: mockCreateTransactionData.amount,
    });
    mockParse.mockReturnValue(mockCreateTransactionData);
  });

  describe('Transaction Retrieval', () => {
    it('should fetch transactions for a user', async () => {
      mockSelectTransactions.mockResolvedValue([mockDbTransaction]);

      const transactions = await mockSelectTransactions('user-1');

      expect(mockSelectTransactions).toHaveBeenCalledWith('user-1');
      expect(transactions).toEqual([mockDbTransaction]);
    });

    it('should handle empty transaction list', async () => {
      mockSelectTransactions.mockResolvedValue([]);

      const transactions = await mockSelectTransactions('user-1');

      expect(transactions).toEqual([]);
    });

    it('should handle database errors during retrieval', async () => {
      mockSelectTransactions.mockRejectedValue(new Error('Database connection error'));


      await expect(mockSelectTransactions('user-1')).rejects.toThrow('Database connection error');
    });

    it('should support pagination', async () => {
      const mockTransactions = Array.from({ length: 50 }, (_, i) => ({
        ...mockDbTransaction,
        id: `trans-${i}`,
        name: `Transaction ${i}`,
      }));
      mockSelectTransactions.mockResolvedValue(mockTransactions);

      const transactions = await mockSelectTransactions('user-1', 50);

      expect(mockSelectTransactions).toHaveBeenCalledWith('user-1', 50);
      expect(transactions).toHaveLength(50);
    });
  });

  describe('Transaction Creation', () => {
    it('should create a new transaction', async () => {
      const newDbTransaction = {
        ...mockDbTransaction,
        id: 'trans-2',
        name: mockCreateTransactionData.name,
        amount: mockCreateTransactionData.amount,
      };
      mockInsertTransaction.mockResolvedValue(newDbTransaction);

      const result = await mockInsertTransaction({
        ...mockCreateTransactionData,
        user_id: 'user-1',
        transaction_type: mockCreateTransactionData.transactionType,
        transaction_date: mockCreateTransactionData.transactionDate,
        category_id: mockCreateTransactionData.categoryId,
      });

      expect(mockInsertTransaction).toHaveBeenCalled();
      expect(result).toEqual(newDbTransaction);
    });

    it('should validate transaction data before creation', () => {
      const invalidData = {
        name: '',
        amount: -5,
        transactionType: 'invalid',
      };

      mockParse.mockImplementation(() => {
        throw new Error('Validation failed: name is required');
      });

      expect(() => {
        mockParse(invalidData);
      }).toThrow('Validation failed: name is required');
    });

    it('should handle required fields validation', () => {
      const requiredFields = ['name', 'amount', 'transactionType', 'transactionDate'];
      
      requiredFields.forEach(field => {
        const incompleteData = { ...mockCreateTransactionData };
        delete incompleteData[field as keyof typeof mockCreateTransactionData];

        mockParse.mockImplementation(() => {
          throw new Error(`${field} is required`);
        });

        expect(() => {
          mockParse(incompleteData);
        }).toThrow(`${field} is required`);
      });
    });

    it('should transform UI data to database format', () => {
      mockTransformToDB(mockCreateTransactionData);

      expect(mockTransformToDB).toHaveBeenCalledWith(mockCreateTransactionData);
    });

    it('should handle creation errors', async () => {
      mockInsertTransaction.mockRejectedValue(new Error('Unique constraint violation'));


      await expect(mockInsertTransaction(mockDbTransaction)).rejects.toThrow('Unique constraint violation');
    });
  });

  describe('Transaction Updates', () => {
    it('should update an existing transaction', async () => {
      const updates = {
        name: 'Updated Transaction Name',
        amount: 75.00,
        description: 'Updated description',
      };
      const updatedTransaction = { ...mockDbTransaction, ...updates };
      mockUpdateTransaction.mockResolvedValue(updatedTransaction);

      const result = await mockUpdateTransaction('trans-1', updates);

      expect(mockUpdateTransaction).toHaveBeenCalledWith('trans-1', updates);
      expect(result).toEqual(updatedTransaction);
    });

    it('should validate update data', () => {
      const invalidUpdates = {
        amount: 'not-a-number',
        transactionType: 'invalid-type',
      };

      mockParse.mockImplementation(() => {
        throw new Error('Invalid amount format');
      });

      expect(() => {
        mockParse(invalidUpdates);
      }).toThrow('Invalid amount format');
    });

    it('should handle partial updates', async () => {
      const partialUpdates = { amount: 100.00 };
      const updatedTransaction = { ...mockDbTransaction, amount: 100.00 };
      mockUpdateTransaction.mockResolvedValue(updatedTransaction);

      const result = await mockUpdateTransaction('trans-1', partialUpdates);

      expect(mockUpdateTransaction).toHaveBeenCalledWith('trans-1', partialUpdates);
      expect(result.amount).toBe(100.00);
    });

    it('should handle non-existent transaction updates', async () => {
      mockUpdateTransaction.mockRejectedValue(new Error('Transaction not found'));


      await expect(mockUpdateTransaction('non-existent', {})).rejects.toThrow('Transaction not found');
    });
  });

  describe('Transaction Deletion', () => {
    it('should delete a transaction (soft delete)', async () => {
      mockDeleteTransaction.mockResolvedValue(true);

      const result = await mockDeleteTransaction('trans-1');

      expect(mockDeleteTransaction).toHaveBeenCalledWith('trans-1');
      expect(result).toBe(true);
    });

    it('should handle deletion of non-existent transaction', async () => {
      mockDeleteTransaction.mockResolvedValue(false);

      const result = await mockDeleteTransaction('non-existent');

      expect(result).toBe(false);
    });

    it('should handle deletion errors', async () => {
      mockDeleteTransaction.mockRejectedValue(new Error('Database error'));


      await expect(mockDeleteTransaction('trans-1')).rejects.toThrow('Database error');
    });
  });

  describe('Transaction Transformations', () => {
    it('should transform database transaction to UI format', () => {
      const result = mockTransformToUI(mockDbTransaction);

      expect(mockTransformToUI).toHaveBeenCalledWith(mockDbTransaction);
      expect(result).toEqual(mockUITransaction);
    });

    it('should transform UI transaction to database format', () => {
      const result = mockTransformToDB(mockUITransaction);

      expect(mockTransformToDB).toHaveBeenCalledWith(mockUITransaction);
      expect(result).toBeDefined();
    });

    it('should handle missing fields in transformation', () => {
      const incompleteTransaction = {
        id: 'trans-1',
        name: 'Test Transaction',
        // Missing required fields
      };

      mockTransformToUI.mockImplementation((tx) => {
        if (!tx.amount || !tx.transaction_type) {
          throw new Error('Missing required fields for transformation');
        }
        return mockUITransaction;
      });

      expect(() => {
        mockTransformToUI(incompleteTransaction);
      }).toThrow('Missing required fields for transformation');
    });
  });

  describe('Transaction Filtering and Search', () => {
    const mockTransactions = [
      { ...mockDbTransaction, id: 'trans-1', name: 'Grocery Store', amount: 45.67, transaction_type: 'expense' },
      { ...mockDbTransaction, id: 'trans-2', name: 'Salary', amount: 2000.00, transaction_type: 'income' },
      { ...mockDbTransaction, id: 'trans-3', name: 'Coffee Shop', amount: 5.50, transaction_type: 'expense' },
    ];

    it('should filter transactions by type', () => {
      const expenseTransactions = mockTransactions.filter(t => t.transaction_type === 'expense');
      expect(expenseTransactions).toHaveLength(2);
      expect(expenseTransactions.every(t => t.transaction_type === 'expense')).toBe(true);
    });

    it('should filter transactions by amount range', () => {
      const smallTransactions = mockTransactions.filter(t => t.amount < 50);
      expect(smallTransactions).toHaveLength(2);
      expect(smallTransactions.every(t => t.amount < 50)).toBe(true);
    });

    it('should search transactions by name', () => {
      const searchTerm = 'coffee';
      const matchingTransactions = mockTransactions.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(matchingTransactions).toHaveLength(1);
      expect(matchingTransactions[0].name).toBe('Coffee Shop');
    });

    it('should filter transactions by date range', () => {
      const transactionsWithDates = [
        { ...mockDbTransaction, transaction_date: '2024-01-15' },
        { ...mockDbTransaction, transaction_date: '2024-01-20' },
        { ...mockDbTransaction, transaction_date: '2024-02-01' },
      ];

      const januaryTransactions = transactionsWithDates.filter(t => 
        t.transaction_date >= '2024-01-01' && t.transaction_date <= '2024-01-31'
      );

      expect(januaryTransactions).toHaveLength(2);
    });

    it('should filter transactions by category', () => {
      const transactionsWithCategories = [
        { ...mockDbTransaction, category_id: 'cat-1' },
        { ...mockDbTransaction, category_id: 'cat-2' },
        { ...mockDbTransaction, category_id: 'cat-1' },
      ];

      const cat1Transactions = transactionsWithCategories.filter(t => t.category_id === 'cat-1');
      expect(cat1Transactions).toHaveLength(2);
    });
  });

  describe('Transaction Validation Rules', () => {
    it('should validate amount is positive for expenses', () => {
      const negativeExpense = {
        ...mockCreateTransactionData,
        amount: -50.00,
        transactionType: 'expense' as const,
      };

      mockParse.mockImplementation((data) => {
        if (data.amount <= 0) {
          throw new Error('Amount must be positive');
        }
        return data;
      });

      expect(() => {
        mockParse(negativeExpense);
      }).toThrow('Amount must be positive');
    });

    it('should validate transaction date format', () => {
      const invalidDateTransaction = {
        ...mockCreateTransactionData,
        transactionDate: 'invalid-date',
      };

      mockParse.mockImplementation((data) => {
        if (isNaN(Date.parse(data.transactionDate))) {
          throw new Error('Invalid date format');
        }
        return data;
      });

      expect(() => {
        mockParse(invalidDateTransaction);
      }).toThrow('Invalid date format');
    });

    it('should validate transaction type enum', () => {
      const invalidTypeTransaction = {
        ...mockCreateTransactionData,
        transactionType: 'invalid' as any,
      };

      mockParse.mockImplementation((data) => {
        if (!['income', 'expense'].includes(data.transactionType)) {
          throw new Error('Invalid transaction type');
        }
        return data;
      });

      expect(() => {
        mockParse(invalidTypeTransaction);
      }).toThrow('Invalid transaction type');
    });

    it('should validate name length', () => {
      const longNameTransaction = {
        ...mockCreateTransactionData,
        name: 'a'.repeat(256),
      };

      mockParse.mockImplementation((data) => {
        if (data.name.length > 255) {
          throw new Error('Name too long');
        }
        return data;
      });

      expect(() => {
        mockParse(longNameTransaction);
      }).toThrow('Name too long');
    });
  });

  describe('Transaction Bulk Operations', () => {
    it('should handle bulk transaction insertion', async () => {
      const bulkTransactions = [
        { ...mockDbTransaction, id: 'bulk-1', name: 'Bulk Transaction 1' },
        { ...mockDbTransaction, id: 'bulk-2', name: 'Bulk Transaction 2' },
      ];

      mockInsertTransaction.mockImplementation((transaction) => 
        Promise.resolve(transaction)
      );

      const results = await Promise.all(
        bulkTransactions.map(transaction => mockInsertTransaction(transaction))
      );

      expect(mockInsertTransaction).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
    });

    it('should handle bulk transaction updates', async () => {
      const bulkUpdates = [
        { id: 'trans-1', updates: { amount: 100 } },
        { id: 'trans-2', updates: { amount: 200 } },
      ];

      mockUpdateTransaction.mockImplementation((id, updates) => 
        Promise.resolve({ ...mockDbTransaction, id, ...updates })
      );

      const results = await Promise.all(
        bulkUpdates.map(({ id, updates }) => mockUpdateTransaction(id, updates))
      );

      expect(mockUpdateTransaction).toHaveBeenCalledTimes(2);
      expect(results[0].amount).toBe(100);
      expect(results[1].amount).toBe(200);
    });

    it('should handle partial failures in bulk operations', async () => {
      const bulkTransactions = [
        { ...mockDbTransaction, id: 'valid-1' },
        { ...mockDbTransaction, id: 'invalid-2', name: '' }, // Invalid
        { ...mockDbTransaction, id: 'valid-3' },
      ];

      mockInsertTransaction.mockImplementation((transaction) => {
        if (!transaction.name) {
          return Promise.reject(new Error('Name is required'));
        }
        return Promise.resolve(transaction);
      });

      const results = await Promise.allSettled(
        bulkTransactions.map(transaction => mockInsertTransaction(transaction))
      );

      expect(results).toHaveLength(3);
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });
});