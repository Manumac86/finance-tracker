"use client";

import { useTranslations } from "next-intl";
import { BarChart3, TrendingDown, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Debt, type DebtPayment } from "@/lib/db/schemas/debt";

interface PaymentHistoryChartProps {
  payments: DebtPayment[] | null;
  debt: Debt;
}

export function PaymentHistoryChart({ payments, debt }: PaymentHistoryChartProps) {
  const t = useTranslations("debts");

  if (!payments || payments.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t("analytics.noData")}</h3>
          <p className="text-muted-foreground">
            {t("analytics.noDataDescription")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate payment analytics
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const averagePayment = totalPayments / payments.length;
  const largestPayment = Math.max(...payments.map(p => p.amount));
  const smallestPayment = Math.min(...payments.map(p => p.amount));
  
  // Monthly payment analysis
  const monthlyPayments = payments.reduce((acc, payment) => {
    const month = new Date(payment.payment_date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
    acc[month] = (acc[month] || 0) + payment.amount;
    return acc;
  }, {} as Record<string, number>);

  const monthlyAverage = Object.values(monthlyPayments).reduce((sum, amount) => sum + amount, 0) / Object.keys(monthlyPayments).length;

  // Payment consistency analysis
  const isConsistent = payments.length > 1 && 
    Math.abs(averagePayment - (debt.minimum_payment || 0)) < (debt.minimum_payment || 0) * 0.1;

  // Progress tracking
  const initialBalance = payments.length > 0 ? (payments[payments.length - 1].balance_after || 0) + payments[payments.length - 1].amount : debt.current_balance;
  const progressPercentage = ((initialBalance - debt.current_balance) / initialBalance) * 100;

  return (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("analytics.totalPayments")}</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalPayments)}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.length} {t("analytics.paymentsCount")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("analytics.averagePayment")}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averagePayment)}
            </div>
            <p className="text-xs text-muted-foreground">
              {isConsistent ? t("analytics.consistent") : t("analytics.variable")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("analytics.monthlyAverage")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(monthlyAverage)}
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(monthlyPayments).length} {t("analytics.activeMonths")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("analytics.paymentRange")}</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {formatCurrency(smallestPayment)} - {formatCurrency(largestPayment)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("analytics.minToMax")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.progressOverTime")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("analytics.debtReduction")}</span>
              <Badge variant={progressPercentage > 50 ? "default" : "secondary"}>
                {progressPercentage.toFixed(1)}% {t("analytics.complete")}
              </Badge>
            </div>
            
            {/* Simple visual timeline */}
            <div className="space-y-2">
              {payments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(payment.payment_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(payment.balance_after || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("analytics.remaining")}
                    </p>
                  </div>
                </div>
              ))}
              
              {payments.length > 5 && (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">
                    {t("analytics.andMorePayments", { count: payments.length - 5 })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.monthlyBreakdown")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(monthlyPayments)
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .map(([month, amount]) => (
                <div key={month} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{month}</p>
                    <p className="text-sm text-muted-foreground">
                      {payments.filter(p => 
                        new Date(p.payment_date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short' 
                        }) === month
                      ).length} {t("analytics.payments")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{formatCurrency(amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {((amount / totalPayments) * 100).toFixed(1)}% {t("analytics.ofTotal")}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Insights */}
      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.insights")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isConsistent ? (
              <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-emerald-700 dark:text-emerald-300">
                    {t("analytics.insights.consistent")}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {t("analytics.insights.consistentDescription")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-300">
                    {t("analytics.insights.variable")}
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    {t("analytics.insights.variableDescription")}
                  </p>
                </div>
              </div>
            )}

            {averagePayment > (debt.minimum_payment || 0) && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-blue-700 dark:text-blue-300">
                    {t("analytics.insights.aboveMinimum")}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {t("analytics.insights.aboveMinimumDescription", { 
                      extra: formatCurrency(averagePayment - (debt.minimum_payment || 0))
                    })}
                  </p>
                </div>
              </div>
            )}

            {progressPercentage > 75 && (
              <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-purple-700 dark:text-purple-300">
                    {t("analytics.insights.almostDone")}
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    {t("analytics.insights.almostDoneDescription")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}