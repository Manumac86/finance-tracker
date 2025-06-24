import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/goals/route';
import { auth } from '@clerk/nextjs/server';
import * as postgres from '@/lib/db/postgres';

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db/postgres', () => ({
  selectGoals: jest.fn(),
  insertGoal: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockSelectGoals = postgres.selectGoals as jest.MockedFunction<typeof postgres.selectGoals>;
const mockInsertGoal = postgres.insertGoal as jest.MockedFunction<typeof postgres.insertGoal>;

describe('/api/goals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/goals', () => {
    it('should return goals for authenticated user', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      mockSelectGoals.mockResolvedValue([
        {
          id: 'goal1',
          user_id: 'user123',
          goal_type: 'savings',
          name: 'Emergency Fund',
          target_amount: 5000,
          current_amount: 1500,
          target_date: '2024-12-31',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/goals');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.goals).toHaveLength(1);
      expect(data.goals[0].name).toBe('Emergency Fund');
      expect(mockSelectGoals).toHaveBeenCalledWith('user123', undefined);
    });

    it('should filter goals by type when provided', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      mockSelectGoals.mockResolvedValue([]);

      const url = new URL('http://localhost:3000/api/goals?type=savings');
      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSelectGoals).toHaveBeenCalledWith('user123', 'savings');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockReturnValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/goals');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should handle database errors', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      mockSelectGoals.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/goals');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch goals');
    });
  });

  describe('POST /api/goals', () => {
    const validGoalData = {
      goal_type: 'savings',
      name: 'Vacation Fund',
      target_amount: 3000,
      target_date: '2024-08-31',
    };

    it('should create a new goal for authenticated user', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      const mockCreatedGoal = {
        ...validGoalData,
        id: 'goal123',
        user_id: 'user123',
        current_amount: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockInsertGoal.mockResolvedValue(mockCreatedGoal);

      const request = new NextRequest('http://localhost:3000/api/goals', {
        method: 'POST',
        body: JSON.stringify(validGoalData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.goal.name).toBe('Vacation Fund');
      expect(mockInsertGoal).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validGoalData,
          user_id: 'user123',
          current_amount: 0,
          is_active: true,
        })
      );
    });

    it('should validate required fields', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });

      const invalidData = {
        goal_type: 'savings',
        // missing name
        target_amount: 3000,
      };

      const request = new NextRequest('http://localhost:3000/api/goals', {
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

    it('should validate goal type', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });

      const invalidData = {
        goal_type: 'invalid_type',
        name: 'Test Goal',
        target_amount: 1000,
      };

      const request = new NextRequest('http://localhost:3000/api/goals', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid goal_type');
    });

    it('should validate target amount is positive', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });

      const invalidData = {
        goal_type: 'savings',
        name: 'Test Goal',
        target_amount: -100,
      };

      const request = new NextRequest('http://localhost:3000/api/goals', {
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

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockReturnValue({ userId: null });

      const request = new NextRequest('http://localhost:3000/api/goals', {
        method: 'POST',
        body: JSON.stringify(validGoalData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should handle database errors during creation', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      mockInsertGoal.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/goals', {
        method: 'POST',
        body: JSON.stringify(validGoalData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create goal');
    });

    it('should handle invalid JSON', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });

      const request = new NextRequest('http://localhost:3000/api/goals', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid JSON');
    });
  });
});