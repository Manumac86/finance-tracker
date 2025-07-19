"use client";

import { useTranslations } from "next-intl";
import { 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebts } from "@/contexts/debts";

export function DebtSummary() {
  const t = useTranslations("debts");
  const { summary, isLoading, error } = useDebts();

  if (isLoading) {
    return <DebtSummarySkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>{t("error.loadingSummary")}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  // const getDebtToIncomeColor = (ratio: number | null) => {
  //   if (!ratio) return "bg-muted";
  //   if (ratio < 20) return "bg-emerald-500";
  //   if (ratio < 36) return "bg-yellow-500";
  //   return "bg-destructive";
  // };

  const getDebtToIncomeText = (ratio: number | null) => {
    if (!ratio) return t("summary.debtToIncome.noData");
    if (ratio < 20) return t("summary.debtToIncome.excellent");
    if (ratio < 36) return t("summary.debtToIncome.good");
    return t("summary.debtToIncome.concerning");
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Debt */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("summary.totalDebt")}
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.total_debt)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.active_debts_count} {t("summary.activeDebts")}
          </p>
        </CardContent>
      </Card>

      {/* Monthly Payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("summary.monthlyPayments")}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.total_minimum_payments)}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("summary.minimumPayments")}
          </p>
        </CardContent>
      </Card>

      {/* Interest Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("summary.avgInterestRate")}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary.total_interest_rate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(summary.monthly_interest_cost)}/mo {t("summary.interestCost")}
          </p>
        </CardContent>
      </Card>

      {/* Payoff Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("summary.payoffDate")}
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summary.estimated_payoff_date ? 
              formatDate(summary.estimated_payoff_date) : 
              t("summary.noPayoffDate")
            }
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(summary.total_interest_to_pay)} {t("summary.totalInterest")}
          </p>
        </CardContent>
      </Card>

      {/* Debt-to-Income Ratio */}
      {summary.debt_to_income_ratio !== null && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t("summary.debtToIncomeRatio")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold">
                {summary.debt_to_income_ratio.toFixed(1)}%
              </div>
              <div className="flex-1">
                <Progress 
                  value={Math.min(summary.debt_to_income_ratio, 100)} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              <Badge 
                variant={summary.debt_to_income_ratio < 36 ? "secondary" : "destructive"}
                className="ml-2"
              >
                {getDebtToIncomeText(summary.debt_to_income_ratio)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t("summary.debtToIncome.description")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {t("summary.quickActions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium text-emerald-600">
                {t("summary.actions.payExtra")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("summary.actions.payExtraDesc")}
              </div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium text-blue-600">
                {t("summary.actions.createStrategy")}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("summary.actions.createStrategyDesc")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DebtSummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}