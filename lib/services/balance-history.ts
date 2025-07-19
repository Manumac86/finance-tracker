import { supabase } from "@/lib/db/postgres";
import {
  subDays,
  subYears,
  startOfMonth,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  startOfDay,
} from "date-fns";

export interface BalanceDataPoint {
  date: string;
  balance: number;
}

export interface BalanceHistoryOptions {
  userId: string;
  period: "year" | "month" | "week";
}

interface TransactionSummary {
  date: string;
  net_amount: number;
}

interface BalanceChangeRow {
  transaction_date: string;
  net_amount: number;
}

/**
 * Get the current total balance from all manual accounts
 */
async function getCurrentAccountBalance(userId: string): Promise<number> {
  const { data: accounts, error } = await supabase
    .from("manual_accounts")
    .select("current_balance, is_active, include_in_totals")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to fetch account balances: ${error.message}`);
  }

  return (accounts || [])
    .filter(account => account.is_active && account.include_in_totals)
    .reduce((total, account) => total + (account.current_balance || 0), 0);
}

/**
 * Get the initial balance before the start date
 * Now uses account balance minus future transactions for historical accuracy
 */
async function getInitialBalance(
  userId: string,
  beforeDate: string
): Promise<number> {
  console.log("[Initial balance] beforeDate", beforeDate);
  console.log("[Initial balance] userId", userId);
  
  // Get current account balance
  const currentAccountBalance = await getCurrentAccountBalance(userId);
  console.log("[Initial balance] currentAccountBalance", currentAccountBalance);
  
  // Get all transactions from the beforeDate to now
  const { data: futureTransactions, error: txError } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("is_active", true)
    .gte("transaction_date", beforeDate);

  if (txError) {
    throw new Error(`Failed to fetch future transactions: ${txError.message}`);
  }

  // Calculate the sum of future transactions
  const futureTransactionsSum = (futureTransactions || []).reduce((sum, tx) => {
    return sum + Number(tx.amount);
  }, 0);

  console.log("[Initial balance] futureTransactionsSum", futureTransactionsSum);
  
  // Initial balance = current account balance - future transactions
  const initialBalance = currentAccountBalance - futureTransactionsSum;
  console.log("[Initial balance] calculated initialBalance", initialBalance);
  
  return initialBalance;
}

/**
 * Get daily transaction summaries for the period
 */
async function getDailyTransactionSummaries(
  userId: string,
  startDate: string,
  endDate: string
): Promise<TransactionSummary[]> {
  const { data, error } = await supabase.rpc("get_daily_balance_changes", {
    p_user_id: userId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    // Fallback to manual calculation if RPC doesn't exist
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select(
        `
        transaction_date,
        transaction_type,
        amount
      `
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate)
      .order("transaction_date", { ascending: true });

    if (txError) {
      throw new Error(`Failed to fetch transactions: ${txError.message}`);
    }

    // Group by date and calculate net amount
    const dailySummaries = new Map<string, number>();

    for (const transaction of transactions || []) {
      const date = transaction.transaction_date;
      const amount = Number(transaction.amount);
      const netAmount = amount;

      dailySummaries.set(date, (dailySummaries.get(date) || 0) + netAmount);
    }

    return Array.from(dailySummaries.entries()).map(([date, net_amount]) => ({
      date,
      net_amount,
    }));
  }

  return (data || []).map((row: BalanceChangeRow) => ({
    date: row.transaction_date,
    net_amount: Number(row.net_amount),
  }));
}

/**
 * Generate date range based on period
 */
function getDateRange(period: "year" | "month" | "week") {
  const today = new Date();
  const endDate = today;
  let startDate: Date;

  switch (period) {
    case "year":
      startDate = subYears(endDate, 1);
      break;
    case "month":
      startDate = startOfMonth(endDate);
      break;
    case "week":
      startDate = subDays(endDate, 7);
      break;
  }

  return { startDate, endDate };
}

/**
 * Build data points for year view (monthly aggregation)
 */
function buildYearDataPoints(
  startDate: Date,
  endDate: Date,
  initialBalance: number,
  dailySummaries: TransactionSummary[]
): BalanceDataPoint[] {
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  // Sort summaries by date to process chronologically
  const sortedSummaries = dailySummaries.sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const dataPoints: BalanceDataPoint[] = [];
  let currentBalance = initialBalance;
  let summaryIndex = 0;

  for (const monthStart of months) {
    const monthEnd = endOfMonth(monthStart);
    const monthEndStr = format(monthEnd, "yyyy-MM-dd");

    // Process all transactions up to the end of this month
    while (
      summaryIndex < sortedSummaries.length &&
      sortedSummaries[summaryIndex].date <= monthEndStr
    ) {
      currentBalance += sortedSummaries[summaryIndex].net_amount;
      summaryIndex++;
    }

    dataPoints.push({
      date: format(monthStart, "MMM yyyy"),
      balance: currentBalance,
    });
  }

  return dataPoints;
}

/**
 * Build data points for day-based views (daily points)
 */
function buildDailyDataPoints(
  startDate: Date,
  endDate: Date,
  initialBalance: number,
  dailySummaries: TransactionSummary[]
): BalanceDataPoint[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const summaryMap = new Map(
    dailySummaries.map((s) => [format(s.date, "yyyy-MM-dd"), s.net_amount])
  );

  const dataPoints: BalanceDataPoint[] = [];
  let currentBalance = initialBalance;

  for (const day of days) {
    const dateStr = format(day, "yyyy-MM-dd");
    const netAmount = summaryMap.get(dateStr) || 0;

    currentBalance += netAmount;

    const dataPoint = {
      date: format(day, "MMM d"),
      balance: currentBalance,
    };

    dataPoints.push(dataPoint);
  }

  return dataPoints;
}

/**
 * Calculate balance history over time from transactions
 * This provides the running balance at each day for charting
 * Now ensures the final balance matches current account balances
 */
export async function getBalanceHistory({
  userId,
  period,
}: BalanceHistoryOptions): Promise<BalanceDataPoint[]> {
  try {
    const { startDate, endDate } = getDateRange(period);
    const startDateStr = format(startOfDay(startDate), "yyyy-MM-dd");
    const endDateStr = format(startOfDay(endDate), "yyyy-MM-dd");

    // Get initial balance, current account balance, and transaction summaries in parallel
    const [initialBalance, currentAccountBalance, dailySummaries] = await Promise.all([
      getInitialBalance(userId, startDateStr),
      getCurrentAccountBalance(userId),
      getDailyTransactionSummaries(userId, startDateStr, endDateStr),
    ]);

    console.log("[Balance history] dailySummaries", dailySummaries);
    console.log("[Balance history] initialBalance", initialBalance);
    console.log("[Balance history] currentAccountBalance", currentAccountBalance);

    // Build data points based on period
    let dataPoints: BalanceDataPoint[];
    if (period === "year") {
      dataPoints = buildYearDataPoints(
        startDate,
        endDate,
        initialBalance,
        dailySummaries
      );
    } else {
      dataPoints = buildDailyDataPoints(
        startDate,
        endDate,
        initialBalance,
        dailySummaries
      );
      
      // For month view, extend to end of month with current balance for future dates
      if (period === "month") {
        const monthEnd = endOfMonth(new Date());
        
        if (endDate < monthEnd) {
          const futureDays = eachDayOfInterval({ 
            start: new Date(endDate.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
            end: monthEnd 
          });
          
          for (const day of futureDays) {
            dataPoints.push({
              date: format(day, "MMM d"),
              balance: currentAccountBalance, // Use actual current balance for future dates
            });
          }
        }
      }
    }

    // Ensure the last data point reflects the current account balance
    if (dataPoints.length > 0) {
      dataPoints[dataPoints.length - 1].balance = currentAccountBalance;
    }

    return dataPoints;
  } catch (error) {
    console.error("Failed to calculate balance history:", error);
    throw new Error("Failed to calculate balance history");
  }
}
