import {
  searchTransactions,
  type SearchCriteria,
  type SearchResult,
  type SortOption,
  type FilterOption,
} from '@/lib/services/transaction-search';

// Mock the database functions
jest.mock('@/lib/db/postgres', () => ({
  query: jest.fn(),
}));

import { query } from '@/lib/db/postgres';
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Transaction Search Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTransactions = [
    {
      id: '1',
      user_id: 'user123',
      amount: 25.50,
      transaction_type: 'expense',
      name: 'Coffee Shop',
      description: 'Morning coffee',
      category_id: 'cat1',
      category_name: 'Food & Dining',
      category_icon: '🍽️',
      transaction_date: '2024-01-15T10:00:00.000Z',
      is_active: true,
      created_at: '2024-01-15T10:00:00.000Z',
      updated_at: '2024-01-15T10:00:00.000Z',
    },
    {
      id: '2',
      user_id: 'user123',
      amount: 1200.00,
      transaction_type: 'income',
      name: 'Salary Payment',
      description: 'Monthly salary',
      category_id: 'cat2',
      category_name: 'Salary',
      category_icon: '💰',
      transaction_date: '2024-01-01T09:00:00.000Z',
      is_active: true,
      created_at: '2024-01-01T09:00:00.000Z',
      updated_at: '2024-01-01T09:00:00.000Z',
    },
  ];

  describe('searchTransactions', () => {
    it('should search transactions with basic text query', async () => {
      mockQuery.mockResolvedValue(mockTransactions);

      const criteria: SearchCriteria = {
        userId: 'user123',
        query: 'coffee',
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);

      expect(mockQuery).toHaveBeenCalled();
      expect(result.transactions).toEqual(mockTransactions);
      expect(result.totalCount).toBe(mockTransactions.length);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    it('should handle empty search results', async () => {
      mockQuery.mockResolvedValue([]);

      const criteria: SearchCriteria = {
        userId: 'user123',
        query: 'nonexistent',
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);

      expect(result.transactions).toEqual([]);
      expect(result.totalCount).toBe(0);
      expect(result.totalPages).toBe(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    it('should search with amount range filter', async () => {
      mockQuery.mockResolvedValue([mockTransactions[0]]);

      const criteria: SearchCriteria = {
        userId: 'user123',
        minAmount: 20,
        maxAmount: 30,
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);

      expect(mockQuery).toHaveBeenCalled();
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].amount).toBe(25.50);
    });

    it('should search with date range filter', async () => {
      mockQuery.mockResolvedValue(mockTransactions);

      const criteria: SearchCriteria = {
        userId: 'user123',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);

      expect(mockQuery).toHaveBeenCalled();
      expect(result.transactions).toEqual(mockTransactions);
    });

    it('should search with category filter', async () => {
      mockQuery.mockResolvedValue([mockTransactions[0]]);

      const criteria: SearchCriteria = {
        userId: 'user123',
        categoryIds: ['cat1'],
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);

      expect(mockQuery).toHaveBeenCalled();
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].category_id).toBe('cat1');
    });

    it('should search with transaction type filter', async () => {
      mockQuery.mockResolvedValue([mockTransactions[1]]);

      const criteria: SearchCriteria = {
        userId: 'user123',
        transactionTypes: ['income'],
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);

      expect(mockQuery).toHaveBeenCalled();
      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].transaction_type).toBe('income');
    });

    it('should handle pagination correctly', async () => {
      const manyTransactions = Array.from({ length: 25 }, (_, i) => ({
        ...mockTransactions[0],
        id: `tx${i}`,
        name: `Transaction ${i}`,
      }));

      mockQuery.mockResolvedValue(manyTransactions);

      const criteria: SearchCriteria = {
        userId: 'user123',
        page: 2,
        limit: 10,
      };

      const result = await searchTransactions(criteria);

      expect(result.page).toBe(2);
      expect(result.totalCount).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(true);
    });

    it('should apply sorting correctly', async () => {
      mockQuery.mockResolvedValue(mockTransactions);

      const criteria: SearchCriteria = {
        userId: 'user123',
        sortBy: 'amount',
        sortOrder: 'desc',
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);

      expect(mockQuery).toHaveBeenCalled();
      expect(result.transactions).toEqual(mockTransactions);
    });

    it('should handle multiple search criteria', async () => {
      mockQuery.mockResolvedValue([mockTransactions[0]]);

      const criteria: SearchCriteria = {
        userId: 'user123',
        query: 'coffee',
        minAmount: 20,
        maxAmount: 30,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        categoryIds: ['cat1'],
        transactionTypes: ['expense'],
        sortBy: 'date',
        sortOrder: 'desc',
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);

      expect(mockQuery).toHaveBeenCalled();
      expect(result.transactions).toHaveLength(1);
    });

    it('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      const criteria: SearchCriteria = {
        userId: 'user123',
        query: 'test',
        page: 1,
        limit: 20,
      };

      await expect(searchTransactions(criteria)).rejects.toThrow('Database connection failed');
    });

    it('should validate page numbers', async () => {
      mockQuery.mockResolvedValue(mockTransactions);

      const criteriaWithInvalidPage: SearchCriteria = {
        userId: 'user123',
        page: 0, // Invalid page
        limit: 20,
      };

      const result = await searchTransactions(criteriaWithInvalidPage);

      // Should default to page 1
      expect(result.page).toBe(1);
    });

    it('should handle limit boundaries', async () => {
      mockQuery.mockResolvedValue(mockTransactions);

      const criteriaWithHighLimit: SearchCriteria = {
        userId: 'user123',
        page: 1,
        limit: 1000, // Very high limit
      };

      await searchTransactions(criteriaWithHighLimit);

      expect(mockQuery).toHaveBeenCalled();
    });

    it('should handle empty user ID', async () => {
      const criteriaWithEmptyUserId: SearchCriteria = {
        userId: '',
        page: 1,
        limit: 20,
      };

      await expect(searchTransactions(criteriaWithEmptyUserId)).rejects.toThrow();
    });

    it('should handle special characters in search query', async () => {
      mockQuery.mockResolvedValue([]);

      const criteria: SearchCriteria = {
        userId: 'user123',
        query: "O'Reilly's Coffee & Tea",
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);

      expect(mockQuery).toHaveBeenCalled();
      expect(result.transactions).toEqual([]);
    });

    it('should handle Unicode characters in search query', async () => {
      mockQuery.mockResolvedValue([]);

      const criteria: SearchCriteria = {
        userId: 'user123',
        query: 'Café München 漢字',
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);

      expect(mockQuery).toHaveBeenCalled();
      expect(result.transactions).toEqual([]);
    });

    it('should handle very long search queries', async () => {
      mockQuery.mockResolvedValue([]);

      const criteria: SearchCriteria = {
        userId: 'user123',
        query: 'a'.repeat(1000),
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);

      expect(mockQuery).toHaveBeenCalled();
      expect(result.transactions).toEqual([]);
    });

    it('should handle negative amounts in range filter', async () => {
      mockQuery.mockResolvedValue([]);

      const criteria: SearchCriteria = {
        userId: 'user123',
        minAmount: -100,
        maxAmount: -50,
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);

      expect(mockQuery).toHaveBeenCalled();
      expect(result.transactions).toEqual([]);
    });

    it('should handle invalid date formats', async () => {
      mockQuery.mockResolvedValue([]);

      const criteria: SearchCriteria = {
        userId: 'user123',
        startDate: 'invalid-date',
        endDate: 'also-invalid',
        page: 1,
        limit: 20,
      };

      // Should handle gracefully or throw appropriate error
      await expect(searchTransactions(criteria)).resolves.toBeDefined();
    });

    it('should handle empty category IDs array', async () => {
      mockQuery.mockResolvedValue(mockTransactions);

      const criteria: SearchCriteria = {
        userId: 'user123',
        categoryIds: [],
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);

      expect(result.transactions).toEqual(mockTransactions);
    });

    it('should handle multiple transaction types', async () => {
      mockQuery.mockResolvedValue(mockTransactions);

      const criteria: SearchCriteria = {
        userId: 'user123',
        transactionTypes: ['income', 'expense'],
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);

      expect(result.transactions).toEqual(mockTransactions);
    });

    it('should calculate pagination metadata correctly for edge cases', async () => {
      // Test with exactly one page of results
      mockQuery.mockResolvedValue(mockTransactions);

      const criteria: SearchCriteria = {
        userId: 'user123',
        page: 1,
        limit: 2, // Exactly matches number of mock transactions
      };

      const result = await searchTransactions(criteria);

      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);
    });

    it('should handle case-insensitive search queries', async () => {
      mockQuery.mockResolvedValue([mockTransactions[0]]);

      const criteria: SearchCriteria = {
        userId: 'user123',
        query: 'COFFEE', // Uppercase version
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);

      expect(mockQuery).toHaveBeenCalled();
      expect(result.transactions).toHaveLength(1);
    });
  });

  describe('search result structure', () => {
    it('should return correct SearchResult structure', async () => {
      mockQuery.mockResolvedValue(mockTransactions);

      const criteria: SearchCriteria = {
        userId: 'user123',
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);

      // Verify all required properties exist
      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('totalPages');
      expect(result).toHaveProperty('hasNextPage');
      expect(result).toHaveProperty('hasPreviousPage');

      // Verify types
      expect(Array.isArray(result.transactions)).toBe(true);
      expect(typeof result.totalCount).toBe('number');
      expect(typeof result.page).toBe('number');
      expect(typeof result.totalPages).toBe('number');
      expect(typeof result.hasNextPage).toBe('boolean');
      expect(typeof result.hasPreviousPage).toBe('boolean');
    });

    it('should maintain transaction object structure', async () => {
      mockQuery.mockResolvedValue([mockTransactions[0]]);

      const criteria: SearchCriteria = {
        userId: 'user123',
        page: 1,
        limit: 20,
      };

      const result = await searchTransactions(criteria);
      const transaction = result.transactions[0];

      // Verify transaction has all expected properties
      expect(transaction).toHaveProperty('id');
      expect(transaction).toHaveProperty('user_id');
      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('transaction_type');
      expect(transaction).toHaveProperty('name');
      expect(transaction).toHaveProperty('description');
      expect(transaction).toHaveProperty('category_id');
      expect(transaction).toHaveProperty('category_name');
      expect(transaction).toHaveProperty('category_icon');
      expect(transaction).toHaveProperty('transaction_date');
      expect(transaction).toHaveProperty('is_active');
      expect(transaction).toHaveProperty('created_at');
      expect(transaction).toHaveProperty('updated_at');
    });
  });
});