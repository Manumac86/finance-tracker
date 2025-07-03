"use client";

import { useMemo } from "react";
import {
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Target,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { UIBudget } from "@/lib/db/schemas/budget";
import { UITransaction } from "@/lib/db/schemas/transaction";
import { useTranslations } from "next-intl";
import { useTransactions } from "@/contexts/transactions";

interface EnhancedBudgetCardProps {
  budget: UIBudget;
  onEdit: (budget: UIBudget) => void;
  onDelete: (budgetId: string) => void;
}

interface BudgetAnalysis {
  actualSpent: number;
  remainingAmount: number;
  percentageUsed: number;
  status: "on_track" | "warning" | "overspent";
  daysRemaining: number;
  dailyBudgetRemaining: number;
  projectedSpending: number;
  variance: number;
  categoryTransactions: UITransaction[];
}

export function EnhancedBudgetCard({
  budget,
  onEdit,
  onDelete,
}: EnhancedBudgetCardProps) {
  const t = useTranslations("budgetCard");
  const tAnalytics = useTranslations("budgetAnalytics");
  const { transactions } = useTransactions();

  // Calculate budget analytics (similar to BudgetAnalytics logic)
  const analysis = useMemo((): BudgetAnalysis => {
    const now = new Date();
    
    // For recurring budgets (monthly, weekly, etc.), calculate current period
    let startDate: Date;
    let endDate: Date;
    
    const budgetStartDate = new Date(budget.startDate);
    const budgetEndDate = budget.endDate ? new Date(budget.endDate) : null;
    
    if (budget.endDate && budget.budgetType === "custom") {
      // Fixed period custom budget
      startDate = budgetStartDate;
      endDate = budgetEndDate!;
    } else {
      // Recurring budget - but check if budget has started yet
      if (now < budgetStartDate) {
        // Budget hasn't started yet - use future period
        startDate = budgetStartDate;
        endDate = getCurrentPeriodEnd(budgetStartDate, budget.period);
      } else if (budgetEndDate && now > budgetEndDate) {
        // Budget has ended - use last period
        startDate = getCurrentPeriodStart(budgetEndDate, budget.period);
        endDate = budgetEndDate;
      } else {
        // Budget is active - calculate current period
        startDate = getCurrentPeriodStart(now, budget.period);
        endDate = getCurrentPeriodEnd(now, budget.period);
        
        // But don't go before budget start date
        if (startDate < budgetStartDate) {
          startDate = budgetStartDate;
        }
        
        // And don't go after budget end date
        if (budgetEndDate && endDate > budgetEndDate) {
          endDate = budgetEndDate;
        }
      }
    }

    // Filter transactions for this budget period and category
    const categoryTransactions = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.transactionDate);
      const isInPeriod =
        transactionDate >= startDate && transactionDate <= endDate;

      if (budget.budgetType === "category" && budget.categoryId) {
        return isInPeriod && transaction.categoryId === budget.categoryId;
      }

      return isInPeriod;
    });
    
    // Check if budget is active
    const isBudgetFuture = now < budgetStartDate;
    const isBudgetExpired = budgetEndDate && now > budgetEndDate;

    // Calculate spending (only if budget is active or expired)
    const actualSpent = isBudgetFuture ? 0 : categoryTransactions
      .filter((t) => t.transactionType === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const remainingAmount = budget.amount - actualSpent;
    const percentageUsed =
      budget.amount > 0 ? (actualSpent / budget.amount) * 100 : 0;

    // Determine status
    let status: "on_track" | "warning" | "overspent" = "on_track";
    if (isBudgetFuture) {
      status = "on_track"; // Future budgets are always on track
    } else if (percentageUsed >= 100) {
      status = "overspent";
    } else if (percentageUsed >= (budget.alertThresholdPercentage || 80)) {
      status = "warning";
    }

    // Calculate days remaining in period
    let daysRemaining: number;
    if (isBudgetFuture) {
      // Days until budget starts
      daysRemaining = Math.ceil((budgetStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    } else if (isBudgetExpired) {
      daysRemaining = 0;
    } else {
      // Days remaining in current period
      daysRemaining = Math.max(
        0,
        Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
    }

    // Calculate daily budget remaining
    const dailyBudgetRemaining = isBudgetFuture ? 0 :
      daysRemaining > 0 ? remainingAmount / daysRemaining : 0;

    // Calculate projected spending  
    let projectedSpending = 0;
    if (!isBudgetFuture) {
      const daysInPeriod = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysElapsed = Math.max(
        1,
        Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      projectedSpending =
        daysInPeriod > 0
          ? (actualSpent / daysElapsed) * daysInPeriod
          : actualSpent;
    }

    const variance = budget.amount - projectedSpending;

    return {
      actualSpent,
      remainingAmount,
      percentageUsed,
      status,
      daysRemaining,
      dailyBudgetRemaining,
      projectedSpending,
      variance,
      categoryTransactions,
    };
  }, [budget, transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getBudgetTypeVariant = (
    type: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case "category":
        return "default";
      case "total":
        return "secondary";
      case "custom":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getBudgetTypeLabel = (type: string) => {
    switch (type) {
      case "category":
        return t("categoryBudget");
      case "total":
        return t("totalBudget");
      case "custom":
        return t("customBudget");
      default:
        return type;
    }
  };

  const getStatusVariant = (
    status: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "overspent":
        return "destructive";
      case "warning":
        return "outline";
      case "on_track":
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "overspent":
        return <AlertTriangle className="h-3 w-3 mr-1" />;
      case "warning":
        return <AlertTriangle className="h-3 w-3 mr-1" />;
      case "on_track":
        return <TrendingUp className="h-3 w-3 mr-1" />;
      default:
        return <CheckCircle2 className="h-3 w-3 mr-1" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "overspent":
        return tAnalytics("overBudget");
      case "warning":
        return tAnalytics("closeToLimit");
      case "on_track":
        return tAnalytics("onTrack");
      default:
        return tAnalytics("unknown");
    }
  };

  const getPeriodDisplay = (period: string) => {
    switch (period) {
      case "weekly":
        return t("weekly");
      case "monthly":
        return t("monthly");
      case "quarterly":
        return t("quarterly");
      case "yearly":
        return t("yearly");
      default:
        return period;
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={getBudgetTypeVariant(budget.budgetType)}
                className={`text-xs ${
                  budget.budgetType === "custom"
                    ? "bg-gradient-to-r from-indigo-500 from-10% via-sky-500 via-30% to-emerald-500 to-100% text-white"
                    : ""
                }`}
              >
                {getBudgetTypeLabel(budget.budgetType)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getPeriodDisplay(budget.period)}
              </Badge>
              <Badge
                variant={getStatusVariant(analysis.status)}
                className={`text-xs ${
                  getStatusVariant(analysis.status) === "outline"
                    ? "bg-red-600 text-red-100"
                    : ""
                }`}
              >
                {getStatusIcon(analysis.status)}
                {getStatusLabel(analysis.status)}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg">{budget.name}</h3>
            {budget.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {budget.description}
              </p>
            )}
          </div>
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(budget)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(budget.id!)}
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              {t("progress")}
            </span>
            <span className="text-sm font-medium">
              {analysis.percentageUsed.toFixed(1)}%
            </span>
          </div>
          <Progress
            value={
              analysis.percentageUsed >= 100 ? 100 : analysis.percentageUsed
            }
            className="h-2"
          />
        </div>

        {/* Budget vs Actual */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">{t("budget")}</div>
            <div className="text-lg font-semibold">
              {formatCurrency(budget.amount)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t("spent")}</div>
            <div className="text-lg font-semibold text-orange-500">
              {formatCurrency(analysis.actualSpent)}
            </div>
          </div>
        </div>

        {/* Enhanced Analytics */}
        <div className="border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">{t("remaining")}</div>
              <div
                className={`font-medium ${
                  analysis.remainingAmount >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {formatCurrency(analysis.remainingAmount)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">{t("daysLeftLabel")}</div>
              <div className="font-medium">{analysis.daysRemaining}</div>
            </div>
            <div>
              <div className="text-muted-foreground">
                {t("dailyBudgetLeft")}
              </div>
              <div className="font-medium text-blue-400">
                {formatCurrency(analysis.dailyBudgetRemaining)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">{t("projectedTotal")}</div>
              <div
                className={`font-medium ${
                  analysis.projectedSpending <= budget.amount
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {formatCurrency(analysis.projectedSpending)}
              </div>
            </div>
          </div>
        </div>

        {/* Period Info */}
        <div className="flex justify-between items-center text-sm text-muted-foreground border-t border-border pt-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              {t("starts")}: {formatDate(budget.startDate)}
            </span>
          </div>
          <div className="flex items-center">
            <Target className="h-4 w-4 mr-1" />
            <span>{t("daysLeft", { days: analysis.daysRemaining })}</span>
          </div>
        </div>

        {/* Alert Messages */}
        {analysis.status !== "on_track" && (
          <div
            className={`p-3 rounded-lg ${
              analysis.status === "overspent"
                ? "bg-red-500/10 border border-red-500/20"
                : "bg-yellow-500/10 border border-yellow-500/20"
            }`}
          >
            <div className="flex items-start gap-2">
              {getStatusIcon(analysis.status)}
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {analysis.status === "overspent"
                    ? tAnalytics("budgetExceeded")
                    : tAnalytics("approachingLimit")}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {analysis.status === "overspent"
                    ? tAnalytics("exceededBy", {
                        amount: formatCurrency(
                          Math.abs(analysis.remainingAmount)
                        ),
                      })
                    : tAnalytics("remainingFor", {
                        amount: formatCurrency(analysis.remainingAmount),
                        days: analysis.daysRemaining,
                      })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alert Settings Info */}
        {budget.alertEnabled && (
          <div className="text-xs text-muted-foreground border-t border-border pt-2">
            <div className="flex justify-between">
              <span>
                {t("alertAt", { percent: budget.alertThresholdPercentage })}
              </span>
              <span>
                {budget.overspendAlertEnabled
                  ? t("overspendAlertsOn")
                  : t("overspendAlertsOff")}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to calculate current period start
function getCurrentPeriodStart(now: Date, period: string): Date {
  const startDate = new Date(now);

  switch (period) {
    case "weekly":
      // Start of current week (Monday)
      const dayOfWeek = startDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(startDate.getDate() - daysToMonday);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      // Start of current month
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "quarterly":
      // Start of current quarter
      const currentQuarter = Math.floor(startDate.getMonth() / 3);
      startDate.setMonth(currentQuarter * 3, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "yearly":
      // Start of current year
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  return startDate;
}

// Helper function to calculate current period end
function getCurrentPeriodEnd(now: Date, period: string): Date {
  const endDate = new Date(now);

  switch (period) {
    case "weekly":
      // End of current week (Sunday)
      const dayOfWeek = endDate.getDay();
      const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      endDate.setDate(endDate.getDate() + daysToSunday);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "monthly":
      // End of current month
      endDate.setMonth(endDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "quarterly":
      // End of current quarter
      const currentQuarter = Math.floor(endDate.getMonth() / 3);
      endDate.setMonth((currentQuarter + 1) * 3, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "yearly":
      // End of current year
      endDate.setMonth(11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return endDate;
}

