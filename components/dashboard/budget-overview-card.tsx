"use client";

import { useMemo } from "react";
import { DollarSign, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UIBudget } from "@/lib/db/schemas/budget";
import { UITransaction } from "@/lib/db/schemas/transaction";
import Link from "next/link";

interface BudgetOverviewCardProps {
  budgets: UIBudget[];
  transactions: UITransaction[];
}

interface BudgetAnalysis {
  budget: UIBudget;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'on-track' | 'warning' | 'exceeded';
}

export function BudgetOverviewCard({ budgets, transactions }: BudgetOverviewCardProps) {
  const budgetAnalyses = useMemo((): BudgetAnalysis[] => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return budgets.map(budget => {
      // Calculate spending for this budget
      const relevantTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.transactionDate);
        const isCurrentPeriod = transactionDate.getMonth() === currentMonth && 
                               transactionDate.getFullYear() === currentYear;
        const isExpense = transaction.transactionType === 'expense';
        
        // For category budgets, filter by category
        if (budget.budgetType === 'category' && budget.categoryId) {
          return isCurrentPeriod && isExpense && transaction.categoryId === budget.categoryId;
        }
        
        // For total budgets, include all expenses
        if (budget.budgetType === 'total') {
          return isCurrentPeriod && isExpense;
        }
        
        // For custom budgets, include all for now (could be enhanced later)
        return isCurrentPeriod && isExpense;
      });
      
      const spent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
      const remaining = Math.max(0, budget.amount - spent);
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      
      let status: BudgetAnalysis['status'] = 'on-track';
      if (percentage >= 100) {
        status = 'exceeded';
      } else if (percentage >= (budget.alertThresholdPercentage ?? 80)) {
        status = 'warning';
      }
      
      return {
        budget,
        spent,
        remaining,
        percentage,
        status
      };
    });
  }, [budgets, transactions]);

  const overallStats = useMemo(() => {
    const totalBudgeted = budgetAnalyses.reduce((sum, analysis) => sum + analysis.budget.amount, 0);
    const totalSpent = budgetAnalyses.reduce((sum, analysis) => sum + analysis.spent, 0);
    const exceededCount = budgetAnalyses.filter(a => a.status === 'exceeded').length;
    const warningCount = budgetAnalyses.filter(a => a.status === 'warning').length;
    
    return {
      totalBudgeted,
      totalSpent,
      totalRemaining: Math.max(0, totalBudgeted - totalSpent),
      overallPercentage: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
      exceededCount,
      warningCount,
      onTrackCount: budgetAnalyses.length - exceededCount - warningCount
    };
  }, [budgetAnalyses]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: BudgetAnalysis['status']) => {
    switch (status) {
      case 'exceeded':
        return 'text-red-500 bg-red-900/20';
      case 'warning':
        return 'text-yellow-500 bg-yellow-900/20';
      case 'on-track':
        return 'text-emerald-500 bg-emerald-900/20';
    }
  };

  const getStatusIcon = (status: BudgetAnalysis['status']) => {
    switch (status) {
      case 'exceeded':
        return <AlertTriangle className="w-3 h-3" />;
      case 'warning':
        return <TrendingDown className="w-3 h-3" />;
      case 'on-track':
        return <TrendingUp className="w-3 h-3" />;
    }
  };

  if (budgets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Budget Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <div className="text-muted-foreground mb-4">No budgets set yet</div>
          <Link href="/budgets">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Create Your First Budget
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Budget Overview
          </CardTitle>
          <Badge 
            variant="secondary" 
            className={overallStats.overallPercentage > 100 ? 'bg-red-900/20 text-red-500' : 
                      overallStats.overallPercentage > 80 ? 'bg-yellow-900/20 text-yellow-500' : 
                      'bg-emerald-900/20 text-emerald-500'}
          >
            {Math.round(overallStats.overallPercentage)}% used
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {formatCurrency(overallStats.totalSpent)} / {formatCurrency(overallStats.totalBudgeted)}
            </span>
            <span className="text-emerald-500">
              {formatCurrency(overallStats.totalRemaining)} left
            </span>
          </div>
          <Progress 
            value={Math.min(100, overallStats.overallPercentage)} 
            className="h-3"
          />
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-emerald-500">{overallStats.onTrackCount}</div>
            <div className="text-xs text-muted-foreground">On Track</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-500">{overallStats.warningCount}</div>
            <div className="text-xs text-muted-foreground">Warning</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-500">{overallStats.exceededCount}</div>
            <div className="text-xs text-muted-foreground">Exceeded</div>
          </div>
        </div>

        {/* Top Concerning Budgets */}
        {budgetAnalyses.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">Budget Status</div>
            {budgetAnalyses
              .sort((a, b) => b.percentage - a.percentage)
              .slice(0, 3)
              .map((analysis) => (
                <div key={analysis.budget.id} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{analysis.budget.name}</div>
                    <Badge className={getStatusColor(analysis.status)}>
                      {getStatusIcon(analysis.status)}
                      {Math.round(analysis.percentage)}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {formatCurrency(analysis.spent)} / {formatCurrency(analysis.budget.amount)}
                      </span>
                      <span className={analysis.remaining <= 0 ? 'text-red-500' : 'text-emerald-500'}>
                        {analysis.remaining <= 0 ? 
                          `${formatCurrency(Math.abs(analysis.remaining))} over` : 
                          `${formatCurrency(analysis.remaining)} left`
                        }
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(100, analysis.percentage)} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Action Button */}
        <Link href="/budgets">
          <Button 
            variant="outline" 
            className="w-full"
          >
            Manage All Budgets
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}