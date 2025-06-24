import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { selectTransactions, selectCategories } from "@/lib/db/postgres";
import { transformTransactionToUI } from "@/lib/db/schemas/transaction";
import { 
  generateTaxReport, 
  applyDateRangeFilter, 
  validateExportRequest 
} from "@/lib/services/data-export";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { taxYear = new Date().getFullYear(), dateRange } = body;

    // If no date range provided, use the full tax year
    const effectiveDateRange = dateRange || {
      start: `${taxYear}-01-01`,
      end: `${taxYear}-12-31`
    };

    // Validate export request
    const validation = validateExportRequest({
      format: 'csv', // Tax reports are typically CSV/Excel format
      dateRange: effectiveDateRange
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Get user data
    const [allTransactions, allCategories] = await Promise.all([
      selectTransactions(userId, 1000),
      selectCategories()
    ]);

    const uiTransactions = allTransactions.map(transformTransactionToUI);
    
    // Apply date range filter for tax year
    const filteredTransactions = applyDateRangeFilter(uiTransactions, effectiveDateRange);

    // Convert categories to export format
    const exportCategories = allCategories.map(cat => ({
      id: cat.id!,
      name: cat.name,
      type: cat.type as 'income' | 'expense',
      isBusinessExpense: cat.is_business_expense || false
    }));

    // Generate tax report
    const taxReport = generateTaxReport(filteredTransactions, exportCategories, taxYear);

    return NextResponse.json({
      taxYear,
      dateRange: effectiveDateRange,
      ...taxReport,
      summary: {
        totalTransactions: filteredTransactions.length,
        businessExpenseCount: taxReport.businessExpenses.length,
        personalExpenseCount: taxReport.personalExpenses.length,
        totalIncome: filteredTransactions
          .filter(t => t.transactionType === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
      }
    });

  } catch (error) {
    console.error("Error generating tax report:", error);
    
    return NextResponse.json(
      { error: "Failed to generate tax report" },
      { status: 500 }
    );
  }
}