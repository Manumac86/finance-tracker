import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/lib/db/postgres";
import { type DebtSummary } from "@/lib/db/schemas/debt";
import { logAuditEvent, AuditSeverity } from "@/lib/security/audit-logger";

// GET /api/debts/summary - Get debt summary statistics
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active debts and calculate statistics
    const { data: activeDebts, error: debtsError } = await supabase
      .from("debts")
      .select("current_balance, minimum_payment, interest_rate")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (debtsError) {
      console.error("Error fetching active debts:", debtsError);
      throw new Error(`Failed to fetch debts: ${debtsError.message}`);
    }

    const debts = activeDebts || [];
    
    // Calculate stats from the fetched data
    const stats = {
      active_debts_count: debts.length.toString(),
      total_debt: debts.reduce((sum, debt) => sum + (debt.current_balance || 0), 0).toString(),
      total_minimum_payments: debts.reduce((sum, debt) => sum + (debt.minimum_payment || 0), 0).toString(),
      avg_interest_rate: debts.length > 0 
        ? (debts.reduce((sum, debt) => sum + (debt.interest_rate || 0), 0) / debts.length).toString()
        : '0'
    };

    // Calculate weighted average interest rate
    const debtsWithInterest = debts.filter(debt => debt.interest_rate !== null && debt.current_balance > 0);
    const totalBalanceWithInterest = debtsWithInterest.reduce((sum, debt) => sum + debt.current_balance, 0);
    const weightedInterestSum = debtsWithInterest.reduce((sum, debt) => 
      sum + (debt.interest_rate * debt.current_balance), 0);
    
    const weightedInterest = {
      weighted_avg_interest_rate: totalBalanceWithInterest > 0 
        ? (weightedInterestSum / totalBalanceWithInterest).toString()
        : '0'
    };

    // Calculate monthly interest cost
    const monthlyInterestCost = (parseFloat(stats.total_debt || '0') * 
      parseFloat(weightedInterest.weighted_avg_interest_rate || '0')) / 100 / 12;

    // Calculate estimated payoff date (simplified - assumes minimum payments only)
    let estimatedPayoffDate = null;
    let totalInterestToPay = 0;

    if (parseFloat(stats.total_minimum_payments) > 0) {
      // Simple calculation: balance / minimum payment (in months)
      const monthsToPayoff = parseFloat(stats.total_debt) / parseFloat(stats.total_minimum_payments);
      
      if (monthsToPayoff > 0 && monthsToPayoff < 1200) { // Cap at 100 years
        const payoffDate = new Date();
        payoffDate.setMonth(payoffDate.getMonth() + Math.ceil(monthsToPayoff));
        estimatedPayoffDate = payoffDate.toISOString().split('T')[0];
        
        // Rough estimate of total interest
        totalInterestToPay = monthlyInterestCost * monthsToPayoff;
      }
    }

    // Get user's monthly income for debt-to-income ratio (if available)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const startOfThreeMonthsAgo = new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 1);
    const today = new Date();
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const { data: incomeTransactions, error: incomeError } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("transaction_type", "income")
      .gte("transaction_date", startOfThreeMonthsAgo.toISOString().split('T')[0])
      .lt("transaction_date", startOfCurrentMonth.toISOString().split('T')[0]);

    if (incomeError) {
      console.warn("Error fetching income transactions:", incomeError);
    }

    const totalIncome = (incomeTransactions || []).reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyIncome = totalIncome / 3; // Average over 3 months
    const debtToIncomeRatio = monthlyIncome > 0 ? 
      (parseFloat(stats.total_minimum_payments || '0') / monthlyIncome) * 100 : null;

    const summary: DebtSummary = {
      total_debt: parseFloat(stats.total_debt),
      total_minimum_payments: parseFloat(stats.total_minimum_payments),
      total_interest_rate: parseFloat(weightedInterest.weighted_avg_interest_rate || '0'),
      active_debts_count: parseInt(stats.active_debts_count),
      monthly_interest_cost: monthlyInterestCost,
      debt_to_income_ratio: debtToIncomeRatio,
      estimated_payoff_date: estimatedPayoffDate,
      total_interest_to_pay: totalInterestToPay,
    };

    await logAuditEvent({
      user_id: userId,
      event_type: "debt_summary_viewed" as any,
      event_description: "User viewed debt summary",
      severity: AuditSeverity.LOW,
      metadata: {
        total_debt: summary.total_debt,
        active_debts: summary.active_debts_count
      }
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error calculating debt summary:", error);
    return NextResponse.json(
      { error: "Failed to calculate debt summary" },
      { status: 500 }
    );
  }
}