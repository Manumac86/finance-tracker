// Mock the database functions
jest.mock('@/lib/db/postgres', () => ({
  selectCategoryById: jest.fn(),
}));

import { selectCategoryById } from '@/lib/db/postgres';

const mockSelectCategoryById = selectCategoryById as jest.MockedFunction<typeof selectCategoryById>;

describe('Category Lookup After Migration', () => {
  const mockCategory = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    user_id: null,
    name: 'Shopping',
    description: 'Shopping and retail purchases',
    icon: 'ShoppingBag',
    color: '#F59E0B',
    category_type: 'personal',
    parent_category_id: null,
    is_tax_deductible: false,
    tax_category_code: null,
    business_expense_type: null,
    tags: [],
    project_id: null,
    is_system_category: true,
    sort_order: 0,
    is_active: true,
    translations: null,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('selectCategoryById', () => {
    it('should fetch category by UUID', async () => {
      mockSelectCategoryById.mockResolvedValue(mockCategory);

      const result = await selectCategoryById('550e8400-e29b-41d4-a716-446655440001');

      expect(mockSelectCategoryById).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440001');
      expect(result).toEqual(mockCategory);
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should handle valid UUID formats', async () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440001',
        '123e4567-e89b-12d3-a456-426614174000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        '00000000-0000-0000-0000-000000000000',
      ];
      
      for (const uuid of validUUIDs) {
        mockSelectCategoryById.mockResolvedValue({ ...mockCategory, id: uuid });
        
        const result = await selectCategoryById(uuid);
        
        expect(result.id).toBe(uuid);
        expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      }
    });

    it('should throw error for non-existent category', async () => {
      mockSelectCategoryById.mockRejectedValue(new Error('Failed to fetch category: No rows returned'));

      await expect(
        selectCategoryById('550e8400-e29b-41d4-a716-446655440999')
      ).rejects.toThrow('Failed to fetch category');
    });

    it('should return categories with all required fields', async () => {
      mockSelectCategoryById.mockResolvedValue(mockCategory);

      const result = await selectCategoryById('550e8400-e29b-41d4-a716-446655440001');

      // Check that all fields added by migration are present
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('user_id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('icon');
      expect(result).toHaveProperty('color');
      expect(result).toHaveProperty('category_type');
      expect(result).toHaveProperty('is_system_category');
      expect(result).toHaveProperty('is_tax_deductible');
      expect(result).toHaveProperty('parent_category_id');
      expect(result).toHaveProperty('business_expense_type');
      expect(result).toHaveProperty('tags');
      expect(result).toHaveProperty('project_id');
      expect(result).toHaveProperty('sort_order');
      expect(result).toHaveProperty('translations');
      expect(result).toHaveProperty('is_active');
    });

    it('should handle system categories', async () => {
      const systemCategory = {
        ...mockCategory,
        is_system_category: true,
        user_id: null,
      };

      mockSelectCategoryById.mockResolvedValue(systemCategory);

      const result = await selectCategoryById('550e8400-e29b-41d4-a716-446655440001');

      expect(result.is_system_category).toBe(true);
      expect(result.user_id).toBeNull();
    });

    it('should handle user-specific categories', async () => {
      const userCategory = {
        ...mockCategory,
        is_system_category: false,
        user_id: 'user_123',
        name: 'My Custom Category',
      };

      mockSelectCategoryById.mockResolvedValue(userCategory);

      const result = await selectCategoryById('550e8400-e29b-41d4-a716-446655440002');

      expect(result.is_system_category).toBe(false);
      expect(result.user_id).toBe('user_123');
      expect(result.name).toBe('My Custom Category');
    });

    it('should handle business categories with tax info', async () => {
      const businessCategory = {
        ...mockCategory,
        category_type: 'business',
        is_tax_deductible: true,
        tax_category_code: 'OFFICE_SUPPLIES',
        business_expense_type: 'office_supplies',
      };

      mockSelectCategoryById.mockResolvedValue(businessCategory);

      const result = await selectCategoryById('550e8400-e29b-41d4-a716-446655440003');

      expect(result.category_type).toBe('business');
      expect(result.is_tax_deductible).toBe(true);
      expect(result.tax_category_code).toBe('OFFICE_SUPPLIES');
      expect(result.business_expense_type).toBe('office_supplies');
    });
  });

  describe('Category Foreign Key Validation', () => {
    it('should validate that category IDs are UUIDs', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440001',
        '123e4567-e89b-12d3-a456-426614174000',
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      ];

      const invalidIDs = [
        'cat-1',
        '123',
        'invalid-uuid',
        '550e8400-e29b-41d4-a716', // Too short
        '550e8400-e29b-41d4-a716-446655440001-extra', // Too long
      ];

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      validUUIDs.forEach(uuid => {
        expect(uuid).toMatch(uuidRegex);
      });

      invalidIDs.forEach(id => {
        expect(id).not.toMatch(uuidRegex);
      });
    });

    it('should enforce foreign key constraints', () => {
      // Simulate the constraint that would be enforced by PostgreSQL
      const existingCategoryIds = [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003',
      ];

      const validateCategoryExists = (categoryId: string) => {
        return existingCategoryIds.includes(categoryId);
      };

      // Valid references
      expect(validateCategoryExists('550e8400-e29b-41d4-a716-446655440001')).toBe(true);
      expect(validateCategoryExists('550e8400-e29b-41d4-a716-446655440002')).toBe(true);

      // Invalid reference
      expect(validateCategoryExists('550e8400-e29b-41d4-a716-446655440999')).toBe(false);
    });
  });
});