import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { selectTransactions } from "@/lib/db/postgres";
import { transformTransactionToUI } from "@/lib/db/schemas/transaction";
import { searchTransactions } from "@/lib/services/transaction-search";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { filters = {}, page = 1, limit = 10 } = body;

    // Get all user transactions first
    const allTransactions = await selectTransactions(userId, 1000); // Get more for filtering
    const uiTransactions = allTransactions.map(transformTransactionToUI);

    // Apply search filters
    const filteredTransactions = searchTransactions(uiTransactions, filters);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    const totalCount = filteredTransactions.length;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      transactions: paginatedTransactions,
      totalCount,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  } catch (error) {
    console.error("Error searching transactions:", error);
    
    return NextResponse.json(
      { error: "Failed to search transactions" },
      { status: 500 }
    );
  }
}