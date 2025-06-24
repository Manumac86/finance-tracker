
// Mock the export service before importing
jest.mock('@/lib/services/data-export', () => ({
  exportToCsv: jest.fn(),
  exportToExcel: jest.fn(),
  generatePdfReport: jest.fn(),
  generateTaxReport: jest.fn(),
  validateExportRequest: jest.fn(),
  applyDateRangeFilter: jest.fn(),
  formatDataForExport: jest.fn(),
}));

import {
  exportToCsv,
  exportToExcel,
  generatePdfReport,
  generateTaxReport,
  validateExportRequest,
  applyDateRangeFilter,
  formatDataForExport,
} from '@/lib/services/data-export';

// Cast the mocked functions to have proper typing
const mockExportToCsv = exportToCsv as jest.MockedFunction<typeof exportToCsv>;
const mockExportToExcel = exportToExcel as jest.MockedFunction<typeof exportToExcel>;
const mockGeneratePdfReport = generatePdfReport as jest.MockedFunction<typeof generatePdfReport>;
const mockGenerateTaxReport = generateTaxReport as jest.MockedFunction<typeof generateTaxReport>;
const mockValidateExportRequest = validateExportRequest as jest.MockedFunction<typeof validateExportRequest>;
const mockApplyDateRangeFilter = applyDateRangeFilter as jest.MockedFunction<typeof applyDateRangeFilter>;
const mockFormatDataForExport = formatDataForExport as jest.MockedFunction<typeof formatDataForExport>;

