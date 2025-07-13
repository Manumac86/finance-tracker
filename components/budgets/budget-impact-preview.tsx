"use client";

import { useMemo } from "react";
import { AlertTriangle, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UIBudget } from "@/lib/db/schemas/budget";
import { useTranslations } from "next-intl";

interface BudgetImpactPreviewProps {
  budgets: UIBudget[];
  transactionAmount: number;
  transactionType: "income" | "expense";
  categoryId: string;
  transactionDate: Date;
}

interface BudgetImpact {
  budget: UIBudget;
  currentSpent: number;
  newSpent: number;
  currentPercentage: number;
  newPercentage: number;
  impactAmount: number;
  statusBefore: "on_track" | "warning" | "overspent";
  statusAfter: "on_track" | "warning" | "overspent";
  willTriggerAlert: boolean;
}

// Helper function to calculate current period start
function getCurrentPeriodStart(now: Date, period: string): Date {
  const startDate = new Date(now);

  switch (period) {
    case "weekly":
      const dayOfWeek = startDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDate.setDate(startDate.getDate() - daysToMonday);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "quarterly":
      const currentQuarter = Math.floor(startDate.getMonth() / 3);
      startDate.setMonth(currentQuarter * 3, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "yearly":
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
      const dayOfWeek = endDate.getDay();
      const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      endDate.setDate(endDate.getDate() + daysToSunday);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "monthly":
      endDate.setMonth(endDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "quarterly":
      const currentQuarter = Math.floor(endDate.getMonth() / 3);
      endDate.setMonth((currentQuarter + 1) * 3, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case "yearly":
      endDate.setMonth(11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  return endDate;
}

export function BudgetImpactPreview({
  budgets,
  transactionAmount,
  transactionType,
  categoryId,
  transactionDate,
}: BudgetImpactPreviewProps) {
  const t = useTranslations("budgetImpact");
  const tAnalytics = useTranslations("budgetAnalytics");

  const budgetImpacts = useMemo((): BudgetImpact[] => {
    if (transactionType !== "expense" || !transactionAmount || transactionAmount <= 0) {
      return [];
    }

    const impacts: BudgetImpact[] = [];

    for (const budget of budgets) {
      // Check if this budget is affected by the transaction
      let isAffected = false;

      // Check if transaction date falls within budget period
      const actualBudgetStart = new Date(budget.startDate);
      const actualBudgetEnd = budget.endDate ? new Date(budget.endDate) : null;
      
      let budgetStartDate: Date;
      let budgetEndDate: Date;
      
      if (budget.endDate && budget.budgetType === "custom") {
        // Fixed period custom budget
        budgetStartDate = actualBudgetStart;
        budgetEndDate = actualBudgetEnd!;
      } else {
        // Recurring budget - but respect actual budget start/end dates
        if (transactionDate < actualBudgetStart) {
          // Transaction is before budget starts - not affected
          continue;
        }
        
        if (actualBudgetEnd && transactionDate > actualBudgetEnd) {
          // Transaction is after budget ends - not affected
          continue;
        }
        
        // Calculate the period that contains this transaction date
        budgetStartDate = getCurrentPeriodStart(transactionDate, budget.period);
        budgetEndDate = getCurrentPeriodEnd(transactionDate, budget.period);
        
        // But don't go before actual budget start
        if (budgetStartDate < actualBudgetStart) {
          budgetStartDate = actualBudgetStart;
        }
        
        // And don't go after actual budget end
        if (actualBudgetEnd && budgetEndDate > actualBudgetEnd) {
          budgetEndDate = actualBudgetEnd;
        }
      }

      const isInPeriod = transactionDate >= budgetStartDate && transactionDate <= budgetEndDate;
      
      if (!isInPeriod) continue;

      // Check if budget applies to this category
      if (budget.budgetType === "category" && budget.categoryIds) {
        isAffected = budget.categoryIds.includes(categoryId);
      } else if (budget.budgetType === "total") {
        isAffected = true; // Total budgets affect all transactions
      }

      if (!isAffected) continue;

      // Calculate current spending (simplified - would need real transaction data in production)
      // For now, use a reasonable mock value
      const currentSpent = Math.max(0, budget.amount * 0.5); // Mock: 50% of budget spent
      const newSpent = currentSpent + transactionAmount;

      const currentPercentage = budget.amount > 0 ? (currentSpent / budget.amount) * 100 : 0;
      const newPercentage = budget.amount > 0 ? (newSpent / budget.amount) * 100 : 0;

      // Determine status before and after
      const getStatus = (percentage: number) => {
        if (percentage >= 100) return "overspent";
        if (percentage >= (budget.alertThresholdPercentage || 80)) return "warning";
        return "on_track";
      };

      const statusBefore = getStatus(currentPercentage);
      const statusAfter = getStatus(newPercentage);

      // Check if this will trigger an alert
      const willTriggerAlert = 
        (statusBefore !== "warning" && statusAfter === "warning") ||
        (statusBefore !== "overspent" && statusAfter === "overspent");

      impacts.push({
        budget,
        currentSpent,
        newSpent,
        currentPercentage,
        newPercentage,
        impactAmount: transactionAmount,
        statusBefore,
        statusAfter,
        willTriggerAlert,
      });
    }

    return impacts;
  }, [budgets, transactionAmount, transactionType, categoryId, transactionDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
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

  const getImpactIcon = (statusBefore: string, statusAfter: string) => {
    if (statusBefore === statusAfter) {
      return <DollarSign className="h-4 w-4 text-muted-foreground" />;
    }
    
    const beforePriority = statusBefore === "overspent" ? 3 : statusBefore === "warning" ? 2 : 1;
    const afterPriority = statusAfter === "overspent" ? 3 : statusAfter === "warning" ? 2 : 1;
    
    if (afterPriority > beforePriority) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else {
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    }
  };

  if (budgetImpacts.length === 0) {
    return null;
  }

  const hasHighImpact = budgetImpacts.some(impact => impact.willTriggerAlert);

  return (
    <Card className={`${hasHighImpact ? 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800' : 'border-muted'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {hasHighImpact && <AlertTriangle className="h-4 w-4 text-orange-500" />}
          {t("title")}
        </CardTitle>
        {hasHighImpact && (
          <p className="text-xs text-orange-600">
            {t("willTriggerAlerts")}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {budgetImpacts.map((impact) => (
          <div key={impact.budget.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getImpactIcon(impact.statusBefore, impact.statusAfter)}
                <span className="text-sm font-medium">{impact.budget.name}</span>
                {impact.willTriggerAlert && (
                  <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                    {t("alert")}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(impact.impactAmount)}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{t("current")}: {impact.currentPercentage.toFixed(1)}%</span>
                <span>{t("after")}: {impact.newPercentage.toFixed(1)}%</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Progress value={Math.min(impact.currentPercentage, 100)} className="h-1.5" />
                </div>
                <div className="flex-1">
                  <Progress 
                    value={Math.min(impact.newPercentage, 100)} 
                    className="h-1.5"
                    indicatorClassName={impact.newPercentage >= 100 ? "bg-destructive" : impact.newPercentage >= (impact.budget.alertThresholdPercentage || 80) ? "bg-orange-500" : "bg-primary"}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <Badge variant={getStatusVariant(impact.statusBefore)} className="text-xs">
                  {getStatusLabel(impact.statusBefore)}
                </Badge>
                <Badge variant={getStatusVariant(impact.statusAfter)} className="text-xs">
                  {getStatusLabel(impact.statusAfter)}
                </Badge>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {formatCurrency(impact.currentSpent)} → {formatCurrency(impact.newSpent)} of {formatCurrency(impact.budget.amount)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}