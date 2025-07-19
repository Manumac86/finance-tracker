"use client";

import { useMemo } from "react";
import { UITransaction } from "@/lib/db/schemas/transaction";
import { UIBudget } from "@/lib/db/schemas/budget";
import { UIGoal } from "@/lib/db/schemas/goal";
import { UIManualAccount } from "@/lib/db/schemas/manual-account";

interface DebtSummary {
  total_debt: number;
  active_debts_count: number;
  total_minimum_payments: number;
}

interface FinancialCalculationsInput {
  transactions: UITransaction[];
  budgets: UIBudget[];
  goals: UIGoal[];
  accounts?: UIManualAccount[];
  debtSummary: DebtSummary | null | undefined;
  timeFilter: string;
}

export interface FinancialMetrics {
  // Basic metrics
  totalIncome: number;
  totalExpenses: number;
  netIncome: number; // income - expenses (positive value)
  currentBalance: number;
  
  // Debt metrics
  totalDebt: number;
  activeDebtsCount: number;
  monthlyDebtPayments: number;
  
  // Normalized monthly values for consistent calculations
  monthlyIncome: number;
  monthlyExpenses: number;
  
  // Calculated rates and ratios
  savingsRate: number; // (net income / total income) * 100
  debtToIncomeRatio: number; // (monthly debt payments / monthly income) * 100
  
  // Budget and goal metrics
  budgetUtilization: number;
  goalProgress: number;
  emergencyFundRatio: number;
}

export function useFinancialCalculations({
  transactions,
  budgets,
  goals,
  accounts,
  debtSummary,
  timeFilter,
}: FinancialCalculationsInput): FinancialMetrics {
  return useMemo(() => {
    // Calculate basic income and expenses from transactions
    const totalIncome = transactions
      .filter((t) => t.transactionType === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.transactionType === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Net income (what's left after expenses)
    const netIncome = totalIncome - totalExpenses;

    // Current balance (sum of all manual account balances)
    const currentBalance = accounts?.reduce((sum, account) => {
      // Only include active accounts that should be included in totals
      if (account.isActive && account.includeInTotals) {
        return sum + account.currentBalance;
      }
      return sum;
    }, 0) || 0;

    // Debt metrics
    const totalDebt = debtSummary?.total_debt || 0;
    const activeDebtsCount = debtSummary?.active_debts_count || 0;
    const monthlyDebtPayments = debtSummary?.total_minimum_payments || 0;

    // Normalize to monthly values based on time filter
    const getMonthlyMultiplier = (filter: string): number => {
      switch (filter) {
        case "week": return 4.33; // Average weeks per month
        case "month": return 1;
        case "quarter": return 1 / 3;
        case "year": return 1 / 12;
        default: return 1;
      }
    };

    const monthlyMultiplier = getMonthlyMultiplier(timeFilter);
    const monthlyIncome = totalIncome * monthlyMultiplier;
    const monthlyExpenses = totalExpenses * monthlyMultiplier;

    // Calculate savings rate: (net income / total income) * 100
    // This represents the percentage of income that is saved (not spent)
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

    // Calculate debt-to-income ratio using monthly values
    const debtToIncomeRatio = monthlyIncome > 0 ? (monthlyDebtPayments / monthlyIncome) * 100 : 0;

    // Budget utilization
    const totalBudgetAmount = budgets.reduce((sum, b) => sum + b.amount, 0);
    const budgetUtilization = totalBudgetAmount > 0 ? (totalExpenses / totalBudgetAmount) * 100 : 0;

    // Goal progress (average)
    const goalProgress = goals.length > 0 
      ? goals.reduce((sum, g) => sum + (g.progress ?? 0), 0) / goals.length 
      : 0;

    // Emergency fund ratio (placeholder - would need actual emergency fund data)
    const emergencyFundRatio = 2.5;

    return {
      // Basic metrics
      totalIncome,
      totalExpenses,
      netIncome,
      currentBalance,
      
      // Debt metrics
      totalDebt,
      activeDebtsCount,
      monthlyDebtPayments,
      
      // Normalized monthly values
      monthlyIncome,
      monthlyExpenses,
      
      // Calculated rates and ratios
      savingsRate,
      debtToIncomeRatio,
      
      // Budget and goal metrics
      budgetUtilization,
      goalProgress,
      emergencyFundRatio,
    };
  }, [transactions, budgets, goals, accounts, debtSummary, timeFilter]);
}