"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { 
  CreditCard,
  Plus,
  Calculator,
  Target,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDebts } from "@/contexts/debts";

interface DebtPaymentBudgetProps {
  onCreateDebtBudget?: () => void;
  onCreatePayoffGoal?: () => void;
}

export function DebtPaymentBudget({ onCreateDebtBudget, onCreatePayoffGoal }: DebtPaymentBudgetProps) {
  const t = useTranslations("budgets");
  const { debts, summary, isLoading } = useDebts();
  const [showDetails, setShowDetails] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getDebtPaymentInsights = () => {
    if (!debts || debts.length === 0) return null;

    const activeDebts = debts.filter(debt => debt.is_active);
    const totalMinimumPayments = activeDebts.reduce(
      (sum, debt) => sum + (debt.minimum_payment || 0), 0
    );
    const totalBalance = activeDebts.reduce(
      (sum, debt) => sum + debt.current_balance, 0
    );
    const averageInterestRate = activeDebts.length > 0 ? 
      activeDebts.reduce((sum, debt) => sum + (debt.interest_rate || 0), 0) / activeDebts.length : 0;

    return {
      activeDebtsCount: activeDebts.length,
      totalMinimumPayments,
      totalBalance,
      averageInterestRate,
      monthlyInterestCost: totalBalance * (averageInterestRate / 100 / 12),
    };
  };

  const getDebtPriorityRecommendations = () => {
    if (!debts) return [];

    return debts
      .filter(debt => debt.is_active && debt.interest_rate)
      .sort((a, b) => (b.interest_rate || 0) - (a.interest_rate || 0))
      .slice(0, 3)
      .map(debt => ({
        ...debt,
        recommendedExtraPayment: Math.min(
          debt.current_balance,
          (debt.minimum_payment || 0) * 0.5 // Suggest 50% extra
        ),
      }));
  };

  const insights = getDebtPaymentInsights();
  const priorityRecommendations = getDebtPriorityRecommendations();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("debtPayments.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights || insights.activeDebtsCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("debtPayments.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("debtPayments.noActiveDebts")}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t("debtPayments.noActiveDebtsDescription")}
            </p>
            <Button onClick={() => {/* Navigate to debt management */}}>
              {t("debtPayments.manageDebts")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("debtPayments.title")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {insights.activeDebtsCount} {t("debtPayments.activeDebts")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{t("debtPayments.totalBalance")}</p>
            <p className="text-xl font-bold text-destructive">
              {formatCurrency(insights.totalBalance)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{t("debtPayments.minimumPayments")}</p>
            <p className="text-xl font-bold">
              {formatCurrency(insights.totalMinimumPayments)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{t("debtPayments.avgInterestRate")}</p>
            <p className="text-xl font-bold">
              {insights.averageInterestRate.toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{t("debtPayments.monthlyInterest")}</p>
            <p className="text-xl font-bold text-yellow-600">
              {formatCurrency(insights.monthlyInterestCost)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Budget Impact */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            {t("debtPayments.budgetImpact")}
          </h4>
          
          <div className="p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("debtPayments.requiredPayments")}:</span>
                <span className="font-medium">
                  {formatCurrency(insights.totalMinimumPayments)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("debtPayments.recommendedExtra")}:</span>
                <span className="font-medium text-emerald-600">
                  {formatCurrency(insights.totalMinimumPayments * 0.2)} {/* 20% extra */}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>{t("debtPayments.totalRecommended")}:</span>
                <span>{formatCurrency(insights.totalMinimumPayments * 1.2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Recommendations */}
        {priorityRecommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              {t("debtPayments.priorityDebts")}
            </h4>
            
            <div className="space-y-2">
              {priorityRecommendations.map((debt, index) => (
                <div key={debt.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? "destructive" : "secondary"}>
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{debt.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {debt.interest_rate}% APR • {formatCurrency(debt.current_balance)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{t("debtPayments.suggested")}</p>
                    <p className="font-semibold text-emerald-600">
                      +{formatCurrency(debt.recommendedExtraPayment)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCreateDebtBudget}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("debtPayments.createBudget")}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCreatePayoffGoal}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            {t("debtPayments.createGoal")}
          </Button>

          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                {t("debtPayments.viewDetails")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t("debtPayments.detailsTitle")}</DialogTitle>
                <DialogDescription>
                  {t("debtPayments.detailsDescription")}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {debts?.filter(debt => debt.is_active).map((debt) => (
                  <div key={debt.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{debt.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(debt.current_balance)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{t("debtPayments.minPayment")}</p>
                      <p className="font-semibold">
                        {debt.minimum_payment ? 
                          formatCurrency(debt.minimum_payment) : 
                          t("common.notSet")
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Warning for High Debt-to-Income */}
        {summary?.debt_to_income_ratio && summary.debt_to_income_ratio > 36 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  {t("debtPayments.highDebtWarning")}
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  {t("debtPayments.highDebtWarningDescription", { 
                    ratio: summary.debt_to_income_ratio.toFixed(1) 
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}