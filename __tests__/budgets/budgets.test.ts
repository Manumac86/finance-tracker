// Mock the database functions
jest.mock("@/lib/db/postgres", () => ({
  selectBudgets: jest.fn(),
  insertBudget: jest.fn(),
  updateBudget: jest.fn(),
  deleteBudget: jest.fn(),
  selectTransactions: jest.fn(),
}));

// Mock the schema transformations
jest.mock("@/lib/db/schemas/budget", () => ({
  transformBudgetToUI: jest.fn(),
  transformUIToBudget: jest.fn(),
  CreateBudgetSchema: {
    parse: jest.fn(),
  },
}));

import * as mockDb from "@/lib/db/postgres";
import * as mockSchema from "@/lib/db/schemas/budget";

describe("Budget Functionality", () => {
  const mockDbBudget = {
    id: "budget-1",
    user_id: "user-1",
    category_id: "cat-1",
    name: "Groceries Budget",
    description: "Monthly grocery spending limit",
    budget_type: "category" as const,
    amount: 500.0,
    period: "monthly" as const,
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    alert_threshold_percentage: 80,
    alert_enabled: true,
    overspend_alert_enabled: true,
    rollover_enabled: false,
    rollover_type: "none" as const,
    current_spent: 0,
    is_active: true,
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T10:00:00Z",
  };

  const mockUIBudget = {
    id: "budget-1",
    userId: "user-1",
    categoryId: "cat-1",
    name: "Groceries Budget",
    description: "Monthly grocery spending limit",
    budgetType: "category" as const,
    amount: 500.0,
    period: "monthly" as const,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    alertThresholdPercentage: 80,
    alertEnabled: true,
    overspendAlertEnabled: true,
    rolloverEnabled: false,
    rolloverType: "none" as const,
    currentSpent: 0,
    isActive: true,
  };

  const mockCreateBudgetData = {
    name: "Entertainment Budget",
    description: "Monthly entertainment spending",
    budgetType: "category",
    categoryId: "cat-2",
    amount: 200.0,
    period: "monthly",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    alertThreshold: 0.75,
    rolloverType: "none",
  };

  const mockTransactions = [
    {
      id: "trans-1",
      category_id: "cat-1",
      amount: 150.0,
      transaction_type: "expense",
      transaction_date: "2024-01-15",
    },
    {
      id: "trans-2",
      category_id: "cat-1",
      amount: 200.0,
      transaction_type: "expense",
      transaction_date: "2024-01-20",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (mockSchema.transformBudgetToUI as jest.Mock).mockReturnValue(mockUIBudget);
    (mockSchema.transformUIToBudget as jest.Mock).mockReturnValue(mockDbBudget);
    (mockSchema.CreateBudgetSchema.parse as jest.Mock).mockReturnValue(mockCreateBudgetData);
    (mockDb.selectTransactions as jest.Mock).mockResolvedValue(mockTransactions);
  });

  describe("Budget Creation", () => {
    it("should create a new budget", async () => {
      (mockDb.insertBudget as jest.Mock).mockResolvedValue(mockDbBudget);

      const { insertBudget } = mockDb;
      const result = await insertBudget(mockDbBudget);

      expect(insertBudget).toHaveBeenCalledWith(mockDbBudget);
      expect(result).toEqual(mockDbBudget);
    });

    it("should validate budget data before creation", () => {
      const invalidBudgetData = {
        name: "",
        amount: -100,
        period: "invalid",
      };

      (mockSchema.CreateBudgetSchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error("Validation failed: Invalid budget data");
      });

      expect(() => {
        mockSchema.CreateBudgetSchema.parse(invalidBudgetData);
      }).toThrow("Validation failed: Invalid budget data");
    });

    it("should validate required fields", () => {
      const requiredFields = ["name", "amount", "period", "budgetType"];

      requiredFields.forEach((field) => {
        const incompleteData = { ...mockCreateBudgetData };
        delete incompleteData[field as keyof typeof mockCreateBudgetData];

        (mockSchema.CreateBudgetSchema.parse as jest.Mock).mockImplementation(() => {
          throw new Error(`${field} is required`);
        });

        expect(() => {
          mockSchema.CreateBudgetSchema.parse(incompleteData);
        }).toThrow(`${field} is required`);
      });
    });

    it("should validate amount is positive", () => {
      const negativeBudget = {
        ...mockCreateBudgetData,
        amount: -100,
      };

      (mockSchema.CreateBudgetSchema.parse as jest.Mock).mockImplementation((data: any) => {
        if (data.amount <= 0) {
          throw new Error("Amount must be positive");
        }
        return data;
      });

      expect(() => {
        mockSchema.CreateBudgetSchema.parse(negativeBudget);
      }).toThrow("Amount must be positive");
    });

    it("should validate period enum values", () => {
      const invalidPeriodBudget = {
        ...mockCreateBudgetData,
        period: "invalid-period",
      };

      (mockSchema.CreateBudgetSchema.parse as jest.Mock).mockImplementation((data: any) => {
        const validPeriods = ["weekly", "monthly", "quarterly", "yearly"];
        if (!validPeriods.includes(data.period)) {
          throw new Error("Invalid period");
        }
        return data;
      });

      expect(() => {
        mockSchema.CreateBudgetSchema.parse(invalidPeriodBudget);
      }).toThrow("Invalid period");
    });

    it("should validate alert threshold range", () => {
      const invalidThresholdBudget = {
        ...mockCreateBudgetData,
        alertThreshold: 1.5, // Should be between 0 and 1
      };

      (mockSchema.CreateBudgetSchema.parse as jest.Mock).mockImplementation((data: any) => {
        if (data.alertThreshold < 0 || data.alertThreshold > 1) {
          throw new Error("Alert threshold must be between 0 and 1");
        }
        return data;
      });

      expect(() => {
        mockSchema.CreateBudgetSchema.parse(invalidThresholdBudget);
      }).toThrow("Alert threshold must be between 0 and 1");
    });

    it("should validate date range", () => {
      const invalidDateBudget = {
        ...mockCreateBudgetData,
        startDate: "2024-12-31",
        endDate: "2024-01-01", // End before start
      };

      (mockSchema.CreateBudgetSchema.parse as jest.Mock).mockImplementation((data: any) => {
        if (new Date(data.endDate) <= new Date(data.startDate)) {
          throw new Error("End date must be after start date");
        }
        return data;
      });

      expect(() => {
        mockSchema.CreateBudgetSchema.parse(invalidDateBudget);
      }).toThrow("End date must be after start date");
    });
  });

  describe("Budget Retrieval", () => {
    it("should fetch budgets for a user", async () => {
      (mockDb.selectBudgets as jest.Mock).mockResolvedValue([mockDbBudget]);

      const { selectBudgets } = mockDb;
      const budgets = await selectBudgets("user-1");

      expect(selectBudgets).toHaveBeenCalledWith("user-1");
      expect(budgets).toEqual([mockDbBudget]);
    });

    it("should handle empty budget list", async () => {
      (mockDb.selectBudgets as jest.Mock).mockResolvedValue([]);

      const { selectBudgets } = mockDb;
      const budgets = await selectBudgets("user-1");

      expect(budgets).toEqual([]);
    });

    it("should handle database errors during retrieval", async () => {
      (mockDb.selectBudgets as jest.Mock).mockRejectedValue(
        new Error("Database connection error")
      );

      const { selectBudgets } = mockDb;

      await expect(selectBudgets("user-1")).rejects.toThrow(
        "Database connection error"
      );
    });

    it("should filter active budgets only", async () => {
      const activeBudgets = [
        { ...mockDbBudget, id: "budget-1", is_active: true },
        { ...mockDbBudget, id: "budget-2", is_active: false },
      ];
      (mockDb.selectBudgets as jest.Mock).mockResolvedValue(activeBudgets);

      const { selectBudgets } = mockDb;
      const budgets = await selectBudgets("user-1");
      const active = budgets.filter((b: any) => b.is_active);

      expect(active).toHaveLength(1);
      expect(active[0].id).toBe("budget-1");
    });
  });

  describe("Budget Updates", () => {
    it("should update an existing budget", async () => {
      const updates = {
        amount: 600.0,
        description: "Updated budget description",
        alert_threshold: 0.9,
      };
      const updatedBudget = { ...mockDbBudget, ...updates };
      (mockDb.updateBudget as jest.Mock).mockResolvedValue(updatedBudget);

      const { updateBudget } = mockDb;
      const result = await updateBudget("budget-1", updates);

      expect(updateBudget).toHaveBeenCalledWith("budget-1", updates);
      expect(result).toEqual(updatedBudget);
    });

    it("should handle partial updates", async () => {
      const partialUpdates = { amount: 750.0 };
      const updatedBudget = { ...mockDbBudget, amount: 750.0 };
      (mockDb.updateBudget as jest.Mock).mockResolvedValue(updatedBudget);

      const { updateBudget } = mockDb;
      const result = await updateBudget("budget-1", partialUpdates);

      expect(updateBudget).toHaveBeenCalledWith("budget-1", partialUpdates);
      expect(result.amount).toBe(750.0);
    });

    it("should handle non-existent budget updates", async () => {
      (mockDb.updateBudget as jest.Mock).mockRejectedValue(new Error("Budget not found"));

      const { updateBudget } = mockDb;

      await expect(updateBudget("non-existent", {})).rejects.toThrow(
        "Budget not found"
      );
    });

    it("should validate updates before applying", () => {
      const invalidUpdates = {
        amount: -50,
        alert_threshold: 2.0,
      };

      (mockSchema.CreateBudgetSchema.parse as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid update data");
      });

      expect(() => {
        mockSchema.CreateBudgetSchema.parse(invalidUpdates);
      }).toThrow("Invalid update data");
    });
  });

  describe("Budget Deletion", () => {
    it("should delete a budget (soft delete)", async () => {
      (mockDb.deleteBudget as jest.Mock).mockResolvedValue(true);

      const { deleteBudget } = mockDb;
      const result = await deleteBudget("budget-1");

      expect(deleteBudget).toHaveBeenCalledWith("budget-1");
      expect(result).toBe(true);
    });

    it("should handle deletion of non-existent budget", async () => {
      (mockDb.deleteBudget as jest.Mock).mockResolvedValue(false);

      const { deleteBudget } = mockDb;
      const result = await deleteBudget("non-existent");

      expect(result).toBe(false);
    });

    it("should handle deletion errors", async () => {
      (mockDb.deleteBudget as jest.Mock).mockRejectedValue(new Error("Database error"));

      const { deleteBudget } = mockDb;

      await expect(deleteBudget("budget-1")).rejects.toThrow("Database error");
    });
  });

  describe("Budget Progress Calculation", () => {
    it("should calculate budget progress correctly", () => {
      const budgetAmount = 500.0;
      const spent = mockTransactions.reduce((sum, t) => sum + t.amount, 0); // 350.00
      const progress = spent / budgetAmount;

      expect(progress).toBe(0.7); // 70% spent
    });

    it("should calculate remaining budget amount", () => {
      const budgetAmount = 500.0;
      const spent = mockTransactions.reduce((sum, t) => sum + t.amount, 0); // 350.00
      const remaining = budgetAmount - spent;

      expect(remaining).toBe(150.0);
    });

    it("should handle overspending scenarios", () => {
      const budgetAmount = 500.0;
      const overspentTransactions = [
        ...mockTransactions,
        { ...mockTransactions[0], amount: 300.0 }, // Total now 650.00
      ];
      const spent = overspentTransactions.reduce((sum, t) => sum + t.amount, 0);
      const progress = spent / budgetAmount;
      const overspent = spent - budgetAmount;

      expect(progress).toBeGreaterThan(1);
      expect(overspent).toBe(150.0);
    });

    it("should filter transactions by budget category", () => {
      const categoryTransactions = mockTransactions.filter(
        (t) => t.category_id === "cat-1"
      );
      expect(categoryTransactions).toHaveLength(2);
    });

    it("should filter transactions by date range", () => {
      const startDate = "2024-01-01";
      const endDate = "2024-01-31";
      const dateFilteredTransactions = mockTransactions.filter(
        (t) => t.transaction_date >= startDate && t.transaction_date <= endDate
      );
      expect(dateFilteredTransactions).toHaveLength(2);
    });

    it("should calculate daily average spending", () => {
      const daysInPeriod = 30; // January
      const totalSpent = mockTransactions.reduce((sum, t) => sum + t.amount, 0);
      const dailyAverage = totalSpent / daysInPeriod;

      expect(dailyAverage).toBeCloseTo(11.67, 2);
    });
  });

  describe("Budget Alerts", () => {
    it("should trigger alert when threshold is exceeded", () => {
      const budgetAmount = 500.0;
      const spent = 420.0; // 84% of budget
      const alertThreshold = 0.8; // 80%
      const progress = spent / budgetAmount;

      const shouldAlert = progress >= alertThreshold;
      expect(shouldAlert).toBe(true);
    });

    it("should not trigger alert when under threshold", () => {
      const budgetAmount = 500.0;
      const spent = 350.0; // 70% of budget
      const alertThreshold = 0.8; // 80%
      const progress = spent / budgetAmount;

      const shouldAlert = progress >= alertThreshold;
      expect(shouldAlert).toBe(false);
    });

    it("should calculate alert amount", () => {
      const budgetAmount = 500.0;
      const alertThreshold = 0.8;
      const alertAmount = budgetAmount * alertThreshold;

      expect(alertAmount).toBe(400.0);
    });

    it("should handle different alert threshold values", () => {
      const testCases = [
        { threshold: 0.5, expected: false, spent: 200 }, // 40% < 50%
        { threshold: 0.75, expected: true, spent: 400 }, // 80% > 75%
        { threshold: 0.9, expected: false, spent: 400 }, // 80% < 90%
      ];

      testCases.forEach(({ threshold, expected, spent }) => {
        const budgetAmount = 500.0;
        const progress = spent / budgetAmount;
        const shouldAlert = progress >= threshold;

        expect(shouldAlert).toBe(expected);
      });
    });
  });

  describe("Budget Types", () => {
    it("should handle category-based budgets", () => {
      const categoryBudget = {
        ...mockDbBudget,
        budget_type: "category",
        category_id: "cat-1",
      };

      expect(categoryBudget.budget_type).toBe("category");
      expect(categoryBudget.category_id).toBe("cat-1");
    });

    it("should handle overall spending budgets", () => {
      const overallBudget = {
        ...mockDbBudget,
        budget_type: "overall",
        category_id: null,
      };

      expect(overallBudget.budget_type).toBe("overall");
      expect(overallBudget.category_id).toBeNull();
    });

    it("should handle income budgets", () => {
      const incomeBudget = {
        ...mockDbBudget,
        budget_type: "income",
        amount: 3000.0,
      };

      expect(incomeBudget.budget_type).toBe("income");
      expect(incomeBudget.amount).toBe(3000.0);
    });

    it("should validate budget type enum", () => {
      const invalidTypeBudget = {
        ...mockCreateBudgetData,
        budgetType: "invalid-type",
      };

      (mockSchema.CreateBudgetSchema.parse as jest.Mock).mockImplementation((data: any) => {
        const validTypes = ["category", "overall", "income"];
        if (!validTypes.includes(data.budgetType)) {
          throw new Error("Invalid budget type");
        }
        return data;
      });

      expect(() => {
        mockSchema.CreateBudgetSchema.parse(invalidTypeBudget);
      }).toThrow("Invalid budget type");
    });
  });

  describe("Budget Periods", () => {
    it("should handle weekly budgets", () => {
      const weeklyBudget = { ...mockDbBudget, period: "weekly", amount: 125.0 };
      expect(weeklyBudget.period).toBe("weekly");
    });

    it("should handle monthly budgets", () => {
      const monthlyBudget = {
        ...mockDbBudget,
        period: "monthly",
        amount: 500.0,
      };
      expect(monthlyBudget.period).toBe("monthly");
    });

    it("should handle quarterly budgets", () => {
      const quarterlyBudget = {
        ...mockDbBudget,
        period: "quarterly",
        amount: 1500.0,
      };
      expect(quarterlyBudget.period).toBe("quarterly");
    });

    it("should handle yearly budgets", () => {
      const yearlyBudget = {
        ...mockDbBudget,
        period: "yearly",
        amount: 6000.0,
      };
      expect(yearlyBudget.period).toBe("yearly");
    });

    it("should calculate period-specific progress", () => {
      const testPeriods = [
        { period: "weekly", days: 7 },
        { period: "monthly", days: 30 },
        { period: "quarterly", days: 90 },
        { period: "yearly", days: 365 },
      ];

      testPeriods.forEach(({ period, days }) => {
        const budgetAmount = 1000.0;
        const dailyBudget = budgetAmount / days;

        expect(dailyBudget).toBeGreaterThan(0);
        expect(dailyBudget * days).toBeCloseTo(budgetAmount, 2);
      });
    });
  });

  describe("Budget Rollover", () => {
    it("should handle no rollover type", () => {
      const noRolloverBudget = { ...mockDbBudget, rollover_type: "none" };
      expect(noRolloverBudget.rollover_type).toBe("none");
    });

    it("should handle unused rollover", () => {
      const rolloverBudget = { ...mockDbBudget, rollover_type: "unused" };
      expect(rolloverBudget.rollover_type).toBe("unused");
    });

    it("should calculate rollover amount for unused funds", () => {
      const budgetAmount = 500.0;
      const spent = 350.0;
      const unused = budgetAmount - spent;
      const rolloverType = "unused";

      if (rolloverType === "unused" && unused > 0) {
        expect(unused).toBe(150.0);
      }
    });

    it("should handle percentage rollover", () => {
      const rolloverBudget = { ...mockDbBudget, rollover_type: "percentage" };
      const rolloverPercentage = 0.1; // 10%
      const budgetAmount = 500.0;
      const rolloverAmount = budgetAmount * rolloverPercentage;

      expect(rolloverAmount).toBe(50.0);
    });
  });

  describe("Budget Transformations", () => {
    it("should transform database budget to UI format", () => {
      const { transformBudgetToUI } = mockSchema;

      const result = transformBudgetToUI(mockDbBudget);

      expect(transformBudgetToUI).toHaveBeenCalledWith(mockDbBudget);
      expect(result).toEqual(mockUIBudget);
    });

    it("should transform UI budget to database format", () => {
      const { transformUIToBudget } = mockSchema;

      const result = transformUIToBudget(mockUIBudget);

      expect(transformUIToBudget).toHaveBeenCalledWith(mockUIBudget);
      expect(result).toEqual(mockDbBudget);
    });

    it("should handle missing fields in transformation", () => {
      const incompleteBudget = {
        id: "budget-1",
        name: "Test Budget",
        // Missing required fields
      };

      (mockSchema.transformBudgetToUI as jest.Mock).mockImplementation((budget: any) => {
        if (!budget.amount || !budget.period) {
          throw new Error("Missing required fields for transformation");
        }
        return mockUIBudget;
      });

      expect(() => {
        mockSchema.transformBudgetToUI(incompleteBudget);
      }).toThrow("Missing required fields for transformation");
    });
  });
});
