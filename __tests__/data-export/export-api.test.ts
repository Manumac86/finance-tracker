import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db/postgres', () => ({
  selectTransactions: jest.fn(),
  selectCategories: jest.fn(),
}));

jest.mock('@/lib/db/schemas/transaction', () => ({
  transformTransactionToUI: jest.fn(),
}));

jest.mock('@/lib/services/data-export', () => ({
  exportToCsv: jest.fn(),
  generatePdfReport: jest.fn(),
  generateTaxReport: jest.fn(),
  applyDateRangeFilter: jest.fn(),
  validateExportRequest: jest.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { selectTransactions, selectCategories } from '@/lib/db/postgres';
import { transformTransactionToUI } from '@/lib/db/schemas/transaction';
import * as dataExport from '@/lib/services/data-export';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockSelectTransactions = selectTransactions as jest.MockedFunction<typeof selectTransactions>;
const mockSelectCategories = selectCategories as jest.MockedFunction<typeof selectCategories>;
const mockTransformTransactionToUI = transformTransactionToUI as jest.MockedFunction<typeof transformTransactionToUI>;
const mockDataExport = dataExport as jest.Mocked<typeof dataExport>;

describe('Export API Endpoints', () => {
  const mockTransactions = [
    {
      id: '1',
      name: 'Test Transaction',
      amount: 100,
      transaction_type: 'expense',
      transaction_date: '2024-01-15',
      category_id: 'cat1',
    }
  ];

  const mockCategories = [
    {
      id: 'cat1',
      name: 'Test Category',
      type: 'expense',
      is_business_expense: false,
    }
  ];

  const mockUITransactions = [
    {
      id: '1',
      name: 'Test Transaction',
      amount: 100,
      transactionType: 'expense',
      transactionDate: '2024-01-15',
      categoryId: 'cat1',
      userId: 'user1',
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAuth.mockResolvedValue({ userId: 'user1' });
    mockSelectTransactions.mockResolvedValue(mockTransactions);
    mockSelectCategories.mockResolvedValue(mockCategories);
    mockTransformTransactionToUI.mockReturnValue(mockUITransactions[0]);
    mockDataExport.validateExportRequest.mockReturnValue({ isValid: true, errors: [] });
  });

  describe('CSV Export API', () => {
    it('should export transactions to CSV successfully', async () => {
      mockDataExport.exportToCsv.mockReturnValue({
        headers: ['Date', 'Description', 'Amount'],
        data: '2024-01-15,Test Transaction,100.00'
      });

      const { POST } = await import('@/app/api/export/csv/route');
      
      const request = new NextRequest('http://localhost/api/export/csv', {
        method: 'POST',
        body: JSON.stringify({
          dateRange: { start: '2024-01-01', end: '2024-01-31' },
          includeCategories: true,
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="transactions.csv"');
    });

    it('should require authentication', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const { POST } = await import('@/app/api/export/csv/route');
      
      const request = new NextRequest('http://localhost/api/export/csv', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should validate export request', async () => {
      mockDataExport.validateExportRequest.mockReturnValue({
        isValid: false,
        errors: ['Invalid date range']
      });

      const { POST } = await import('@/app/api/export/csv/route');
      
      const request = new NextRequest('http://localhost/api/export/csv', {
        method: 'POST',
        body: JSON.stringify({
          dateRange: { start: '2024-01-31', end: '2024-01-01' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toEqual(['Invalid date range']);
    });

    it('should apply date range filter when provided', async () => {
      mockDataExport.applyDateRangeFilter.mockReturnValue(mockUITransactions);
      mockDataExport.exportToCsv.mockReturnValue({
        headers: ['Date', 'Description', 'Amount'],
        data: 'filtered,data'
      });

      const { POST } = await import('@/app/api/export/csv/route');
      
      const dateRange = { start: '2024-01-01', end: '2024-01-15' };
      const request = new NextRequest('http://localhost/api/export/csv', {
        method: 'POST',
        body: JSON.stringify({ dateRange }),
      });

      await POST(request);
      
      expect(mockDataExport.applyDateRangeFilter).toHaveBeenCalledWith(mockUITransactions, dateRange);
    });

    it('should handle export service errors', async () => {
      mockDataExport.exportToCsv.mockImplementation(() => {
        throw new Error('Export service error');
      });

      const { POST } = await import('@/app/api/export/csv/route');
      
      const request = new NextRequest('http://localhost/api/export/csv', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to export CSV');
    });
  });

  describe('PDF Export API', () => {
    it('should generate PDF report successfully', async () => {
      const mockPdfBuffer = new ArrayBuffer(1024);
      mockDataExport.generatePdfReport.mockReturnValue({
        buffer: mockPdfBuffer,
        summary: { totalIncome: 1000, totalExpenses: 500, netIncome: 500, transactionCount: 10 }
      });

      const { POST } = await import('@/app/api/export/pdf/route');
      
      const request = new NextRequest('http://localhost/api/export/pdf', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Report',
          includeCharts: true,
        }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="financial-report.pdf"');
    });

    it('should use default title when not provided', async () => {
      const mockPdfBuffer = new ArrayBuffer(1024);
      mockDataExport.generatePdfReport.mockReturnValue({
        buffer: mockPdfBuffer,
        summary: { totalIncome: 0, totalExpenses: 0, netIncome: 0, transactionCount: 0 }
      });

      const { POST } = await import('@/app/api/export/pdf/route');
      
      const request = new NextRequest('http://localhost/api/export/pdf', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      await POST(request);
      
      expect(mockDataExport.generatePdfReport).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        expect.objectContaining({
          title: 'Financial Report',
          includeCharts: true,
        })
      );
    });
  });

  describe('Tax Report API', () => {
    it('should generate tax report successfully', async () => {
      const mockTaxReport = {
        businessExpenses: [{ id: '1', amount: 100, category: 'Office' }],
        personalExpenses: [{ id: '2', amount: 50, category: 'Food' }],
        totalBusinessExpenses: 100,
        totalPersonalExpenses: 50,
        taxCategories: { 'Office': 100 },
      };
      
      mockDataExport.generateTaxReport.mockReturnValue(mockTaxReport);

      const { POST } = await import('@/app/api/export/tax/route');
      
      const request = new NextRequest('http://localhost/api/export/tax', {
        method: 'POST',
        body: JSON.stringify({ taxYear: 2024 }),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.taxYear).toBe(2024);
      expect(data.businessExpenses).toEqual(mockTaxReport.businessExpenses);
      expect(data.personalExpenses).toEqual(mockTaxReport.personalExpenses);
      expect(data.summary).toBeDefined();
    });

    it('should use current year as default tax year', async () => {
      const currentYear = new Date().getFullYear();
      mockDataExport.generateTaxReport.mockReturnValue({
        businessExpenses: [],
        personalExpenses: [],
        totalBusinessExpenses: 0,
        totalPersonalExpenses: 0,
        taxCategories: {},
      });

      const { POST } = await import('@/app/api/export/tax/route');
      
      const request = new NextRequest('http://localhost/api/export/tax', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(data.taxYear).toBe(currentYear);
    });

    it('should create date range for full tax year when not provided', async () => {
      const taxYear = 2024;
      mockDataExport.applyDateRangeFilter.mockReturnValue(mockUITransactions);
      mockDataExport.generateTaxReport.mockReturnValue({
        businessExpenses: [],
        personalExpenses: [],
        totalBusinessExpenses: 0,
        totalPersonalExpenses: 0,
        taxCategories: {},
      });

      const { POST } = await import('@/app/api/export/tax/route');
      
      const request = new NextRequest('http://localhost/api/export/tax', {
        method: 'POST',
        body: JSON.stringify({ taxYear }),
      });

      await POST(request);
      
      expect(mockDataExport.applyDateRangeFilter).toHaveBeenCalledWith(
        mockUITransactions,
        { start: '2024-01-01', end: '2024-12-31' }
      );
    });

    it('should include summary statistics in tax report', async () => {
      const mockIncomeTransactions = [
        { ...mockUITransactions[0], transactionType: 'income', amount: 2000 }
      ];
      mockTransformTransactionToUI.mockReturnValue(mockIncomeTransactions[0]);
      mockDataExport.applyDateRangeFilter.mockReturnValue(mockIncomeTransactions);
      mockDataExport.generateTaxReport.mockReturnValue({
        businessExpenses: [],
        personalExpenses: [],
        totalBusinessExpenses: 0,
        totalPersonalExpenses: 0,
        taxCategories: {},
      });

      const { POST } = await import('@/app/api/export/tax/route');
      
      const request = new NextRequest('http://localhost/api/export/tax', {
        method: 'POST',
        body: JSON.stringify({ taxYear: 2024 }),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(data.summary).toEqual({
        totalTransactions: 1,
        businessExpenseCount: 0,
        personalExpenseCount: 0,
        totalIncome: 2000,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      mockSelectTransactions.mockRejectedValue(new Error('Database error'));

      const { POST } = await import('@/app/api/export/csv/route');
      
      const request = new NextRequest('http://localhost/api/export/csv', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to export CSV');
    });

    it('should handle invalid JSON in request body', async () => {
      const { POST } = await import('@/app/api/export/csv/route');
      
      const request = new NextRequest('http://localhost/api/export/csv', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to export CSV');
    });
  });
});