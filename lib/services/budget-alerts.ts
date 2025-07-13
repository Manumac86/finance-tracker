import { selectBudgets, selectTransactions } from "@/lib/db/postgres";
import { UIBudget } from "@/lib/db/schemas/budget";
import { UITransaction } from "@/lib/db/schemas/transaction";

export interface BudgetAnalysis {
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  isExceeded: boolean;
  daysRemaining: number;
  dailySpendingRate: number;
  projectedSpending: number;
}

export interface BudgetAlert {
  id: string;
  type: 'threshold_reached' | 'budget_exceeded' | 'approaching_limit';
  severity: 'info' | 'warning' | 'critical';
  budget: UIBudget;
  currentSpent: number;
  percentageUsed: number;
  message: string;
  recommendation?: string;
  timestamp: Date;
}

export interface AlertThreshold {
  percentage: number;
  type: 'threshold_reached' | 'approaching_limit';
  severity: 'info' | 'warning';
}

// Default alert thresholds
const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  { percentage: 50, type: 'threshold_reached', severity: 'info' },
  { percentage: 75, type: 'approaching_limit', severity: 'warning' },
  { percentage: 90, type: 'approaching_limit', severity: 'warning' },
];

export class BudgetAlertService {
  private static instance: BudgetAlertService;
  private alertCallbacks: ((alert: BudgetAlert) => void)[] = [];

  static getInstance(): BudgetAlertService {
    if (!BudgetAlertService.instance) {
      BudgetAlertService.instance = new BudgetAlertService();
    }
    return BudgetAlertService.instance;
  }

  // Subscribe to alerts
  onAlert(callback: (alert: BudgetAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      this.alertCallbacks = this.alertCallbacks.filter(cb => cb !== callback);
    };
  }

  // Trigger alert to all subscribers
  private triggerAlert(alert: BudgetAlert): void {
    this.alertCallbacks.forEach(callback => callback(alert));
  }

  // Check budgets after a new transaction
  async checkBudgetAlerts(userId: string, newTransaction: UITransaction): Promise<BudgetAlert[]> {
    try {
      const budgets = await selectBudgets(userId);
      const transactions = await selectTransactions(userId, 1000); // Get more transactions for accurate calculations
      
      const alerts: BudgetAlert[] = [];
      const now = new Date();

      for (const budget of budgets) {
        if (!budget.alertEnabled) continue;

        const analysis = this.analyzeBudget(budget, transactions);
        
        // Check if this transaction affects this budget
        if (!this.transactionAffectsBudget(newTransaction, budget)) continue;

        const previousSpent = analysis.spentAmount - Math.abs(newTransaction.amount);
        const previousPercentage = budget.amount > 0 ? (previousSpent / budget.amount) * 100 : 0;
        const currentPercentage = analysis.percentageUsed;

        // Check for threshold crossings
        const alertThreshold = budget.alertThresholdPercentage || 80;
        const thresholds = [
          ...DEFAULT_THRESHOLDS,
          { percentage: alertThreshold, type: 'threshold_reached' as const, severity: 'warning' as const }
        ];

        for (const threshold of thresholds) {
          if (previousPercentage < threshold.percentage && currentPercentage >= threshold.percentage) {
            const alert = this.createAlert(budget, analysis, threshold, now);
            alerts.push(alert);
            this.triggerAlert(alert);
          }
        }

        // Check for budget exceeded
        if (previousPercentage < 100 && currentPercentage >= 100 && budget.overspendAlertEnabled) {
          const alert = this.createExceededAlert(budget, analysis, now);
          alerts.push(alert);
          this.triggerAlert(alert);
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error checking budget alerts:', error);
      return [];
    }
  }

  // Analyze a single budget
  private analyzeBudget(budget: UIBudget, transactions: UITransaction[]) {
    const startDate = new Date(budget.startDate);
    const endDate = budget.endDate ? new Date(budget.endDate) : this.getPeriodEndDate(startDate, budget.period);
    
    // Filter transactions for this budget
    const relevantTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.transactionDate);
      const isInPeriod = transactionDate >= startDate && transactionDate <= endDate;
      const isExpense = transaction.transactionType === 'expense';
      
      if (budget.budgetType === 'category' && budget.categoryIds) {
        return isInPeriod && isExpense && budget.categoryIds.includes(transaction.categoryId);
      }
      
      if (budget.budgetType === 'total') {
        return isInPeriod && isExpense;
      }
      
      return isInPeriod && isExpense;
    });

