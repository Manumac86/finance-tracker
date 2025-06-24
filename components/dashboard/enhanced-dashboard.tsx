"use client";

import { useState } from "react";
import useSWR from "swr";
import { Calendar, TrendingUp, DollarSign, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FinancialHealthIndicator } from "./financial-health-indicator";
import { GoalProgressCard } from "./goal-progress-card";
import { BudgetOverviewCard } from "./budget-overview-card";
import { QuickActionsCard } from "./quick-actions-card";
import { RecentTransactions } from "@/components/recent-transactions";

import { UIGoal } from "@/lib/db/schemas/goal";
import { UIBudget } from "@/lib/db/schemas/budget";
import { UITransaction } from "@/lib/db/schemas/transaction";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// interface DashboardData {
//   goals: UIGoal[];
//   budgets: UIBudget[];
//   transactions: UITransaction[];
//   summary: {
//     totalIncome: number;
//     totalExpenses: number;
//     currentBalance: number;
//     monthlyIncome: number;
//     monthlyExpenses: number;
//     savingsRate: number;
//   };
// }

export function EnhancedDashboard() {
  const [timeFilter, setTimeFilter] = useState("month");

  // Fetch all dashboard data
  const { data: goalsData, error: goalsError } = useSWR<{ goals: UIGoal[] }>(
    "/api/goals",
    fetcher
  );

  const { data: budgetsData, error: budgetsError } = useSWR<{ budgets: UIBudget[] }>(
    "/api/budgets",
    fetcher
  );

  const { data: transactionsData, error: transactionsError } = useSWR<{ transactions: UITransaction[] }>(
    `/api/transactions?period=${timeFilter}&limit=50`,
    fetcher
  );

  const goals = goalsData?.goals || [];
  const budgets = budgetsData?.budgets || [];
  const transactions = transactionsData?.transactions || [];

  // Calculate summary data
  const summary = {
    totalIncome: transactions
      .filter(t => t.transactionType === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions
      .filter(t => t.transactionType === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    currentBalance: 0, // This would typically come from account balances
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0
  };

  summary.currentBalance = summary.totalIncome - summary.totalExpenses;
  summary.savingsRate = summary.totalIncome > 0 ? 
    ((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100 : 0;

  // Calculate financial health data
  const healthData = {
    totalIncome: summary.totalIncome,
    totalExpenses: summary.totalExpenses,
    budgetUtilization: budgets.length > 0 ? 
      (summary.totalExpenses / budgets.reduce((sum, b) => sum + b.amount, 0)) * 100 : 0,
    goalProgress: goals.length > 0 ?
      goals.reduce((sum, g) => sum + (g.progress ?? 0), 0) / goals.length : 0,
    emergencyFundRatio: 2.5 // This would be calculated based on actual emergency fund
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isLoading = !goalsData || !budgetsData || !transactionsData;
  const hasError = goalsError || budgetsError || transactionsError;

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading dashboard data</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your financial overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
          <p className="text-gray-400">
            Your complete financial overview and actionable insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Current Balance</p>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {formatCurrency(summary.currentBalance)}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
              <TrendingUp className="w-3 h-3" />
              {summary.savingsRate > 0 ? '+' : ''}{summary.savingsRate.toFixed(1)}% savings rate
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Income</p>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(summary.totalIncome)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {timeFilter} total
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Expenses</p>
              <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(summary.totalExpenses)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {timeFilter} total
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Goals Progress</p>
              <Target className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {goals.filter(g => g.isAchieved).length}/{goals.length}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              goals completed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Financial Health - Full Width on Mobile, 2 cols on Desktop */}
        <div className="lg:col-span-2 space-y-6">
          <FinancialHealthIndicator data={healthData} />
          
          {/* Budget and Goals Row */}
          <div className="grid gap-6 md:grid-cols-2">
            <GoalProgressCard goals={goals} />
            <BudgetOverviewCard budgets={budgets} transactions={transactions} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <QuickActionsCard />
          
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactions />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}