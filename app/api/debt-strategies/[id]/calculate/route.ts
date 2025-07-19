import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { query } from "@/lib/db/postgres";
import { 
  transformStrategyFromDb,
  type StrategyCalculation,
  type PayoffCalculation 
} from "@/lib/db/schemas/debt";
import { logAuditEvent, AuditSeverity } from "@/lib/security/audit-logger";

// POST /api/debt-strategies/[id]/calculate - Calculate payoff timeline
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: strategyId } = await params;
    const body = await request.json();
    const { extra_payment_amount = 0 } = body;

    // Get strategy details
    interface DbStrategyResult {
      id: string;
      user_id: string;
      name: string;
      strategy_type: string;
      target_date?: Date;
      extra_payment_amount: number;
      debt_order: string[] | null;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
      [key: string]: unknown;
    }

    const strategyResult = await query<DbStrategyResult>(
      "SELECT * FROM debt_payoff_strategies WHERE id = $1 AND user_id = $2",
      [strategyId, userId]
    );

    if (strategyResult.length === 0) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 });
    }

    const strategy = transformStrategyFromDb(strategyResult[0]);

    // Get debts in strategy order
    if (!strategy.debt_order || strategy.debt_order.length === 0) {
      return NextResponse.json(
        { error: "Strategy has no debts configured" },
        { status: 400 }
      );
    }

    interface DbDebtResult {
      id: string;
      name: string;
      current_balance: string;
      interest_rate: string | null;
      minimum_payment: string | null;
      debt_type: string;
    }

    const debtsResult = await query<DbDebtResult>(`
      SELECT 
        id, name, current_balance, interest_rate, minimum_payment, debt_type
      FROM debts 
      WHERE id = ANY($1) AND user_id = $2 AND is_active = true
      ORDER BY array_position($1, id)
    `, [strategy.debt_order, userId]);

    const debts = debtsResult.map(debt => ({
      id: debt.id,
      name: debt.name,
      balance: parseFloat(debt.current_balance),
      interestRate: parseFloat(debt.interest_rate || '0'),
      minimumPayment: parseFloat(debt.minimum_payment || '0'),
      debt_type: debt.debt_type,
    }));

    if (debts.length === 0) {
      return NextResponse.json(
        { error: "No active debts found for this strategy" },
        { status: 400 }
      );
    }

    // Calculate payoff timeline
    const calculation = calculatePayoffTimeline(debts, extra_payment_amount);

    const result: StrategyCalculation = {
      strategy_id: strategyId,
      total_months: calculation.totalMonths,
      total_interest_saved: calculation.totalInterestSaved,
      total_payments: calculation.totalPayments,
      completion_date: calculation.completionDate,
      debt_calculations: calculation.debtCalculations,
      monthly_breakdown: calculation.monthlyBreakdown,
    };

    await logAuditEvent({
      user_id: userId,
      event_type: "debt_strategy_calculated" as any,
      event_description: "User calculated debt strategy payoff timeline",
      severity: AuditSeverity.LOW,
      metadata: {
        strategy_id: strategyId,
        extra_payment: extra_payment_amount,
        total_months: calculation.totalMonths
      }
    });

    return NextResponse.json({ calculation: result });
  } catch (error) {
    console.error("Error calculating payoff strategy:", error);
    return NextResponse.json(
      { error: "Failed to calculate payoff timeline" },
      { status: 500 }
    );
  }
}

interface DebtData {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  debt_type: string;
}

interface MonthlyBreakdown {
  month: number;
  date: string;
  total_payment: number;
  remaining_balance: number;
  debts_paid_off: string[];
}