    const spentAmount = relevantTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const percentageUsed = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;
    const remainingAmount = budget.amount - spentAmount;
    const isExceeded = spentAmount > budget.amount;
    
    // Calculate days remaining and spending rates
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const daysPassed = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const dailySpendingRate = daysPassed > 0 ? spentAmount / daysPassed : 0;
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const projectedSpending = dailySpendingRate * totalDays;

    return {
      spentAmount,
      percentageUsed,
      remainingAmount,
      isExceeded,
      daysRemaining,
      dailySpendingRate,
      projectedSpending,
    };
  }

  // Check if a transaction affects a specific budget
  private transactionAffectsBudget(transaction: UITransaction, budget: UIBudget): boolean {
    if (transaction.transactionType !== 'expense') return false;

    const transactionDate = new Date(transaction.transactionDate);
    const budgetStart = new Date(budget.startDate);
    const budgetEnd = budget.endDate ? new Date(budget.endDate) : this.getPeriodEndDate(budgetStart, budget.period);

    if (transactionDate < budgetStart || transactionDate > budgetEnd) return false;

    if (budget.budgetType === 'category' && budget.categoryIds) {
      return budget.categoryIds.includes(transaction.categoryId);
    }

    if (budget.budgetType === 'total') {
      return true;
    }

    return false;
  }

  // Create a threshold alert
  private createAlert(budget: UIBudget, analysis: BudgetAnalysis, threshold: AlertThreshold, timestamp: Date): BudgetAlert {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    };

    let message: string;
    let recommendation: string | undefined;

    switch (threshold.type) {
      case 'threshold_reached':
        message = `You've used ${threshold.percentage}% of your "${budget.name}" budget (${formatCurrency(analysis.spentAmount)} of ${formatCurrency(budget.amount)})`;
        if (threshold.percentage >= 75) {
          recommendation = `Consider reducing spending in this category. You have ${formatCurrency(analysis.remainingAmount)} remaining.`;
        }
        break;
      
      case 'approaching_limit':
        message = `Warning: You're approaching your "${budget.name}" budget limit at ${analysis.percentageUsed.toFixed(1)}%`;
        recommendation = `Only ${formatCurrency(analysis.remainingAmount)} remaining. Consider slowing down spending in this category.`;
        break;
      
      default:
        message = `Budget alert for "${budget.name}"`;
    }

    return {
      id: `${budget.id}-${threshold.type}-${Date.now()}`,
      type: threshold.type,
      severity: threshold.severity,
      budget,
      currentSpent: analysis.spentAmount,
      percentageUsed: analysis.percentageUsed,
      message,
      recommendation,
      timestamp,
    };
  }

  // Create a budget exceeded alert
  private createExceededAlert(budget: UIBudget, analysis: BudgetAnalysis, timestamp: Date): BudgetAlert {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    };

    const overspentAmount = Math.abs(analysis.remainingAmount);
    
    return {
      id: `${budget.id}-exceeded-${Date.now()}`,
      type: 'budget_exceeded',
      severity: 'critical',
      budget,
      currentSpent: analysis.spentAmount,
      percentageUsed: analysis.percentageUsed,
      message: `Budget exceeded! You've overspent "${budget.name}" by ${formatCurrency(overspentAmount)}`,
      recommendation: `Your total spending (${formatCurrency(analysis.spentAmount)}) has exceeded your budget of ${formatCurrency(budget.amount)}. Consider reviewing your recent transactions.`,
      timestamp,
    };
  }

  // Helper function to calculate period end date
  private getPeriodEndDate(startDate: Date, period: string): Date {
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

  // Get current budget status for all budgets
  async getBudgetStatuses(userId: string): Promise<{ budget: UIBudget; analysis: BudgetAnalysis; alerts: string[] }[]> {
    try {
      const budgets = await selectBudgets(userId);
      const transactions = await selectTransactions(userId, 1000);

      return budgets.map(budget => {
        const analysis = this.analyzeBudget(budget, transactions);
        const alerts: string[] = [];

        if (analysis.percentageUsed >= 100) {
          alerts.push('Budget exceeded');
        } else if (analysis.percentageUsed >= (budget.alertThresholdPercentage || 80)) {
          alerts.push('Approaching limit');
        }

        return { budget, analysis, alerts };
      });
    } catch (error) {
      console.error('Error getting budget statuses:', error);
      return [];
    }
  }
}