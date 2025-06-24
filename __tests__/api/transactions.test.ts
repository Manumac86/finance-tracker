import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/transactions/route';
import { auth } from '@clerk/nextjs/server';
import * as postgres from '@/lib/db/postgres';

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db/postgres', () => ({
  selectTransactions: jest.fn(),
  insertTransaction: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockSelectTransactions = postgres.selectTransactions as jest.MockedFunction<typeof postgres.selectTransactions>;
const mockInsertTransaction = postgres.insertTransaction as jest.MockedFunction<typeof postgres.insertTransaction>;

describe('/api/transactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/transactions', () => {
    it('should return transactions for authenticated user', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      mockSelectTransactions.mockResolvedValue([
        {
          id: 'tx1',
          user_id: 'user123',
          account_id: 'acc1',
          amount: 25.50,
          transaction_type: 'expense',
          category_id: 'cat1',
          description: 'Coffee shop',
          transaction_date: '2024-01-15',
          is_recurring: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.transactions).toHaveLength(1);
      expect(data.transactions[0].description).toBe('Coffee shop');
      expect(mockSelectTransactions).toHaveBeenCalledWith('user123', 50);
    });

    it('should respect limit parameter', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      mockSelectTransactions.mockResolvedValue([]);

      const url = new URL('http://localhost:3000/api/transactions?limit=100');
      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSelectTransactions).toHaveBeenCalledWith('user123', 100);
    });

    it('should enforce maximum limit', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      mockSelectTransactions.mockResolvedValue([]);

      const url = new URL('http://localhost:3000/api/transactions?limit=2000');
      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSelectTransactions).toHaveBeenCalledWith('user123', 1000); // Max limit
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockReturnValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/transactions');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle database errors', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      mockSelectTransactions.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/transactions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch transactions');
    });
  });

  describe('POST /api/transactions', () => {
    const validTransactionData = {
      amount: 45.75,
      transactionType: 'expense',
      name: 'Grocery shopping',
      description: 'Weekly grocery shopping',
      categoryId: 'cat123',
      transactionDate: '2024-01-15T10:00:00.000Z',
    };

    it('should create a new transaction for authenticated user', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      const mockCreatedTransaction = {
        id: 'tx123',
        user_id: 'user123',
        amount: 45.75,
        transaction_type: 'expense',
        name: 'Grocery shopping',
        description: 'Weekly grocery shopping',
        category_id: 'cat123',
        category_name: 'Groceries',
        category_icon: '🛒',
        transaction_date: '2024-01-15T10:00:00.000Z',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockInsertTransaction.mockResolvedValue(mockCreatedTransaction);

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: JSON.stringify(validTransactionData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.transaction.description).toBe('Grocery shopping');
      expect(mockInsertTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validTransactionData,
          user_id: 'user123',
          is_active: true,
        })
      );
    });

    it('should validate required fields', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });

      const invalidData = {
        // missing amount
        transactionType: 'expense',
        name: 'Test transaction',
        categoryId: 'cat123',
      };

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('missing required fields');
    });

    it('should validate transaction type', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });

      const invalidData = {
        amount: 100,
        transactionType: 'invalid_type',
        name: 'Test transaction',
        categoryId: 'cat123',
        transactionDate: '2024-01-15T10:00:00.000Z',
      };

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid enum value');
    });

    it('should validate amount is positive for expenses and income', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });

      const invalidData = {
        amount: 0,
        transactionType: 'expense',
        name: 'Test transaction',
        categoryId: 'cat123',
        transactionDate: '2024-01-15T10:00:00.000Z',
      };

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Amount cannot be zero');
    });

    it('should validate date format', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });

      const invalidData = {
        amount: 100,
        transactionType: 'expense',
        name: 'Test transaction',
        categoryId: 'cat123',
        transactionDate: 'invalid-date',
      };

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid datetime');
    });

    it('should use current date if no date provided', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      const dataWithoutDate = {
        amount: 100,
        transactionType: 'expense',
        name: 'Test transaction',
        categoryId: 'cat123',
      };

      const mockCreatedTransaction = {
        ...dataWithoutDate,
        id: 'tx123',
        user_id: 'user123',
        transaction_date: new Date().toISOString().split('T')[0],
        is_recurring: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockInsertTransaction.mockResolvedValue(mockCreatedTransaction);

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: JSON.stringify(dataWithoutDate),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(mockInsertTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        })
      );
    });

    it('should handle recurring transaction data', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      const recurringData = {
        ...validTransactionData,
        is_recurring: true,
        recurring_rule: {
          frequency: 'monthly',
          interval: 1,
          end_date: '2024-12-31',
        },
      };

      const mockCreatedTransaction = {
        ...recurringData,
        id: 'tx123',
        user_id: 'user123',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockInsertTransaction.mockResolvedValue(mockCreatedTransaction);

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: JSON.stringify(recurringData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.transaction.is_recurring).toBe(true);
      expect(mockInsertTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          is_recurring: true,
          recurring_rule: expect.objectContaining({
            frequency: 'monthly',
            interval: 1,
          }),
        })
      );
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockReturnValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: JSON.stringify(validTransactionData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should handle database errors during creation', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      mockInsertTransaction.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/transactions', {
        method: 'POST',
        body: JSON.stringify(validTransactionData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create transaction');
    });
  });
});