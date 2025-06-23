"use client";

import { useMemo } from "react";
import { TrendingUp, AlertTriangle, CheckCircle2, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTransactions } from "@/contexts/transactions";
import { UIBudget } from "@/lib/db/schemas/budget";
import { UITransaction } from "@/lib/db/schemas/transaction";

interface BudgetAnalyticsProps {
  budgets: UIBudget[];
}

interface BudgetAnalysis {
  budget: UIBudget;
  actualSpent: number;
  remainingAmount: number;
  percentageUsed: number;
  status: 'on_track' | 'warning' | 'overspent';
  daysRemaining: number;
  dailyBudgetRemaining: number;
  projectedSpending: number;
  variance: number;
  categoryTransactions: UITransaction[];
}

export function BudgetAnalytics({ budgets }: BudgetAnalyticsProps) {
  const { transactions } = useTransactions();

  // Calculate budget analytics
  const budgetAnalyses = useMemo(() => {
    const now = new Date();
    
    return budgets.map((budget): BudgetAnalysis => {
      const startDate = new Date(budget.startDate);
      const endDate = budget.endDate ? new Date(budget.endDate) : getPeriodEndDate(startDate, budget.period);
      
      // Filter transactions for this budget period and category
      const categoryTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.transactionDate);
        const isInPeriod = transactionDate >= startDate && transactionDate <= endDate;
        const isExpense = transaction.transactionType === 'expense';
        
        // For category budgets, filter by category
        if (budget.budgetType === 'category' && budget.categoryId) {
          return isInPeriod && isExpense && transaction.categoryId === budget.categoryId;
        }
        
        // For total budgets, include all expenses
        if (budget.budgetType === 'total') {
          return isInPeriod && isExpense;
        }
        
        // For custom budgets, we'd need additional logic
        return isInPeriod && isExpense;
      });

      // Calculate spending metrics
      const actualSpent = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const remainingAmount = budget.amount - actualSpent;
      const percentageUsed = budget.amount > 0 ? (actualSpent / budget.amount) * 100 : 0;
      
      // Calculate time metrics
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, totalDays - daysElapsed);
      
      // Calculate projections
      const dailySpendingRate = daysElapsed > 0 ? actualSpent / daysElapsed : 0;
      const projectedSpending = dailySpendingRate * totalDays;
      const dailyBudgetRemaining = daysRemaining > 0 ? remainingAmount / daysRemaining : 0;
      const variance = actualSpent - (budget.amount * (daysElapsed / totalDays));

      // Determine status
      let status: 'on_track' | 'warning' | 'overspent';
      if (percentageUsed >= 100) {
        status = 'overspent';
      } else if (percentageUsed >= (budget.alertThresholdPercentage || 80)) {
        status = 'warning';
      } else {
        status = 'on_track';
      }

      return {
        budget,
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
    });
  }, [budgets, transactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overspent':
        return 'text-red-400 bg-red-500/10';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/10';
      case 'on_track':
        return 'text-emerald-400 bg-emerald-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overspent':
        return <AlertTriangle className="w-4 h-4" />;
      case 'warning':
        return <TrendingUp className="w-4 h-4" />;
      case 'on_track':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'overspent':
        return 'Over Budget';
      case 'warning':
        return 'Close to Limit';
      case 'on_track':
        return 'On Track';
      default:
        return 'Unknown';
    }
  };

  // Overall statistics
  const overallStats = useMemo(() => {
    const totalBudgeted = budgetAnalyses.reduce((sum, analysis) => sum + analysis.budget.amount, 0);
    const totalSpent = budgetAnalyses.reduce((sum, analysis) => sum + analysis.actualSpent, 0);
    const overBudgetCount = budgetAnalyses.filter(a => a.status === 'overspent').length;
    const warningCount = budgetAnalyses.filter(a => a.status === 'warning').length;
    
    return {
      totalBudgeted,
      totalSpent,
      totalRemaining: totalBudgeted - totalSpent,
      overallPercentage: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
      overBudgetCount,
      warningCount,
      onTrackCount: budgetAnalyses.length - overBudgetCount - warningCount,
    };
  }, [budgetAnalyses]);

  if (budgets.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="text-center py-12">
          <DollarSign className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No budgets to analyze</h3>
          <p className="text-gray-400">Create budgets to see spending analysis and alerts</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Budget Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {formatCurrency(overallStats.totalBudgeted)}
              </div>
              <div className="text-sm text-gray-400">Total Budgeted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {formatCurrency(overallStats.totalSpent)}
              </div>
              <div className="text-sm text-gray-400">Total Spent</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                overallStats.totalRemaining >= 0 ? 'text-emerald-500' : 'text-red-500'
              }`}>
                {formatCurrency(overallStats.totalRemaining)}
              </div>
              <div className="text-sm text-gray-400">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {overallStats.overallPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Used</div>
            </div>
          </div>
          
          <div className="mt-4">
            <Progress 
              value={Math.min(overallStats.overallPercentage, 100)} 
              className="h-3"
            />
          </div>

          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span>{overallStats.onTrackCount} On Track</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>{overallStats.warningCount} Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>{overallStats.overBudgetCount} Over Budget</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Budget Analysis */}
      <div className="grid gap-6">
        {budgetAnalyses.map((analysis) => (
          <Card key={analysis.budget.id} className="bg-gray-900 border-gray-800">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{analysis.budget.name}</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">
                    {analysis.budget.period} • {analysis.budget.budgetType}
                  </p>
                </div>
                <Badge className={`${getStatusColor(analysis.status)}`}>
                  {getStatusIcon(analysis.status)}
                  <span className="ml-1">{getStatusLabel(analysis.status)}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Spending Progress</span>
                  <span className="text-sm font-medium">
                    {analysis.percentageUsed.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(analysis.percentageUsed, 100)} 
                  className="h-2"
                />
              </div>

              {/* Budget vs Actual */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Budget</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(analysis.budget.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Spent</div>
                  <div className="text-lg font-semibold text-orange-500">
                    {formatCurrency(analysis.actualSpent)}
                  </div>
                </div>
              </div>

              {/* Projections and Insights */}
              <div className="border-t border-gray-800 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Remaining</div>
                    <div className={`font-medium ${
                      analysis.remainingAmount >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(analysis.remainingAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Days Left</div>
                    <div className="font-medium">{analysis.daysRemaining}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Daily Budget Left</div>
                    <div className="font-medium text-blue-400">
                      {formatCurrency(analysis.dailyBudgetRemaining)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Projected Total</div>
                    <div className={`font-medium ${
                      analysis.projectedSpending <= analysis.budget.amount 
                        ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(analysis.projectedSpending)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerts and Recommendations */}
              {analysis.status !== 'on_track' && (
                <div className="border-t border-gray-800 pt-4">
                  <div className={`p-3 rounded-lg ${
                    analysis.status === 'overspent' 
                      ? 'bg-red-500/10 border border-red-500/20' 
                      : 'bg-yellow-500/10 border border-yellow-500/20'
                  }`}>
                    <div className="flex items-start gap-2">
                      {getStatusIcon(analysis.status)}
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {analysis.status === 'overspent' 
                            ? 'Budget Exceeded!' 
                            : 'Approaching Budget Limit'
                          }
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {analysis.status === 'overspent' 
                            ? `You've exceeded your budget by ${formatCurrency(Math.abs(analysis.remainingAmount))}`
                            : `You have ${formatCurrency(analysis.remainingAmount)} left for ${analysis.daysRemaining} days`
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Helper function to calculate period end date
function getPeriodEndDate(startDate: Date, period: string): Date {
  const endDate = new Date(startDate);
  
  switch (period) {
    case 'weekly':
      endDate.setDate(endDate.getDate() + 7);
      break;
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'quarterly':
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      endDate.setMonth(endDate.getMonth() + 1);
  }
  
  return endDate;
}