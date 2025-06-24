import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/categories/route';
import { auth } from '@clerk/nextjs/server';
import * as postgres from '@/lib/db/postgres';

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db/postgres', () => ({
  selectCategories: jest.fn(),
  insertCategory: jest.fn(),
}));

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockSelectCategories = postgres.selectCategories as jest.MockedFunction<typeof postgres.selectCategories>;
const mockInsertCategory = postgres.insertCategory as jest.MockedFunction<typeof postgres.insertCategory>;

describe('/api/categories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/categories', () => {
    it('should return categories for authenticated user', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      mockSelectCategories.mockResolvedValue([
        {
          id: 'cat1',
          user_id: 'user123',
          name: 'Food & Dining',
          icon: '🍽️',
          color: '#FF6B6B',
          category_type: 'expense',
          parent_category_id: null,
          is_default: false,
          is_business: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/categories');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.categories).toHaveLength(1);
      expect(data.categories[0].name).toBe('Food & Dining');
      expect(mockSelectCategories).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      mockSelectCategories.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/categories');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch categories');
    });
  });

  describe('POST /api/categories', () => {
    const validCategoryData = {
      name: 'Entertainment',
      icon: '🎬',
      color: '#9B59B6',
      category_type: 'expense',
    };

    it('should create a new category', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      const mockCreatedCategory = {
        ...validCategoryData,
        id: 'cat123',
        user_id: 'user123',
        parent_category_id: null,
        is_default: false,
        is_business: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockInsertCategory.mockResolvedValue(mockCreatedCategory);

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify(validCategoryData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.category.name).toBe('Entertainment');
      expect(mockInsertCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validCategoryData,
          is_active: true,
        })
      );
    });

    it('should validate required fields', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });

      const invalidData = {
        // missing name
        icon: '🎬',
        color: '#9B59B6',
        category_type: 'expense',
      };

      const request = new NextRequest('http://localhost:3000/api/categories', {
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

    it('should validate category type', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });

      const invalidData = {
        name: 'Test Category',
        icon: '🎬',
        color: '#9B59B6',
        category_type: 'invalid_type',
      };

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid category_type');
    });

    it('should handle database errors during creation', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      mockInsertCategory.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify(validCategoryData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create category');
    });

    it('should use default values for optional fields', async () => {
      mockAuth.mockReturnValue({ userId: 'user123' });
      const minimalData = {
        name: 'Test Category',
        category_type: 'expense',
      };

      const mockCreatedCategory = {
        ...minimalData,
        id: 'cat123',
        user_id: 'user123',
        icon: '📂', // Default icon
        color: '#6C757D', // Default color
        parent_category_id: null,
        is_default: false,
        is_business: false,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockInsertCategory.mockResolvedValue(mockCreatedCategory);

      const request = new NextRequest('http://localhost:3000/api/categories', {
        method: 'POST',
        body: JSON.stringify(minimalData),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(mockInsertCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: '📂',
          color: '#6C757D',
        })
      );
    });
  });
});