import {
  transformTransactionToUI,
  transformTransactionToDB,
  createTransactionSchema,
  transactionDbSchema,
  transactionUISchema,
  type Transaction,
  type UITransaction,
} from '@/lib/db/schemas/transaction';

describe('Transaction Schema and Transformations', () => {
  const mockDbTransaction: Transaction = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174001',
    amount: 25.50,
    transaction_type: 'expense',
    name: 'Coffee Shop',
    description: 'Morning coffee',
    category_id: '123e4567-e89b-12d3-a456-426614174002',
    category_name: 'Food & Dining',
    category_icon: '🍽️',
    transaction_date: '2024-01-15T10:00:00.000Z',
    created_at: '2024-01-15T10:00:00.000Z',
    updated_at: '2024-01-15T10:00:00.000Z',
    is_active: true,
  };

  const mockUITransaction: UITransaction = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    amount: 25.50,
    transactionType: 'expense',
    name: 'Coffee Shop',
    description: 'Morning coffee',
    categoryId: '123e4567-e89b-12d3-a456-426614174002',
    categoryName: 'Food & Dining',
    categoryIcon: '🍽️',
    transactionDate: '2024-01-15T10:00:00.000Z',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
    isActive: true,
  };

  describe('transformTransactionToUI', () => {
    it('should transform database transaction to UI format', () => {
      const result = transformTransactionToUI(mockDbTransaction);
      
      expect(result).toEqual(mockUITransaction);
    });

    it('should handle optional fields correctly', () => {
      const dbTransactionWithOptionals: Transaction = {
        ...mockDbTransaction,
        description: undefined,
        created_at: undefined,
        updated_at: undefined,
      };

      const result = transformTransactionToUI(dbTransactionWithOptionals);

      expect(result.description).toBeUndefined();
      expect(result.createdAt).toBeUndefined();
      expect(result.updatedAt).toBeUndefined();
    });

    it('should preserve all required fields', () => {
      const result = transformTransactionToUI(mockDbTransaction);

      expect(result.id).toBe(mockDbTransaction.id);
      expect(result.userId).toBe(mockDbTransaction.user_id);
      expect(result.amount).toBe(mockDbTransaction.amount);
      expect(result.transactionType).toBe(mockDbTransaction.transaction_type);
      expect(result.name).toBe(mockDbTransaction.name);
      expect(result.categoryId).toBe(mockDbTransaction.category_id);
      expect(result.categoryName).toBe(mockDbTransaction.category_name);
      expect(result.categoryIcon).toBe(mockDbTransaction.category_icon);
      expect(result.transactionDate).toBe(mockDbTransaction.transaction_date);
      expect(result.isActive).toBe(mockDbTransaction.is_active);
    });
  });

  describe('transformTransactionToDB', () => {
    it('should transform UI transaction to database format', () => {
      const result = transformTransactionToDB(mockUITransaction);
      
      expect(result).toEqual(mockDbTransaction);
    });

    it('should handle partial UI transactions', () => {
      const partialUITransaction: Partial<UITransaction> = {
        id: '123e4567-e89b-12d3-a456-426614174010',
        userId: '123e4567-e89b-12d3-a456-426614174011',
        amount: 50.00,
        transactionType: 'income',
      };

      const result = transformTransactionToDB(partialUITransaction);

      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174010');
      expect(result.user_id).toBe('123e4567-e89b-12d3-a456-426614174011');
      expect(result.amount).toBe(50.00);
      expect(result.transaction_type).toBe('income');
      expect(result.name).toBeUndefined();
      expect(result.description).toBeUndefined();
    });

    it('should handle undefined optional fields', () => {
      const uiTransactionWithUndefined: UITransaction = {
        ...mockUITransaction,
        description: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };

      const result = transformTransactionToDB(uiTransactionWithUndefined);

      expect(result.description).toBeUndefined();
      expect(result.created_at).toBeUndefined();
      expect(result.updated_at).toBeUndefined();
    });
  });

  describe('createTransactionSchema validation', () => {
    const validCreateData = {
      amount: 25.50,
      transactionType: 'expense' as const,
      name: 'Coffee Shop',
      description: 'Morning coffee',
      categoryId: '123e4567-e89b-12d3-a456-426614174020',
      transactionDate: '2024-01-15T10:00:00.000Z',
    };

    it('should validate valid transaction creation data', () => {
      const result = createTransactionSchema.safeParse(validCreateData);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validCreateData);
      }
    });

    it('should reject transaction with zero amount', () => {
      const invalidData = {
        ...validCreateData,
        amount: 0,
      };

      const result = createTransactionSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Amount cannot be zero');
      }
    });

    it('should reject transaction with invalid type', () => {
      const invalidData = {
        ...validCreateData,
        transactionType: 'invalid_type',
      };

      const result = createTransactionSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['transactionType']);
      }
    });

    it('should reject transaction without required name', () => {
      const invalidData = {
        ...validCreateData,
        name: '',
      };

      const result = createTransactionSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Transaction name is required');
      }
    });

    it('should reject transaction without required categoryId', () => {
      const invalidData = {
        ...validCreateData,
        categoryId: '',
      };

      const result = createTransactionSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Category is required');
      }
    });

    it('should accept transaction without optional transactionDate', () => {
      const dataWithoutDate = {
        amount: 25.50,
        transactionType: 'expense' as const,
        name: 'Coffee Shop',
        categoryId: '123e4567-e89b-12d3-a456-426614174020',
      };

      const result = createTransactionSchema.safeParse(dataWithoutDate);
      
      expect(result.success).toBe(true);
    });

    it('should accept transaction without optional description', () => {
      const dataWithoutDescription = {
        ...validCreateData,
        description: undefined,
      };

      const result = createTransactionSchema.safeParse(dataWithoutDescription);
      
      expect(result.success).toBe(true);
    });

    it('should reject transaction with invalid datetime format', () => {
      const invalidData = {
        ...validCreateData,
        transactionDate: 'invalid-date',
      };

      const result = createTransactionSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['transactionDate']);
      }
    });
  });

  describe('transactionDbSchema validation', () => {
    it('should validate complete database transaction', () => {
      const result = transactionDbSchema.safeParse(mockDbTransaction);
      
      if (!result.success) {
        console.log('Schema validation errors:', result.error.issues);
      }
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockDbTransaction);
      }
    });

    it('should require user_id field', () => {
      const invalidData = {
        ...mockDbTransaction,
        user_id: '',
      };

      const result = transactionDbSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });

    it('should require valid transaction_type', () => {
      const invalidData = {
        ...mockDbTransaction,
        transaction_type: 'invalid_type',
      };

      const result = transactionDbSchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });

    it('should set default value for is_active', () => {
      const dataWithoutIsActive = {
        ...mockDbTransaction,
        is_active: undefined,
      };

      const result = transactionDbSchema.safeParse(dataWithoutIsActive);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_active).toBe(true);
      }
    });
  });

  describe('transactionUISchema validation', () => {
    it('should validate complete UI transaction', () => {
      const result = transactionUISchema.safeParse(mockUITransaction);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockUITransaction);
      }
    });

    it('should require userId field', () => {
      const invalidData = {
        ...mockUITransaction,
        userId: '',
      };

      const result = transactionUISchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });

    it('should require valid transactionType', () => {
      const invalidData = {
        ...mockUITransaction,
        transactionType: 'invalid_type',
      };

      const result = transactionUISchema.safeParse(invalidData);
      
      expect(result.success).toBe(false);
    });

    it('should set default value for isActive', () => {
      const dataWithoutIsActive = {
        ...mockUITransaction,
        isActive: undefined,
      };

      const result = transactionUISchema.safeParse(dataWithoutIsActive);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
      }
    });
  });

  describe('edge cases and data integrity', () => {
    it('should handle transformations with extreme values', () => {
      const extremeDbTransaction: Transaction = {
        ...mockDbTransaction,
        amount: 999999.99,
        name: 'A'.repeat(1000), // Very long name
        description: 'B'.repeat(2000), // Very long description
      };

      const uiResult = transformTransactionToUI(extremeDbTransaction);
      const dbResult = transformTransactionToDB(uiResult);

      expect(dbResult.amount).toBe(999999.99);
      expect(dbResult.name).toBe('A'.repeat(1000));
      expect(dbResult.description).toBe('B'.repeat(2000));
    });

    it('should handle transformations with minimal data', () => {
      const minimalDbTransaction: Transaction = {
        id: '123e4567-e89b-12d3-a456-426614174030',
        user_id: '123e4567-e89b-12d3-a456-426614174031',
        amount: 0.01,
        transaction_type: 'income',
        name: 'X',
        description: undefined,
        category_id: '123e4567-e89b-12d3-a456-426614174032',
        category_name: 'Y',
        category_icon: 'Z',
        transaction_date: '2024-01-01T00:00:00.000Z',
        created_at: undefined,
        updated_at: undefined,
        is_active: true,
      };

      const uiResult = transformTransactionToUI(minimalDbTransaction);
      const dbResult = transformTransactionToDB(uiResult);

      expect(dbResult.amount).toBe(0.01);
      expect(dbResult.name).toBe('X');
      expect(dbResult.description).toBeUndefined();
      expect(dbResult.created_at).toBeUndefined();
      expect(dbResult.updated_at).toBeUndefined();
    });

    it('should maintain type consistency through round-trip transformations', () => {
      // DB -> UI -> DB
      const uiFromDb = transformTransactionToUI(mockDbTransaction);
      const backToDb = transformTransactionToDB(uiFromDb);

      expect(backToDb).toEqual(mockDbTransaction);

      // UI -> DB -> UI
      const dbFromUI = transformTransactionToDB(mockUITransaction);
      const backToUI = transformTransactionToUI(dbFromUI);

      expect(backToUI).toEqual(mockUITransaction);
    });
  });
});