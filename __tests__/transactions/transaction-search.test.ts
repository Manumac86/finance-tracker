/**
 * TDD Tests for US-012: Transaction Search & Management
 * 
 * Acceptance Criteria:
 * - Advanced search and filtering
 * - Bulk transaction editing
 * - Transaction splitting
 * - Duplicate detection
 * - Export capabilities
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { searchTransactions, detectDuplicates, validateBulkEdit, prepareBulkEditPayload, validateSplitTransaction, prepareSplitTransactionPayload } from '@/lib/services/transaction-search';

// Mock data for testing
const mockTransactions = [
  {
    id: '1',
    userId: 'user1',
    name: 'Starbucks Coffee',
    amount: 5.50,
    transactionType: 'expense' as const,
    categoryId: 'cat1',
    description: 'Morning coffee',
    transactionDate: '2024-01-15',
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: '2', 
    userId: 'user1',
    name: 'Salary',
    amount: 3000.00,
    transactionType: 'income' as const,
    categoryId: 'cat2',
    description: 'Monthly salary',
    transactionDate: '2024-01-01',
    createdAt: '2024-01-01T12:00:00Z',
  },
  {
    id: '3',
    userId: 'user1',
    name: 'Starbucks Coffee',
    amount: 5.50,
    transactionType: 'expense' as const,
    categoryId: 'cat1',
    description: 'Morning coffee',
    transactionDate: '2024-01-16',
    createdAt: '2024-01-16T08:15:00Z',
  },
];

describe('Transaction Search Service', () => {
  describe('Advanced Search and Filtering', () => {
    it('should filter transactions by date range', () => {
      const filters = {
        startDate: '2024-01-01',
        endDate: '2024-01-15',
      };
      
      const result = searchTransactions(mockTransactions, filters);
      
      expect(result).toHaveLength(2);
      expect(result.map((t: any) => t.id)).toEqual(['1', '2']);
    });

    it('should filter transactions by amount range', () => {
      const filters = {
        minAmount: 5.00,
        maxAmount: 10.00,
      };
      
      const result = searchTransactions(mockTransactions, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every((t: any) => t.amount >= 5.00 && t.amount <= 10.00)).toBe(true);
    });

    it('should filter transactions by transaction type', () => {
      const filters = {
        transactionType: 'expense' as const,
      };
      
      const result = searchTransactions(mockTransactions, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every((t: any) => t.transactionType === 'expense')).toBe(true);
    });

    it('should filter transactions by category', () => {
      const filters = {
        categoryId: 'cat1',
      };
      
      const result = searchTransactions(mockTransactions, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every((t: any) => t.categoryId === 'cat1')).toBe(true);
    });

    it('should search transactions by text in name or description', () => {
      const filters = {
        searchText: 'coffee',
      };
      
      const result = searchTransactions(mockTransactions, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every((t: any) => 
        t.name.toLowerCase().includes('coffee') || 
        t.description?.toLowerCase().includes('coffee')
      )).toBe(true);
    });

    it('should combine multiple filters', () => {
      const filters = {
        transactionType: 'expense' as const,
        minAmount: 5.00,
        searchText: 'starbucks',
      };
      
      const result = searchTransactions(mockTransactions, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every((t: any) => 
        t.transactionType === 'expense' && 
        t.amount >= 5.00 &&
        t.name.toLowerCase().includes('starbucks')
      )).toBe(true);
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect duplicate transactions', () => {
      const duplicates = detectDuplicates(mockTransactions);
      
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0]).toEqual({
        group: [mockTransactions[0], mockTransactions[2]],
        similarity: expect.any(Number),
        criteria: ['name', 'amount', 'categoryId'],
      });
    });

    it('should group similar transactions by customizable criteria', () => {
      const criteria = ['name', 'amount'];
      const duplicates = detectDuplicates(mockTransactions, criteria);
      
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].criteria).toEqual(criteria);
    });

    it('should calculate similarity score for duplicate groups', () => {
      const duplicates = detectDuplicates(mockTransactions);
      
      expect(duplicates[0].similarity).toBeGreaterThan(0.8);
      expect(duplicates[0].similarity).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Bulk Transaction Operations', () => {
    it('should validate bulk edit data', () => {
      const transactionIds = ['1', '3'];
      const updates = {
        categoryId: 'new-cat',
        description: 'Updated description',
      };
      
      const validation = validateBulkEdit(transactionIds, updates);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid bulk edit operations', () => {
      const transactionIds: string[] = [];
      const updates = {};
      
      const validation = validateBulkEdit(transactionIds, updates);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('No transactions selected');
      expect(validation.errors).toContain('No updates provided');
    });

    it('should prepare bulk edit payload for API', () => {
      const transactionIds = ['1', '3'];
      const updates = {
        categoryId: 'new-cat',
        description: 'Updated description',
      };
      
      const payload = prepareBulkEditPayload(transactionIds, updates);
      
      expect(payload).toEqual({
        transactionIds,
        updates: {
          category_id: 'new-cat',
          description: 'Updated description',
          updated_at: expect.any(String),
        },
      });
    });
  });

  describe('Transaction Splitting', () => {
    it('should validate split transaction data', () => {
      const originalTransaction = mockTransactions[0];
      const splits = [
        { amount: 3.00, categoryId: 'cat1', description: 'Coffee' },
        { amount: 2.50, categoryId: 'cat2', description: 'Tip' },
      ];
      
      const validation = validateSplitTransaction(originalTransaction, splits);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid split amounts', () => {
      const originalTransaction = mockTransactions[0];
      const splits = [
        { amount: 3.00, categoryId: 'cat1', description: 'Coffee' },
        { amount: 3.00, categoryId: 'cat2', description: 'Tip' }, // Total exceeds original
      ];
      
      const validation = validateSplitTransaction(originalTransaction, splits);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Split amounts exceed original transaction amount');
    });

    it('should prepare split transaction payload for API', () => {
      const originalTransaction = mockTransactions[0];
      const splits = [
        { amount: 3.00, categoryId: 'cat1', description: 'Coffee' },
        { amount: 2.50, categoryId: 'cat2', description: 'Tip' },
      ];
      
      const payload = prepareSplitTransactionPayload(originalTransaction, splits);
      
      expect(payload).toEqual({
        originalTransactionId: '1',
        splitTransactions: [
          {
            user_id: 'user1',
            name: 'Starbucks Coffee (Split 1/2)',
            amount: 3.00,
            transaction_type: 'expense',
            category_id: 'cat1',
            description: 'Coffee',
            transaction_date: '2024-01-15',
            is_split: true,
            original_transaction_id: '1',
          },
          {
            user_id: 'user1',
            name: 'Starbucks Coffee (Split 2/2)',
            amount: 2.50,
            transaction_type: 'expense',
            category_id: 'cat2',
            description: 'Tip',
            transaction_date: '2024-01-15',
            is_split: true,
            original_transaction_id: '1',
          },
        ],
      });
    });
  });
});

describe('Transaction Search API', () => {
  it('should handle search requests with filters', async () => {
    // This test will fail until we implement the API endpoint
    const response = await fetch('/api/transactions/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          transactionType: 'expense',
        },
        page: 1,
        limit: 10,
      }),
    });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('transactions');
    expect(data).toHaveProperty('totalCount');
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('totalPages');
  });

  it('should handle bulk edit requests', async () => {
    const response = await fetch('/api/transactions/bulk-edit', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionIds: ['1', '2'],
        updates: {
          categoryId: 'new-cat',
        },
      }),
    });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('updatedCount');
    expect(data.updatedCount).toBe(2);
  });

  it('should handle transaction splitting requests', async () => {
    const response = await fetch('/api/transactions/1/split', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        splits: [
          { amount: 3.00, categoryId: 'cat1', description: 'Coffee' },
          { amount: 2.50, categoryId: 'cat2', description: 'Tip' },
        ],
      }),
    });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('splitTransactions');
    expect(data.splitTransactions).toHaveLength(2);
  });
});