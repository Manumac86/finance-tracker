
// Mock jsPDF and jspdf-autotable
const mockJsPDF = {
  setFontSize: jest.fn(),
  text: jest.fn(),
  output: jest.fn().mockReturnValue(new Blob(['mock pdf content'], { type: 'application/pdf' })),
  autoTable: jest.fn(),
};

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => mockJsPDF),
}));

jest.mock('jspdf-autotable', () => ({}));

describe('PDF Generator', () => {
  const mockTransactions = [
    {
      id: '1',
      userId: 'user1',
      name: 'Grocery Store',
      amount: 45.67,
      transactionType: 'expense' as const,
      transactionDate: '2024-01-15',
      categoryId: 'cat1',
      categoryName: 'Groceries',
      categoryIcon: '🛒',
      description: 'Weekly groceries',
      isActive: true,
    },
    {
      id: '2',
      userId: 'user1',
      name: 'Salary',
      amount: 5000.00,
      transactionType: 'income' as const,
      transactionDate: '2024-01-01',
      categoryId: 'cat2',
      categoryName: 'Salary',
      categoryIcon: '💰',
      description: 'Monthly salary',
      isActive: true,
    },
  ];

  const mockCategories = [
    { 
      id: 'cat1', 
      name: 'Groceries', 
      type: 'expense' as const,
      isBusinessExpense: false
    },
    { 
      id: 'cat2', 
      name: 'Salary', 
      type: 'income' as const,
      isBusinessExpense: false
    },
  ];

  const mockOptions = {
    title: 'Test Financial Report',
    dateRange: { start: '2024-01-01', end: '2024-01-31' },
    includeCharts: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PDF Generation', () => {
    it('should generate a PDF blob', async () => {
      const { generateClientSidePdf } = await import('@/lib/services/pdf-generator');
      
      const result = await generateClientSidePdf(mockTransactions, mockCategories, mockOptions);
      
      expect(result).toBeInstanceOf(Blob);
      expect(mockJsPDF.setFontSize).toHaveBeenCalled();
      expect(mockJsPDF.text).toHaveBeenCalled();
      expect(mockJsPDF.output).toHaveBeenCalledWith('blob');
    });

    it('should set the report title', async () => {
      const { generateClientSidePdf } = await import('@/lib/services/pdf-generator');
      
      await generateClientSidePdf(mockTransactions, mockCategories, mockOptions);
      
      expect(mockJsPDF.text).toHaveBeenCalledWith('Test Financial Report', 20, 20);
    });

    it('should include date range information', async () => {
      const { generateClientSidePdf } = await import('@/lib/services/pdf-generator');
      
      await generateClientSidePdf(mockTransactions, mockCategories, mockOptions);
      
      expect(mockJsPDF.text).toHaveBeenCalledWith('From: 2024-01-01 To: 2024-01-31', 20, 35);
    });

    it('should calculate and display summary statistics', async () => {
      const { generateClientSidePdf } = await import('@/lib/services/pdf-generator');
      
      await generateClientSidePdf(mockTransactions, mockCategories, mockOptions);
      
      // Check that summary calculations are displayed
      expect(mockJsPDF.text).toHaveBeenCalledWith('Total Income: $5000.00', 20, 60);
      expect(mockJsPDF.text).toHaveBeenCalledWith('Total Expenses: $45.67', 20, 70);
      expect(mockJsPDF.text).toHaveBeenCalledWith('Net Income: $4954.33', 20, 80);
      expect(mockJsPDF.text).toHaveBeenCalledWith('Total Transactions: 2', 20, 90);
    });

    it('should create a transactions table', async () => {
      const { generateClientSidePdf } = await import('@/lib/services/pdf-generator');
      
      await generateClientSidePdf(mockTransactions, mockCategories, mockOptions);
      
      expect(mockJsPDF.autoTable).toHaveBeenCalledWith({
        startY: 100,
        head: [['Date', 'Description', 'Amount', 'Category', 'Notes']],
        body: [
          ['2024-01-15', 'Grocery Store', '-$45.67', 'Groceries', 'Weekly groceries'],
          ['2024-01-01', 'Salary', '+$5000.00', 'Salary', 'Monthly salary']
        ],
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          2: { halign: 'right' }
        }
      });
    });

    it('should handle transactions without categories', async () => {
      const { generateClientSidePdf } = await import('@/lib/services/pdf-generator');
      
      const transactionsWithoutCategory = [
        {
          ...mockTransactions[0],
          categoryId: 'nonexistent',
        }
      ];
      
      await generateClientSidePdf(transactionsWithoutCategory, mockCategories, mockOptions);
      
      expect(mockJsPDF.autoTable).toHaveBeenCalledWith(
        expect.objectContaining({
          body: [
            ['2024-01-15', 'Grocery Store', '-$45.67', 'Uncategorized', 'Weekly groceries']
          ]
        })
      );
    });

    it('should use default title when none provided', async () => {
      const { generateClientSidePdf } = await import('@/lib/services/pdf-generator');
      
      const optionsWithoutTitle = { ...mockOptions, title: undefined };
      
      await generateClientSidePdf(mockTransactions, mockCategories, optionsWithoutTitle);
      
      expect(mockJsPDF.text).toHaveBeenCalledWith('Financial Report', 20, 20);
    });

    it('should handle empty transactions array', async () => {
      const { generateClientSidePdf } = await import('@/lib/services/pdf-generator');
      
      await generateClientSidePdf([], mockCategories, mockOptions);
      
      expect(mockJsPDF.text).toHaveBeenCalledWith('Total Income: $0.00', 20, 60);
      expect(mockJsPDF.text).toHaveBeenCalledWith('Total Expenses: $0.00', 20, 70);
      expect(mockJsPDF.text).toHaveBeenCalledWith('Net Income: $0.00', 20, 80);
      expect(mockJsPDF.text).toHaveBeenCalledWith('Total Transactions: 0', 20, 90);
    });

    it('should format amounts correctly for income and expenses', async () => {
      const { generateClientSidePdf } = await import('@/lib/services/pdf-generator');
      
      await generateClientSidePdf(mockTransactions, mockCategories, mockOptions);
      
      const autoTableCall = mockJsPDF.autoTable.mock.calls[0][0];
      const tableBody = autoTableCall.body;
      
      // Expense should have negative sign
      expect(tableBody[0][2]).toBe('-$45.67');
      // Income should have positive sign
      expect(tableBody[1][2]).toBe('+$5000.00');
    });

    it('should limit transactions to 50 items for table display', async () => {
      const { generateClientSidePdf } = await import('@/lib/services/pdf-generator');
      
      // Create 60 transactions
      const manyTransactions = Array.from({ length: 60 }, (_, i) => ({
        ...mockTransactions[0],
        id: `transaction-${i}`,
        name: `Transaction ${i}`,
      }));
      
      await generateClientSidePdf(manyTransactions, mockCategories, mockOptions);
      
      const autoTableCall = mockJsPDF.autoTable.mock.calls[0][0];
      const tableBody = autoTableCall.body;
      
      // Should be limited to 50 transactions
      expect(tableBody).toHaveLength(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle PDF generation errors gracefully', async () => {
      mockJsPDF.output.mockImplementationOnce(() => {
        throw new Error('PDF generation failed');
      });
      
      const { generateClientSidePdf } = await import('@/lib/services/pdf-generator');
      
      await expect(generateClientSidePdf(mockTransactions, mockCategories, mockOptions))
        .rejects.toThrow('PDF generation failed');
    });

    it('should handle missing transaction descriptions', async () => {
      const { generateClientSidePdf } = await import('@/lib/services/pdf-generator');
      
      const transactionsWithoutDescription = [
        {
          ...mockTransactions[0],
          description: undefined,
        }
      ];
      
      await generateClientSidePdf(transactionsWithoutDescription, mockCategories, mockOptions);
      
      const autoTableCall = mockJsPDF.autoTable.mock.calls[0][0];
      const tableBody = autoTableCall.body;
      
      expect(tableBody[0][4]).toBe('');
    });
  });

  describe('Dynamic Import Handling', () => {
    it('should properly import jsPDF and jspdf-autotable', async () => {
      // This test ensures the dynamic imports work correctly
      const { generateClientSidePdf } = await import('@/lib/services/pdf-generator');
      
      expect(generateClientSidePdf).toBeDefined();
      expect(typeof generateClientSidePdf).toBe('function');
    });
  });
});