// Payoff calculation logic
function calculatePayoffTimeline(debts: DebtData[], extraPayment: number) {
  const debtCalculations: PayoffCalculation[] = [];
  const monthlyBreakdown: MonthlyBreakdown[] = [];
  
  // Clone debts to avoid modifying original
  const workingDebts = debts.map(debt => ({ ...debt }));
  
  let totalMonths = 0;
  let totalPayments = 0;
  let totalInterestSaved = 0;
  let currentMonth = 0;
  
  // Calculate minimum payment total for reference
  workingDebts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  
  // Calculate baseline (minimum payments only) for comparison
  const baselineCalculation = calculateBaselinePayoff(debts);
  
  while (workingDebts.some(debt => debt.balance > 0) && currentMonth < 1200) { // Max 100 years
    currentMonth++;
    let remainingExtraPayment = extraPayment;
    let monthlyTotalPayment = 0;
    const debtsPaidOff: string[] = [];
    
    // Apply minimum payments and interest
    for (const debt of workingDebts) {
      if (debt.balance <= 0) continue;
      
      // Calculate monthly interest
      const monthlyInterestRate = debt.interestRate / 100 / 12;
      const interestCharge = debt.balance * monthlyInterestRate;
      
      // Apply minimum payment
      const paymentAmount = Math.min(debt.minimumPayment, debt.balance + interestCharge);
      
      debt.balance = Math.max(0, debt.balance + interestCharge - paymentAmount);
      monthlyTotalPayment += paymentAmount;
      
      if (debt.balance === 0) {
        debtsPaidOff.push(debt.id);
      }
    }
    
    // Apply extra payment using avalanche method (highest interest first)
    const activeDebts = workingDebts
      .filter(debt => debt.balance > 0)
      .sort((a, b) => b.interestRate - a.interestRate);
    
    for (const debt of activeDebts) {
      if (remainingExtraPayment <= 0) break;
      
      const extraPaymentAmount = Math.min(remainingExtraPayment, debt.balance);
      debt.balance -= extraPaymentAmount;
      remainingExtraPayment -= extraPaymentAmount;
      monthlyTotalPayment += extraPaymentAmount;
      
      if (debt.balance === 0 && !debtsPaidOff.includes(debt.id)) {
        debtsPaidOff.push(debt.id);
      }
    }
    
    totalPayments += monthlyTotalPayment;
    
    // Record monthly breakdown
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + currentMonth);
    
    monthlyBreakdown.push({
      month: currentMonth,
      date: currentDate.toISOString().split('T')[0],
      total_payment: monthlyTotalPayment,
      remaining_balance: workingDebts.reduce((sum, debt) => sum + debt.balance, 0),
      debts_paid_off: debtsPaidOff,
    });
  }
  
  totalMonths = currentMonth;
  
  // Calculate individual debt payoff info
  for (let i = 0; i < debts.length; i++) {
    const debt = debts[i];
    const payoffMonth = monthlyBreakdown.findIndex(month => 
      month.debts_paid_off.includes(debt.id)
    );
    
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + (payoffMonth + 1));
    
    // Calculate interest saved vs minimum payment only
    baselineCalculation.find(b => b.id === debt.id);
    
    debtCalculations.push({
      debt_id: debt.id,
      debt_name: debt.name,
      current_balance: debt.balance,
      minimum_payment: debt.minimumPayment,
      suggested_payment: debt.minimumPayment + (i === 0 ? extraPayment : 0), // Focus extra payment on first debt
      months_to_payoff: payoffMonth + 1,
      total_interest: calculateDebtInterest(debt, payoffMonth + 1),
      payoff_date: payoffDate.toISOString().split('T')[0],
      order_in_strategy: i + 1,
    });
  }
  
  // Calculate total interest saved
  totalInterestSaved = baselineCalculation.reduce((sum, baseline) => sum + baseline.totalInterest, 0) - 
                     debtCalculations.reduce((sum, calc) => sum + calc.total_interest, 0);
  
  const completionDate = new Date();
  completionDate.setMonth(completionDate.getMonth() + totalMonths);
  
  return {
    totalMonths,
    totalInterestSaved,
    totalPayments,
    completionDate: completionDate.toISOString().split('T')[0],
    debtCalculations,
    monthlyBreakdown,
  };
}

function calculateBaselinePayoff(debts: DebtData[]) {
  return debts.map(debt => {
    const monthlyInterestRate = debt.interestRate / 100 / 12;
    const months = monthlyInterestRate > 0 ? 
      Math.ceil(-Math.log(1 - (debt.balance * monthlyInterestRate) / debt.minimumPayment) / Math.log(1 + monthlyInterestRate)) :
      Math.ceil(debt.balance / debt.minimumPayment);
    
    const totalInterest = (debt.minimumPayment * months) - debt.balance;
    
    return {
      id: debt.id,
      months,
      totalInterest: Math.max(0, totalInterest),
    };
  });
}

function calculateDebtInterest(debt: DebtData, months: number) {
  const monthlyInterestRate = debt.interestRate / 100 / 12;
  if (monthlyInterestRate === 0) return 0;
  
  const totalPayments = debt.minimumPayment * months;
  return Math.max(0, totalPayments - debt.balance);
}