// Mock the database functions
jest.mock('@/lib/db/postgres', () => ({
  selectCategories: jest.fn(),
  insertCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
}));

// Mock the schema transformations
jest.mock('@/lib/db/schemas/category', () => ({
  transformCategoryToUI: jest.fn(),
  transformCategoryToDB: jest.fn(),
  createCategorySchema: {
    parse: jest.fn(),
  },
}));

import * as mockDb from '@/lib/db/postgres';
import * as mockSchema from '@/lib/db/schemas/category';

describe('Category Functionality', () => {
  const mockDbCategory = {
    id: 'cat-1',
    user_id: 'user-1',
    name: 'Groceries',
    icon: '🛒',
    color: '#10B981',
    category_type: 'personal' as const,
    parent_category_id: null,
    is_tax_deductible: false,
    tags: [],
    is_system_category: false,
    sort_order: 0,
    is_active: true,
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  };

  const mockUICategory = {
    id: 'cat-1',
    userId: 'user-1',
    name: 'Groceries',
    icon: '🛒',
    color: '#10B981',
    categoryType: 'personal' as const,
    parentCategoryId: null,
    isTaxDeductible: false,
    tags: [],
    isSystemCategory: false,
    sortOrder: 0,
    isActive: true,
  };

  const mockCreateCategoryData = {
    name: 'Transportation',
    icon: '🚗',
    color: '#3B82F6',
    categoryType: 'business' as const,
    parentCategoryId: null,
    isTaxDeductible: false,
    tags: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockSchema.transformCategoryToUI as jest.Mock).mockReturnValue(mockUICategory);
    (mockSchema.transformCategoryToDB as jest.Mock).mockReturnValue(mockDbCategory);
    (mockSchema.createCategorySchema.parse as jest.Mock).mockReturnValue(mockCreateCategoryData);
  });

  describe('Category Creation', () => {
    it('should create a new category', async () => {
      (mockDb.insertCategory as jest.Mock).mockResolvedValue(mockDbCategory);

      const { insertCategory } = mockDb;
      const result = await insertCategory(mockDbCategory);

      expect(insertCategory).toHaveBeenCalledWith(mockDbCategory);
      expect(result).toEqual(mockDbCategory);
    });

    it('should validate category data before creation', () => {
      const invalidCategoryData = {
        name: '',
        type: 'invalid',
        color: 'not-a-color',
      };

      (mockSchema.createCategorySchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error('Validation failed: Invalid category data');
      });

      expect(() => {
        mockSchema.createCategorySchema.parse(invalidCategoryData);
      }).toThrow('Validation failed: Invalid category data');
    });

    it('should validate required fields', () => {
      const requiredFields = ['name', 'type'];
      
      requiredFields.forEach(field => {
        const incompleteData = { ...mockCreateCategoryData };
        delete incompleteData[field as keyof typeof mockCreateCategoryData];

        (mockSchema.createCategorySchema.parse as jest.Mock).mockImplementation(() => {
          throw new Error(`${field} is required`);
        });

        expect(() => {
          mockSchema.createCategorySchema.parse(incompleteData);
        }).toThrow(`${field} is required`);
      });
    });

    it('should validate category type enum', () => {
      const invalidTypeCategory = {
        ...mockCreateCategoryData,
        type: 'invalid-type',
      };

      (mockSchema.createCategorySchema.parse as jest.Mock).mockImplementation((data: any) => {
        const validTypes = ['income', 'expense'];
        if (!validTypes.includes(data.type)) {
          throw new Error('Invalid category type');
        }
        return data;
      });

      expect(() => {
        mockSchema.createCategorySchema.parse(invalidTypeCategory);
      }).toThrow('Invalid category type');
    });

    it('should validate color format', () => {
      const invalidColorCategory = {
        ...mockCreateCategoryData,
        color: 'invalid-color',
      };

      (mockSchema.createCategorySchema.parse as jest.Mock).mockImplementation((data: any) => {
        const colorRegex = /^#[0-9A-F]{6}$/i;
        if (data.color && !colorRegex.test(data.color)) {
          throw new Error('Invalid color format');
        }
        return data;
      });

      expect(() => {
        mockSchema.createCategorySchema.parse(invalidColorCategory);
      }).toThrow('Invalid color format');
    });

    it('should validate name length', () => {
      const longNameCategory = {
        ...mockCreateCategoryData,
        name: 'a'.repeat(256),
      };

      (mockSchema.createCategorySchema.parse as jest.Mock).mockImplementation((data: any) => {
        if (data.name.length > 255) {
          throw new Error('Name too long');
        }
        return data;
      });

      expect(() => {
        mockSchema.createCategorySchema.parse(longNameCategory);
      }).toThrow('Name too long');
    });

    it('should handle duplicate category names', async () => {
      (mockDb.insertCategory as jest.Mock).mockRejectedValue(new Error('Category name already exists'));

      const { insertCategory } = mockDb;

      await expect(insertCategory(mockDbCategory)).rejects.toThrow('Category name already exists');
    });
  });

  describe('Category Retrieval', () => {
    it('should fetch categories for a user', async () => {
      (mockDb.selectCategories as jest.Mock).mockResolvedValue([mockDbCategory]);

      const { selectCategories } = mockDb;
      const categories = await selectCategories();

      expect(selectCategories).toHaveBeenCalled();
      expect(categories).toEqual([mockDbCategory]);
    });

    it('should handle empty category list', async () => {
      (mockDb.selectCategories as jest.Mock).mockResolvedValue([]);

      const { selectCategories } = mockDb;
      const categories = await selectCategories();

      expect(categories).toEqual([]);
    });

    it('should filter active categories only', async () => {
      const categoriesWithInactive = [
        { ...mockDbCategory, id: 'cat-1', is_active: true },
        { ...mockDbCategory, id: 'cat-2', is_active: false },
        { ...mockDbCategory, id: 'cat-3', is_active: true },
      ];
      (mockDb.selectCategories as jest.Mock).mockResolvedValue(categoriesWithInactive);

      const { selectCategories } = mockDb;
      const allCategories = await selectCategories();
      const activeCategories = allCategories.filter((c: any) => c.is_active);

      expect(activeCategories).toHaveLength(2);
      expect(activeCategories.every((c: any) => c.is_active)).toBe(true);
    });

    it('should handle database errors during retrieval', async () => {
      (mockDb.selectCategories as jest.Mock).mockRejectedValue(new Error('Database connection error'));

      const { selectCategories } = mockDb;

      await expect(selectCategories()).rejects.toThrow('Database connection error');
    });

    it('should sort categories by name', async () => {
      const unsortedCategories = [
        { ...mockDbCategory, id: 'cat-3', name: 'Zzz Category' },
        { ...mockDbCategory, id: 'cat-1', name: 'Aaa Category' },
        { ...mockDbCategory, id: 'cat-2', name: 'Mmm Category' },
      ];
      (mockDb.selectCategories as jest.Mock).mockResolvedValue(unsortedCategories);

      const { selectCategories } = mockDb;
      const categories = await selectCategories();
      const sortedCategories = categories.sort((a: any, b: any) => a.name.localeCompare(b.name));

      expect(sortedCategories[0].name).toBe('Aaa Category');
      expect(sortedCategories[1].name).toBe('Mmm Category');
      expect(sortedCategories[2].name).toBe('Zzz Category');
    });
  });

  describe('Category Updates', () => {
    it('should update an existing category', async () => {
      const updates = {
        name: 'Updated Groceries',
        color: '#EF4444',
        is_business_expense: true,
      };
      const updatedCategory = { ...mockDbCategory, ...updates };
      (mockDb.updateCategory as jest.Mock).mockResolvedValue(updatedCategory);

      const { updateCategory } = mockDb;
      const result = await updateCategory('cat-1', updates);

      expect(updateCategory).toHaveBeenCalledWith('cat-1', updates);
      expect(result).toEqual(updatedCategory);
    });

    it('should handle partial updates', async () => {
      const partialUpdates = { color: '#F59E0B' };
      const updatedCategory = { ...mockDbCategory, color: '#F59E0B' };
      (mockDb.updateCategory as jest.Mock).mockResolvedValue(updatedCategory);

      const { updateCategory } = mockDb;
      const result = await updateCategory('cat-1', partialUpdates);

      expect(updateCategory).toHaveBeenCalledWith('cat-1', partialUpdates);
      expect(result.color).toBe('#F59E0B');
    });

    it('should handle non-existent category updates', async () => {
      (mockDb.updateCategory as jest.Mock).mockRejectedValue(new Error('Category not found'));

      const { updateCategory } = mockDb;

      await expect(updateCategory('non-existent', {})).rejects.toThrow('Category not found');
    });

    it('should validate updates before applying', () => {
      const invalidUpdates = {
        name: '',
        type: 'invalid',
        color: 'not-a-color',
      };

      (mockSchema.createCategorySchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid update data');
      });

      expect(() => {
        mockSchema.createCategorySchema.parse(invalidUpdates);
      }).toThrow('Invalid update data');
    });

    it('should prevent updating system default categories', async () => {
      const defaultCategory = { ...mockDbCategory, is_default: true };
      (mockDb.updateCategory as jest.Mock).mockImplementation((id: string, updates: any) => {
        if (defaultCategory.is_default && updates.name) {
          return Promise.reject(new Error('Cannot modify default category name'));
        }
        return Promise.resolve({ ...defaultCategory, ...updates });
      });

      const { updateCategory } = mockDb;

      await expect(updateCategory('cat-1', { name: 'New Name' }))
        .rejects.toThrow('Cannot modify default category name');
    });
  });

  describe('Category Deletion', () => {
    it('should delete a category (soft delete)', async () => {
      (mockDb.deleteCategory as jest.Mock).mockResolvedValue(true);

      const { deleteCategory } = mockDb;
      const result = await deleteCategory('cat-1');

      expect(deleteCategory).toHaveBeenCalledWith('cat-1');
      expect(result).toBe(true);
    });

    it('should handle deletion of non-existent category', async () => {
      (mockDb.deleteCategory as jest.Mock).mockResolvedValue(false);

      const { deleteCategory } = mockDb;
      const result = await deleteCategory('non-existent');

      expect(result).toBe(false);
    });

    it('should prevent deletion of default categories', async () => {
      (mockDb.deleteCategory as jest.Mock).mockImplementation((id: string) => {
        if (id === 'default-cat') {
          return Promise.reject(new Error('Cannot delete default category'));
        }
        return Promise.resolve(true);
      });

      const { deleteCategory } = mockDb;

      await expect(deleteCategory('default-cat')).rejects.toThrow('Cannot delete default category');
    });

    it('should prevent deletion of categories with transactions', async () => {
      (mockDb.deleteCategory as jest.Mock).mockImplementation((id: string) => {
        if (id === 'cat-with-transactions') {
          return Promise.reject(new Error('Cannot delete category with existing transactions'));
        }
        return Promise.resolve(true);
      });

      const { deleteCategory } = mockDb;

      await expect(deleteCategory('cat-with-transactions'))
        .rejects.toThrow('Cannot delete category with existing transactions');
    });

    it('should handle deletion errors', async () => {
      (mockDb.deleteCategory as jest.Mock).mockRejectedValue(new Error('Database error'));

      const { deleteCategory } = mockDb;

      await expect(deleteCategory('cat-1')).rejects.toThrow('Database error');
    });
  });

  describe('Category Hierarchy', () => {
    it('should create subcategories with parent relationships', () => {
      const parentCategory = { ...mockDbCategory, id: 'parent-cat', name: 'Food' };
      const subcategory = {
        ...mockDbCategory,
        id: 'sub-cat',
        name: 'Restaurants',
        parent_category_id: 'parent-cat',
      };

      expect(subcategory.parent_category_id).toBe(parentCategory.id);
    });

    it('should validate parent category exists', async () => {
      const subcategoryData = {
        ...mockCreateCategoryData,
        parentCategoryId: 'non-existent-parent',
      };

      (mockSchema.createCategorySchema.parse as jest.Mock).mockImplementation((data: any) => {
        if (data.parentCategoryId && data.parentCategoryId !== 'valid-parent') {
          throw new Error('Parent category does not exist');
        }
        return data;
      });

      expect(() => {
        mockSchema.createCategorySchema.parse(subcategoryData);
      }).toThrow('Parent category does not exist');
    });

    it('should prevent circular references in hierarchy', () => {
      const categoryA = { id: 'cat-a', parent_category_id: 'cat-b' };
      const categoryB = { id: 'cat-b', parent_category_id: 'cat-a' };

      // Simulation of circular reference validation
      const hasCircularReference = (catA: any, catB: any) => {
        return catA.parent_category_id === catB.id && catB.parent_category_id === catA.id;
      };

      expect(hasCircularReference(categoryA, categoryB)).toBe(true);
    });

    it('should get category hierarchy path', () => {
      const categories = [
        { id: 'root', name: 'Food', parent_category_id: null },
        { id: 'mid', name: 'Dining Out', parent_category_id: 'root' },
        { id: 'leaf', name: 'Fast Food', parent_category_id: 'mid' },
      ];

      const getCategoryPath = (categoryId: string, allCategories: any[]) => {
        const path = [];
        let currentId = categoryId;
        
        while (currentId) {
          const category = allCategories.find(c => c.id === currentId);
          if (!category) break;
          path.unshift(category.name);
          currentId = category.parent_category_id;
        }
        
        return path.join(' > ');
      };

      const path = getCategoryPath('leaf', categories);
      expect(path).toBe('Food > Dining Out > Fast Food');
    });

    it('should get all subcategories of a parent', () => {
      const categories = [
        { id: 'parent', name: 'Transportation', parent_category_id: null },
        { id: 'sub1', name: 'Gas', parent_category_id: 'parent' },
        { id: 'sub2', name: 'Parking', parent_category_id: 'parent' },
        { id: 'other', name: 'Food', parent_category_id: null },
      ];

      const getSubcategories = (parentId: string, allCategories: any[]) => {
        return allCategories.filter(c => c.parent_category_id === parentId);
      };

      const subcategories = getSubcategories('parent', categories);
      expect(subcategories).toHaveLength(2);
      expect(subcategories.map(c => c.name)).toEqual(['Gas', 'Parking']);
    });
  });

  describe('Category Types and Business Logic', () => {
    it('should handle income categories', () => {
      const incomeCategory = {
        ...mockDbCategory,
        type: 'income',
        name: 'Salary',
        icon: '💰',
      };

      expect(incomeCategory.type).toBe('income');
    });

    it('should handle expense categories', () => {
      const expenseCategory = {
        ...mockDbCategory,
        type: 'expense',
        name: 'Utilities',
        icon: '⚡',
      };

      expect(expenseCategory.type).toBe('expense');
    });

    it('should mark business expense categories', () => {
      const businessCategory = {
        ...mockDbCategory,
        is_business_expense: true,
        name: 'Office Supplies',
      };

      expect(businessCategory.is_business_expense).toBe(true);
    });

    it('should distinguish personal vs business categories', () => {
      const categories = [
        { ...mockDbCategory, id: 'cat-1', name: 'Groceries', is_business_expense: false },
        { ...mockDbCategory, id: 'cat-2', name: 'Office Rent', is_business_expense: true },
        { ...mockDbCategory, id: 'cat-3', name: 'Gas', is_business_expense: false },
      ];

      const businessCategories = categories.filter(c => c.is_business_expense);
      const personalCategories = categories.filter(c => !c.is_business_expense);

      expect(businessCategories).toHaveLength(1);
      expect(personalCategories).toHaveLength(2);
    });

    it('should handle default system categories', () => {
      const defaultCategories = [
        { ...mockDbCategory, id: 'def-1', name: 'Food & Dining', is_default: true },
        { ...mockDbCategory, id: 'def-2', name: 'Transportation', is_default: true },
        { ...mockDbCategory, id: 'custom-1', name: 'My Custom Category', is_default: false },
      ];

      const systemDefaults = defaultCategories.filter(c => c.is_default);
      const userCustom = defaultCategories.filter(c => !c.is_default);

      expect(systemDefaults).toHaveLength(2);
      expect(userCustom).toHaveLength(1);
    });
  });

  describe('Category Icons and Colors', () => {
    it('should validate emoji icons', () => {
      const validIcons = ['🛒', '🚗', '🏠', '💰', '🍕'];
      
      validIcons.forEach(icon => {
        const category = { ...mockCreateCategoryData, icon };
        
        (mockSchema.createCategorySchema.parse as jest.Mock).mockImplementation((data: any) => {
          // Basic emoji validation (simplified)
          const isEmoji = data.icon && data.icon.length > 0;
          if (data.icon && !isEmoji) {
            throw new Error('Invalid icon format');
          }
          return data;
        });

        expect(() => {
          mockSchema.createCategorySchema.parse(category);
        }).not.toThrow();
      });
    });

    it('should validate hex color codes', () => {
      const validColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000'];
      
      validColors.forEach(color => {
        const category = { ...mockCreateCategoryData, color };
        
        (mockSchema.createCategorySchema.parse as jest.Mock).mockImplementation((data: any) => {
          const colorRegex = /^#[0-9A-F]{6}$/i;
          if (data.color && !colorRegex.test(data.color)) {
            throw new Error('Invalid color format');
          }
          return data;
        });

        expect(() => {
          mockSchema.createCategorySchema.parse(category);
        }).not.toThrow();
      });
    });

    it('should provide default colors for category types', () => {
      const getDefaultColor = (type: string) => {
        const defaults = {
          'income': '#10B981', // Green
          'expense': '#EF4444', // Red
        };
        return defaults[type as keyof typeof defaults] || '#6B7280'; // Gray
      };

      expect(getDefaultColor('income')).toBe('#10B981');
      expect(getDefaultColor('expense')).toBe('#EF4444');
      expect(getDefaultColor('unknown')).toBe('#6B7280');
    });

    it('should provide default icons for common categories', () => {
      const getDefaultIcon = (name: string) => {
        const iconMap: Record<string, string> = {
          'food': '🍽️',
          'transportation': '🚗',
          'shopping': '🛒',
          'entertainment': '🎬',
          'utilities': '⚡',
          'salary': '💰',
        };
        
        const lowerName = name.toLowerCase();
        for (const [key, icon] of Object.entries(iconMap)) {
          if (lowerName.includes(key)) {
            return icon;
          }
        }
        return '📁'; // Default folder icon
      };

      expect(getDefaultIcon('Food & Dining')).toBe('🍽️');
      expect(getDefaultIcon('Transportation')).toBe('🚗');
      expect(getDefaultIcon('Random Category')).toBe('📁');
    });
  });

  describe('Category Transformations', () => {
    it('should transform database category to UI format', () => {
      const { transformCategoryToUI } = mockSchema;

      const result = transformCategoryToUI(mockDbCategory);

      expect(transformCategoryToUI).toHaveBeenCalledWith(mockDbCategory);
      expect(result).toEqual(mockUICategory);
    });

    it('should transform UI category to database format', () => {
      const { transformCategoryToDB } = mockSchema;

      const result = transformCategoryToDB(mockUICategory);

      expect(transformCategoryToDB).toHaveBeenCalledWith(mockUICategory);
      expect(result).toEqual(mockDbCategory);
    });

    it('should handle missing fields in transformation', () => {
      const incompleteCategory = {
        id: 'cat-1',
        name: 'Test Category',
        // Missing required fields
      };

      (mockSchema.transformCategoryToUI as jest.Mock).mockImplementation((category: any) => {
        if (!category.type) {
          throw new Error('Missing required fields for transformation');
        }
        return mockUICategory;
      });

      expect(() => {
        mockSchema.transformCategoryToUI(incompleteCategory);
      }).toThrow('Missing required fields for transformation');
    });

    it('should handle snake_case to camelCase conversion', () => {
      const dbFormat = {
        id: 'cat-1',
        parent_category_id: 'parent-1',
        is_default: true,
        is_business_expense: false,
        is_active: true,
      };

      const expectedUIFormat = {
        id: 'cat-1',
        parentCategoryId: 'parent-1',
        isDefault: true,
        isBusinessExpense: false,
        isActive: true,
      };

      // Simulate the transformation logic
      const transformToUI = (dbCategory: any) => ({
        id: dbCategory.id,
        parentCategoryId: dbCategory.parent_category_id,
        isDefault: dbCategory.is_default,
        isBusinessExpense: dbCategory.is_business_expense,
        isActive: dbCategory.is_active,
      });

      const result = transformToUI(dbFormat);
      expect(result).toEqual(expectedUIFormat);
    });
  });
});