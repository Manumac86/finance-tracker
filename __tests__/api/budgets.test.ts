import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/budgets/route';
import { auth } from '@clerk/nextjs/server';
import * as postgres from '@/lib/db/postgres';

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db/postgres', () => ({
  selectBudgets: jest.fn(),
  insertBudget: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockSelectBudgets = postgres.selectBudgets as jest.MockedFunction<typeof postgres.selectBudgets>;
const mockInsertBudget = postgres.insertBudget as jest.MockedFunction<typeof postgres.insertBudget>;

describe('/api/budgets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/budgets', () => {
    it('should return budgets for authenticated user', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      mockSelectBudgets.mockResolvedValue([
        {
          id: 'budget1',
          user_id: 'user123',
          category_id: 'cat1',
          amount: 500,
          period: 'monthly',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          is_active: true,
          alert_threshold: 0.8,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/budgets');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.budgets).toHaveLength(1);
      expect(data.budgets[0].amount).toBe(500);
      expect(mockSelectBudgets).toHaveBeenCalledWith('user123', undefined);
    });

    it('should filter budgets by period when provided', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      mockSelectBudgets.mockResolvedValue([]);

      const url = new URL('http://localhost:3000/api/budgets?period=monthly');
      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSelectBudgets).toHaveBeenCalledWith('user123', 'monthly');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockReturnValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/budgets');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle database errors', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      mockSelectBudgets.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/budgets');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch budgets');
    });
  });

  describe('POST /api/budgets', () => {
    const validBudgetData = {
      category_id: 'cat123',
      amount: 800,
      period: 'monthly',
      start_date: '2024-01-01',
      alert_threshold: 0.75,
    };

    it('should create a new budget for authenticated user', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      const mockCreatedBudget = {
        ...validBudgetData,
        id: 'budget123',
        user_id: 'user123',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockInsertBudget.mockResolvedValue(mockCreatedBudget);

      const request = new NextRequest('http://localhost:3000/api/budgets', {
        method: 'POST',
        body: JSON.stringify(validBudgetData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.budget.amount).toBe(800);
      expect(mockInsertBudget).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validBudgetData,
          user_id: 'user123',
          is_active: true,
        })
      );
    });

    it('should validate required fields', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });

      const invalidData = {
        // missing category_id
        amount: 500,
        period: 'monthly',
      };

      const request = new NextRequest('http://localhost:3000/api/budgets', {
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

    it('should validate budget period', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });

      const invalidData = {
        category_id: 'cat123',
        amount: 500,
        period: 'invalid_period',
        start_date: '2024-01-01',
      };

      const request = new NextRequest('http://localhost:3000/api/budgets', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid period');
    });

    it('should validate amount is positive', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });

      const invalidData = {
        category_id: 'cat123',
        amount: -100,
        period: 'monthly',
        start_date: '2024-01-01',
      };

      const request = new NextRequest('http://localhost:3000/api/budgets', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('must be positive');
    });

    it('should validate alert threshold range', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });

      const invalidData = {
        category_id: 'cat123',
        amount: 500,
        period: 'monthly',
        start_date: '2024-01-01',
        alert_threshold: 1.5, // Invalid: > 1
      };

      const request = new NextRequest('http://localhost:3000/api/budgets', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('between 0 and 1');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockReturnValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/budgets', {
        method: 'POST',
        body: JSON.stringify(validBudgetData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should handle database errors during creation', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      mockInsertBudget.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/budgets', {
        method: 'POST',
        body: JSON.stringify(validBudgetData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create budget');
    });

    it('should use default values when optional fields are missing', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      const minimalData = {
        category_id: 'cat123',
        amount: 500,
        period: 'monthly',
        start_date: '2024-01-01',
      };

      const mockCreatedBudget = {
        ...minimalData,
        id: 'budget123',
        user_id: 'user123',
        is_active: true,
        alert_threshold: 0.8, // Default value
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockInsertBudget.mockResolvedValue(mockCreatedBudget);

      const request = new NextRequest('http://localhost:3000/api/budgets', {
        method: 'POST',
        body: JSON.stringify(minimalData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(mockInsertBudget).toHaveBeenCalledWith(
        expect.objectContaining({
          alert_threshold: 0.8,
        })
      );
    });
  });
});