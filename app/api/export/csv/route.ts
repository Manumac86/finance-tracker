import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { selectTransactions, selectCategories } from "@/lib/db/postgres";
import { transformTransactionToUI } from "@/lib/db/schemas/transaction";
import { 
  exportToCsv, 
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
    const { dateRange, includeCategories = true } = body;

    // Validate export request
    const validation = validateExportRequest({
      format: 'csv',
      dateRange,
      includeCategories
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
    
    // Apply date range filter if provided
    const filteredTransactions = dateRange 
      ? applyDateRangeFilter(uiTransactions, dateRange)
      : uiTransactions;

    // Convert categories to export format
    const exportCategories = allCategories.map(cat => ({
      id: cat.id!,
      name: cat.name,
      type: cat.type as 'income' | 'expense',
      isBusinessExpense: cat.is_business_expense || false
    }));

    // Generate CSV
    const csvResult = exportToCsv(filteredTransactions, exportCategories);

    // Set response headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv');
    headers.set('Content-Disposition', 'attachment; filename="transactions.csv"');

    return new NextResponse(csvResult.data, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error("Error exporting CSV:", error);
    
    return NextResponse.json(
      { error: "Failed to export CSV" },
      { status: 500 }
    );
  }
}