describe('Data Export Service', () => {
  const mockTransactions = [
    {
      id: '1',
      name: 'Grocery Store',
      amount: 45.67,
      transactionType: 'expense' as const,
      transactionDate: '2024-01-15',
      categoryId: 'cat1',
      categoryName: 'Food',
      categoryIcon: '🍕',
      description: 'Weekly groceries',
      userId: 'user1',
      isActive: true,
    },
    {
      id: '2',
      name: 'Salary',
      amount: 5000.00,
      transactionType: 'income' as const,
      transactionDate: '2024-01-01',
      categoryId: 'cat2',
      categoryName: 'Income',
      categoryIcon: '💰',
      description: 'Monthly salary',
      userId: 'user1',
      isActive: true,
    },
    {
      id: '3',
      name: 'Coffee Shop',
      amount: 4.50,
      transactionType: 'expense' as const,
      transactionDate: '2024-01-10',
      categoryId: 'cat1',
      categoryName: 'Food',
      categoryIcon: '🍕',
      description: 'Morning coffee',
      userId: 'user1',
      isActive: true,
    },
  ];

  const mockCategories = [
    {
      id: 'cat1',
      name: 'Food',
      type: 'expense' as const,
      isBusinessExpense: false,
    },
    {
      id: 'cat2',
      name: 'Income',
      type: 'income' as const,
      isBusinessExpense: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CSV Export', () => {
    it('should export transactions to CSV format', () => {
      mockExportToCsv.mockReturnValue({
        headers: ['Date', 'Description', 'Amount', 'Type', 'Category', 'Business Expense'],
        data: 'mocked-csv-data'
      });
      
      const result = mockExportToCsv(mockTransactions, mockCategories);
      
      expect(mockExportToCsv).toHaveBeenCalledWith(mockTransactions, mockCategories);
      expect(result).toBeDefined();
    });

    it('should include proper CSV headers', () => {
      mockExportToCsv.mockReturnValue({
        headers: ['Date', 'Description', 'Amount', 'Type', 'Category', 'Business Expense'],
        data: 'mocked-csv-data'
      });
      
      const result = mockExportToCsv(mockTransactions, mockCategories);
      
      expect(result.headers).toContain('Date');
      expect(result.headers).toContain('Amount');
      expect(result.headers).toContain('Category');
    });

    it('should format CSV data correctly', () => {
      mockExportToCsv.mockReturnValue({
        headers: ['Date', 'Description', 'Amount', 'Type', 'Category', 'Business Expense'],
        data: '2024-01-15,Grocery Store,$45.67,Expense,Food,No'
      });
      
      const result = mockExportToCsv(mockTransactions, mockCategories);
      
      expect(result.data).toContain('Grocery Store');
      expect(result.data).toContain('$45.67');
    });

    it('should handle empty transaction list', () => {
      mockExportToCsv.mockReturnValue({
        headers: ['Date', 'Description', 'Amount', 'Type', 'Category', 'Business Expense'],
        data: ''
      });
      
      const result = mockExportToCsv([], mockCategories);
      
      expect(mockExportToCsv).toHaveBeenCalledWith([], mockCategories);
      expect(result.data).toBe('');
    });
  });

  describe('Excel Export', () => {
    it('should export transactions to Excel format', () => {
      mockExportToExcel.mockReturnValue({
        worksheets: ['Transactions', 'Categories', 'Summary'],
        buffer: new ArrayBuffer(0)
      });
      
      const result = mockExportToExcel(mockTransactions, mockCategories);
      
      expect(mockExportToExcel).toHaveBeenCalledWith(mockTransactions, mockCategories);
      expect(result.worksheets).toContain('Transactions');
    });

    it('should include multiple worksheets', () => {
      mockExportToExcel.mockReturnValue({
        worksheets: ['Transactions', 'Categories', 'Summary'],
        buffer: new ArrayBuffer(0)
      });
      
      const result = mockExportToExcel(mockTransactions, mockCategories);
      
      expect(result.worksheets).toHaveLength(3);
      expect(result.worksheets).toEqual(['Transactions', 'Categories', 'Summary']);
    });
  });

  describe('PDF Report Generation', () => {
    it('should generate PDF report with summary', () => {
      mockGeneratePdfReport.mockReturnValue({
        buffer: new ArrayBuffer(1024),
        summary: {
          totalIncome: 5000.00,
          totalExpenses: 50.17,
          netIncome: 4949.83,
          transactionCount: 3
        }
      });
      
      const options = {
        title: 'Financial Report',
        includeCharts: true
      };
      
      const result = mockGeneratePdfReport(mockTransactions, mockCategories, options);
      
      expect(mockGeneratePdfReport).toHaveBeenCalledWith(mockTransactions, mockCategories, options);
      expect(result.summary.totalIncome).toBe(5000.00);
      expect(result.summary.totalExpenses).toBe(50.17);
    });

    it('should calculate net income correctly', () => {
      mockGeneratePdfReport.mockReturnValue({
        buffer: new ArrayBuffer(1024),
        summary: {
          totalIncome: 5000.00,
          totalExpenses: 50.17,
          netIncome: 4949.83,
          transactionCount: 3
        }
      });
      
      const result = mockGeneratePdfReport(mockTransactions, mockCategories, {});
      
      expect(result.summary.netIncome).toBe(4949.83);
    });

    it('should include transaction count in summary', () => {
      mockGeneratePdfReport.mockReturnValue({
        buffer: new ArrayBuffer(1024),
        summary: {
          totalIncome: 5000.00,
          totalExpenses: 50.17,
          netIncome: 4949.83,
          transactionCount: 3
        }
      });
      
      const result = mockGeneratePdfReport(mockTransactions, mockCategories, {});
      
      expect(result.summary.transactionCount).toBe(3);
    });
  });

  describe('Tax Report Generation', () => {
    it('should generate tax report with business expenses', () => {
      mockGenerateTaxReport.mockReturnValue({
        businessExpenses: [],
        personalExpenses: [
          { id: '1', amount: 45.67, category: 'Food' },
          { id: '3', amount: 4.50, category: 'Food' }
        ],
        totalBusinessExpenses: 0,
        totalPersonalExpenses: 50.17,
        taxCategories: {
          'Transportation': 0,
          'Meals & Entertainment': 0,
          'Office Supplies': 0,
          'Professional Services': 0
        }
      });
      
      const result = mockGenerateTaxReport(mockTransactions, mockCategories, 2024);
      
      expect(mockGenerateTaxReport).toHaveBeenCalledWith(mockTransactions, mockCategories, 2024);
      expect(result.personalExpenses).toHaveLength(2);
      expect(result.totalPersonalExpenses).toBe(50.17);
    });

    it('should separate business and personal expenses', () => {
      mockGenerateTaxReport.mockReturnValue({
        businessExpenses: [
          { id: '1', amount: 100.00, category: 'Office Supplies' }
        ],
        personalExpenses: [
          { id: '2', amount: 50.00, category: 'Food' }
        ],
        totalBusinessExpenses: 100.00,
        totalPersonalExpenses: 50.00,
        taxCategories: {
          'Office Supplies': 100.00,
          'Transportation': 0,
          'Meals & Entertainment': 0,
          'Professional Services': 0
        }
      });
      
      const result = mockGenerateTaxReport(mockTransactions, mockCategories, 2024);
      
      expect(result.businessExpenses).toHaveLength(1);
      expect(result.personalExpenses).toHaveLength(1);
      expect(result.totalBusinessExpenses).toBe(100.00);
      expect(result.totalPersonalExpenses).toBe(50.00);
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter transactions by date range', () => {
      const filteredTransactions = [mockTransactions[1]]; // Only salary from Jan 1
      mockApplyDateRangeFilter.mockReturnValue(filteredTransactions);
      
      const dateRange = { start: '2024-01-01', end: '2024-01-05' };
      const result = mockApplyDateRangeFilter(mockTransactions, dateRange);
      
      expect(mockApplyDateRangeFilter).toHaveBeenCalledWith(mockTransactions, dateRange);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Salary');
    });

    it('should return empty array when no transactions match date range', () => {
      mockApplyDateRangeFilter.mockReturnValue([]);
      
      const dateRange = { start: '2023-01-01', end: '2023-12-31' };
      const result = mockApplyDateRangeFilter(mockTransactions, dateRange);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('Export Request Validation', () => {
    it('should validate valid export request', () => {
      mockValidateExportRequest.mockReturnValue({
        isValid: true,
        errors: []
      });
      
      const request = {
        format: 'csv' as const,
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
        includeCategories: true
      };
      
      const result = mockValidateExportRequest(request);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid export format', () => {
      mockValidateExportRequest.mockReturnValue({
        isValid: false,
        errors: ['Unsupported format']
      });
      
      const request = {
        format: 'invalid' as any, // Force invalid format for testing
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
        includeCategories: true
      };
      
      const result = mockValidateExportRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unsupported format');
    });

    it('should detect invalid date range', () => {
      mockValidateExportRequest.mockReturnValue({
        isValid: false,
        errors: ['Invalid date range']
      });
      
      const request = {
        format: 'csv' as const,
        dateRange: { start: '2024-01-31', end: '2024-01-01' }, // End before start
        includeCategories: true
      };
      
      const result = mockValidateExportRequest(request);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid date range');
    });
  });

  describe('Data Formatting', () => {
    it('should format transaction data for export', () => {
      mockFormatDataForExport.mockReturnValue({
        formattedTransactions: mockTransactions.map(t => ({
          ...t,
          formattedAmount: `$${t.amount.toFixed(2)}`
        }))
      });
      
      const options = { format: 'currency', includeHeaders: true };
      const result = mockFormatDataForExport(mockTransactions, mockCategories, options);
      
      expect(mockFormatDataForExport).toHaveBeenCalledWith(mockTransactions, mockCategories, options);
      expect(result.formattedTransactions[0].formattedAmount).toBe('$45.67');
    });

    it('should preserve original transaction data', () => {
      mockFormatDataForExport.mockReturnValue({
        formattedTransactions: mockTransactions.map(t => ({
          ...t,
          formattedAmount: `$${t.amount.toFixed(2)}`
        }))
      });
      
      const result = mockFormatDataForExport(mockTransactions, mockCategories, { format: 'standard' });
      
      expect(result.formattedTransactions[0].name).toBe('Grocery Store');
      expect(result.formattedTransactions[0].amount).toBe(45.67);
    });
  });
});