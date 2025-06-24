import {
  transformBudgetToUI,
  transformBudgetToDB,
  createBudgetSchema,
  budgetDbSchema,
  budgetUISchema,
  type Budget,
  type UIBudget,
} from '@/lib/db/schemas/budget';

describe('Budget Schema and Transformations', () => {
  const mockDbBudget: Budget = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Monthly Food Budget',
    amount: 500.00,
    category_id: '123e4567-e89b-12d3-a456-426614174002',
    period: 'monthly',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    alert_threshold: 0.8,
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  const mockUIBudget: UIBudget = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Monthly Food Budget',
    amount: 500.00,
    categoryId: '123e4567-e89b-12d3-a456-426614174002',
    period: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    alertThreshold: 0.8,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  describe('transformBudgetToUI', () => {
    it('should transform database budget to UI format', () => {
      const result = transformBudgetToUI(mockDbBudget);
      
      expect(result).toEqual(mockUIBudget);
    });

    it('should handle optional fields correctly', () => {
      const dbBudgetWithOptionals: Budget = {
        ...mockDbBudget,
        end_date: undefined,
        created_at: undefined,
        updated_at: undefined,
      };

      const result = transformBudgetToUI(dbBudgetWithOptionals);

      expect(result.endDate).toBeUndefined();
      expect(result.createdAt).toBeUndefined();
      expect(result.updatedAt).toBeUndefined();
    });

    it('should preserve all required fields', () => {
      const result = transformBudgetToUI(mockDbBudget);

      expect(result.id).toBe(mockDbBudget.id);
      expect(result.userId).toBe(mockDbBudget.user_id);
      expect(result.name).toBe(mockDbBudget.name);
      expect(result.amount).toBe(mockDbBudget.amount);
      expect(result.categoryId).toBe(mockDbBudget.category_id);
      expect(result.period).toBe(mockDbBudget.period);
      expect(result.startDate).toBe(mockDbBudget.start_date);
      expect(result.alertThreshold).toBe(mockDbBudget.alert_threshold);
      expect(result.isActive).toBe(mockDbBudget.is_active);
    });
  });

  describe('transformBudgetToDB', () => {
    it('should transform UI budget to database format', () => {
      const result = transformBudgetToDB(mockUIBudget);
      
      expect(result).toEqual(mockDbBudget);
    });

    it('should handle partial UI budgets', () => {
      const partialUIBudget: Partial<UIBudget> = {
        id: '123e4567-e89b-12d3-a456-426614174010',
        userId: '123e4567-e89b-12d3-a456-426614174011',
        amount: 750.00,
        period: 'weekly',
      };

      const result = transformBudgetToDB(partialUIBudget);

      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174010');
      expect(result.user_id).toBe('123e4567-e89b-12d3-a456-426614174011');
      expect(result.amount).toBe(750.00);
      expect(result.period).toBe('weekly');
      expect(result.name).toBeUndefined();
      expect(result.category_id).toBeUndefined();
    });

    it('should handle undefined optional fields', () => {
      const uibudgetWithUndefined: UIBudget = {
        ...mockUIBudget,
        endDate: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };

      const result = transformBudgetToDB(uibudgetWithUndefined);

      expect(result.end_date).toBeUndefined();
      expect(result.created_at).toBeUndefined();
      expect(result.updated_at).toBeUndefined();
    });
  });

  describe('createBudgetSchema validation', () => {
    const validCreateData = {
      name: 'Entertainment Budget',
      amount: 200.00,
      categoryId: '123e4567-e89b-12d3-a456-426614174020',
      period: 'monthly' as const,
      startDate: '2024-01-01',
      alertThreshold: 0.75,
    };

    it('should validate valid budget creation data', () => {
      const result = createBudgetSchema.safeParse(validCreateData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validCreateData);
      }
    });

    it('should reject budget with negative amount', () => {
      const invalidData = {
        ...validCreateData,
        amount: -100,
      };

      const result = createBudgetSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Amount must be positive');
      }
    });

    it('should reject budget with zero amount', () => {
      const invalidData = {
        ...validCreateData,
        amount: 0,
      };

      const result = createBudgetSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Amount must be positive');
      }
    });

    it('should reject budget with invalid period', () => {
      const invalidData = {
        ...validCreateData,
        period: 'invalid_period',
      };

      const result = createBudgetSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['period']);
      }
    });

    it('should reject budget without required name', () => {
      const invalidData = {
        ...validCreateData,
        name: '',
      };

      const result = createBudgetSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Budget name is required');
      }
    });

    it('should reject budget without required categoryId', () => {
      const invalidData = {
        ...validCreateData,
        categoryId: '',
      };

      const result = createBudgetSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Category is required');
      }
    });

    it('should reject budget with invalid alert threshold (> 1)', () => {
      const invalidData = {
        ...validCreateData,
        alertThreshold: 1.5,
      };

      const result = createBudgetSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Alert threshold must be between 0 and 1');
      }
    });

    it('should reject budget with invalid alert threshold (< 0)', () => {
      const invalidData = {
        ...validCreateData,
        alertThreshold: -0.1,
      };

      const result = createBudgetSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Alert threshold must be between 0 and 1');
      }
    });

    it('should accept budget without optional endDate', () => {
      const dataWithoutEndDate = {
        name: 'No End Date Budget',
        amount: 300.00,
        categoryId: '123e4567-e89b-12d3-a456-426614174020',
        period: 'monthly' as const,
        startDate: '2024-01-01',
      };

      const result = createBudgetSchema.safeParse(dataWithoutEndDate);
      
      expect(result.success).toBe(true);
    });

    it('should use default alert threshold when not provided', () => {
      const dataWithoutThreshold = {
        name: 'Default Threshold Budget',
        amount: 400.00,
        categoryId: '123e4567-e89b-12d3-a456-426614174020',
        period: 'monthly' as const,
        startDate: '2024-01-01',
      };

      const result = createBudgetSchema.safeParse(dataWithoutThreshold);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alertThreshold).toBe(0.8); // Default value
      }
    });
  });

  describe('budgetDbSchema validation', () => {
    it('should validate complete database budget', () => {
      const result = budgetDbSchema.safeParse(mockDbBudget);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockDbBudget);
      }
    });

    it('should require user_id field', () => {
      const invalidData = {
        ...mockDbBudget,
        user_id: '',
      };

      const result = budgetDbSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });

    it('should require valid period', () => {
      const invalidData = {
        ...mockDbBudget,
        period: 'invalid_period',
      };

      const result = budgetDbSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });

    it('should set default value for is_active', () => {
      const dataWithoutIsActive = {
        ...mockDbBudget,
        is_active: undefined,
      };

      const result = budgetDbSchema.safeParse(dataWithoutIsActive);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });

    it('should set default value for alert_threshold', () => {
      const dataWithoutThreshold = {
        ...mockDbBudget,
        alert_threshold: undefined,
      };

      const result = budgetDbSchema.safeParse(dataWithoutThreshold);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alert_threshold).toBe(0.8);
      }
    });
  });

  describe('budgetUISchema validation', () => {
    it('should validate complete UI budget', () => {
      const result = budgetUISchema.safeParse(mockUIBudget);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockUIBudget);
      }
    });

    it('should require userId field', () => {
      const invalidData = {
        ...mockUIBudget,
        userId: '',
      };

      const result = budgetUISchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });

    it('should require valid period', () => {
      const invalidData = {
        ...mockUIBudget,
        period: 'invalid_period',
      };

      const result = budgetUISchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });

    it('should set default value for isActive', () => {
      const dataWithoutIsActive = {
        ...mockUIBudget,
        isActive: undefined,
      };

      const result = budgetUISchema.safeParse(dataWithoutIsActive);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
      }
    });

    it('should set default value for alertThreshold', () => {
      const dataWithoutThreshold = {
        ...mockUIBudget,
        alertThreshold: undefined,
      };

      const result = budgetUISchema.safeParse(dataWithoutThreshold);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.alertThreshold).toBe(0.8);
      }
    });
  });

  describe('edge cases and data integrity', () => {
    it('should handle transformations with extreme values', () => {
      const extremeDbBudget: Budget = {
        ...mockDbBudget,
        amount: 999999.99,
        name: 'A'.repeat(500), // Very long name
        alert_threshold: 0.01, // Very low threshold
      };

      const uiResult = transformBudgetToUI(extremeDbBudget);
      const dbResult = transformBudgetToDB(uiResult);

      expect(dbResult.amount).toBe(999999.99);
      expect(dbResult.name).toBe('A'.repeat(500));
      expect(dbResult.alert_threshold).toBe(0.01);
    });

    it('should handle transformations with minimal data', () => {
      const minimalDbBudget: Budget = {
        id: '123e4567-e89b-12d3-a456-426614174030',
        user_id: '123e4567-e89b-12d3-a456-426614174031',
        name: 'X',
        amount: 0.01,
        category_id: '123e4567-e89b-12d3-a456-426614174032',
        period: 'weekly',
        start_date: '2024-01-01',
        end_date: undefined,
        alert_threshold: 0.8,
        is_active: true,
        created_at: undefined,
        updated_at: undefined,
      };

      const uiResult = transformBudgetToUI(minimalDbBudget);
      const dbResult = transformBudgetToDB(uiResult);

      expect(dbResult.amount).toBe(0.01);
      expect(dbResult.name).toBe('X');
      expect(dbResult.end_date).toBeUndefined();
      expect(dbResult.created_at).toBeUndefined();
      expect(dbResult.updated_at).toBeUndefined();
    });

    it('should maintain type consistency through round-trip transformations', () => {
      // DB -> UI -> DB
      const uiFromDb = transformBudgetToUI(mockDbBudget);
      const backToDb = transformBudgetToDB(uiFromDb);

      expect(backToDb).toEqual(mockDbBudget);

      // UI -> DB -> UI
      const dbFromUI = transformBudgetToDB(mockUIBudget);
      const backToUI = transformBudgetToUI(dbFromUI);

      expect(backToUI).toEqual(mockUIBudget);
    });

    it('should handle all valid period types', () => {
      const periods = ['weekly', 'monthly', 'yearly'] as const;
      
      periods.forEach(period => {
        const budgetWithPeriod = {
          ...mockDbBudget,
          period,
        };

        const result = budgetDbSchema.safeParse(budgetWithPeriod);
        expect(result.success).toBe(true);
      });
    });

    it('should handle edge alert threshold values', () => {
      const edgeThresholds = [0, 0.5, 1];
      
      edgeThresholds.forEach(threshold => {
        const budgetWithThreshold = {
          ...mockDbBudget,
          alert_threshold: threshold,
        };

        const result = budgetDbSchema.safeParse(budgetWithThreshold);
        expect(result.success).toBe(true);
      });
    });
  });
});