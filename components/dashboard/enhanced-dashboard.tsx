"use client";

import { useState } from "react";
import useSWR from "swr";
import { Calendar, TrendingUp, DollarSign, CreditCard } from "lucide-react";
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
import { BankConnectionPrompt } from "../banking/bank-connection-prompt";

import { UIGoal } from "@/lib/db/schemas/goal";
import { UIBudget } from "@/lib/db/schemas/budget";
import { UITransaction } from "@/lib/db/schemas/transaction";
import { useDebts } from "@/contexts/debts";
import { useAccounts } from "@/contexts/accounts";
import { useTranslations, useLocale } from "next-intl";
import { localeConfig } from "@/i18n/routing";
import { BalanceChart } from "@/components/balance-chart";
import { DebtProgressChart } from "@/components/debt-progress-chart";
import { useFinancialCalculations } from "@/hooks/use-financial-calculations";
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
  const [timeFilter, setTimeFilter] = useState("week");

  const t = useTranslations("dashboard");
  const locale = useLocale();
  const { data: goalsData, error: goalsError } = useSWR<{ goals: UIGoal[] }>(
    "/api/goals",
    fetcher
  );

  const { data: budgetsData, error: budgetsError } = useSWR<{
    budgets: UIBudget[];
  }>("/api/budgets", fetcher);

  const { data: transactionsData, error: transactionsError } = useSWR<{
    transactions: UITransaction[];
  }>(
    `/api/transactions?period=${timeFilter}&limit=50&includeFuture=false`,
    fetcher
  );

  const { summary: debtSummary, isLoading: debtsLoading, error: debtsError } = useDebts();
  const { accounts, isLoading: accountsLoading, error: accountsError } = useAccounts();

  const goals = goalsData?.goals || [];
  const budgets = budgetsData?.budgets || [];
  const transactions = transactionsData?.transactions || []; // API already filters out future transactions

  // Use centralized financial calculations
  const financialMetrics = useFinancialCalculations({
    transactions,
    budgets,
    goals,
    accounts,
    debtSummary,
    timeFilter,
  });

  // Create health data from centralized calculations
  const healthData = {
    totalIncome: financialMetrics.totalIncome,
    totalExpenses: financialMetrics.totalExpenses,
    totalDebt: financialMetrics.totalDebt,
    monthlyDebtPayments: financialMetrics.monthlyDebtPayments,
    debtToIncomeRatio: financialMetrics.debtToIncomeRatio,
    budgetUtilization: financialMetrics.budgetUtilization,
    goalProgress: financialMetrics.goalProgress,
    emergencyFundRatio: financialMetrics.emergencyFundRatio,
    savingsRate: financialMetrics.savingsRate,
  };

  const formatCurrency = (amount: number) => {
    const currentLocaleConfig =
      localeConfig[locale as keyof typeof localeConfig];
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currentLocaleConfig.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isLoading = !goalsData || !budgetsData || !transactionsData || debtsLoading || accountsLoading;
  const hasError = goalsError || budgetsError || transactionsError || debtsError || accountsError;

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{t("errorLoading")}</p>
          <Button onClick={() => window.location.reload()}>{t("retry")}</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("loadingOverview")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        data-testid="dashboard-header"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t("thisWeek")}</SelectItem>
              <SelectItem value="month">{t("thisMonth")}</SelectItem>
              <SelectItem value="quarter">{t("thisQuarter")}</SelectItem>
              <SelectItem value="year">{t("thisYear")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t("currentBalance")}
              </p>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                financialMetrics.currentBalance > 0 ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {formatCurrency(financialMetrics.currentBalance)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3" />
              {financialMetrics.savingsRate > 0 ? "+" : ""}
              {financialMetrics.savingsRate.toFixed(1)}% {t("savingsRate")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t("income")}</p>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(financialMetrics.totalIncome)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {timeFilter} {t("total")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t("expenses")}</p>
              <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(financialMetrics.totalExpenses)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {timeFilter} {t("total")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t("totalDebts")}
              </p>
              <CreditCard className="w-4 h-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {formatCurrency(financialMetrics.totalDebt)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>{financialMetrics.activeDebtsCount} {t("activeDebts")}</span>
              {financialMetrics.debtToIncomeRatio > 0 && (
                <>
                  <span>•</span>
                  <span>{financialMetrics.debtToIncomeRatio.toFixed(1)}% {t("debtToIncomeRatio")}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Financial Health - Full Width on Mobile, 2 cols on Desktop */}
        <div className="lg:col-span-2 space-y-6">
          <FinancialHealthIndicator data={healthData} />

          {/* Charts Section */}
          <div className="grid gap-6 mb-8">
            <BalanceChart timeFilter={timeFilter} />
            {financialMetrics.totalDebt > 0 && <DebtProgressChart timeFilter={timeFilter} />}
          </div>

          {/* Budget and Goals Row */}
          <div className="grid gap-6 md:grid-cols-2">
            <GoalProgressCard goals={goals} />
            <BudgetOverviewCard budgets={budgets} transactions={transactions} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <QuickActionsCard />

          {/* Bank Connection Prompt */}
          {!!+process.env.NEXT_PUBLIC_BANK_ENABLED! && <BankConnectionPrompt />}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t("recentActivity")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactions excludeFuture={true} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
