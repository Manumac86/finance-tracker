"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { 
  Target,
  CreditCard,
  DollarSign,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Calculator
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useDebts } from "@/contexts/debts";

interface Goal {
  id: string;
  name: string;
  description?: string;
  type: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  progress?: number;
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface Budget {
  id: string;
  name: string;
  description?: string;
  amount: number;
  current_spent: number;
  metadata?: Record<string, unknown>;
}

interface DebtBudgetGoalsWidgetProps {
  goals?: Goal[]; // Goal data from goals context
  budgets?: Budget[]; // Budget data from budgets context
  onNavigateToDebts?: () => void;
  onNavigateToGoals?: () => void;
  onNavigateToBudgets?: () => void;
  onCreateDebtGoal?: () => void;
}

export function DebtBudgetGoalsWidget({ 
  goals = [],
  budgets = [],
  onNavigateToDebts,
  onNavigateToGoals,
  onNavigateToBudgets,
  onCreateDebtGoal
}: DebtBudgetGoalsWidgetProps) {
  const t = useTranslations("dashboard");
  const { debts, summary, isLoading } = useDebts();
  const [activeTab, setActiveTab] = useState("overview");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getIntegratedInsights = () => {
    if (!debts || !summary) return null;

    const activeDebts = debts.filter(d => d.is_active);
    const debtPayoffGoals = goals.filter(g => g.type === "debt_payoff" && g.is_active);
    const debtRelatedBudgets = budgets.filter(b => 
      b.name.toLowerCase().includes("debt") || 
      b.name.toLowerCase().includes("payment") ||
      b.description?.toLowerCase().includes("debt")
    );

    const totalDebtPayments = summary.total_minimum_payments;
    const totalBudgetForDebt = debtRelatedBudgets.reduce((sum, b) => sum + b.amount, 0);
    const budgetVsPaymentGap = totalBudgetForDebt - totalDebtPayments;

    return {
      activeDebts: activeDebts.length,
      totalDebtBalance: summary.total_debt,
      monthlyPayments: totalDebtPayments,
      debtGoals: debtPayoffGoals.length,
      debtBudgets: debtRelatedBudgets.length,
      budgetedForDebt: totalBudgetForDebt,
      budgetGap: budgetVsPaymentGap,
      averageGoalProgress: debtPayoffGoals.length > 0 ? 
        debtPayoffGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / debtPayoffGoals.length : 0,
      upcomingDebtMilestones: getUpcomingMilestones(activeDebts, debtPayoffGoals),
    };
  };

  const getUpcomingMilestones = (debts: any[], goals: Goal[]) => {
    const milestones: Array<{ type: string; date: string; description: string; title: string; amount?: number; priority?: string }> = [];

    // Add debt payoff projections
    debts.forEach(debt => {
      if (debt.minimum_payment && debt.interest_rate) {
        const monthlyRate = debt.interest_rate / 100 / 12;
        if (debt.minimum_payment > debt.current_balance * monthlyRate) {
          const months = Math.ceil(
            -Math.log(1 - (debt.current_balance * monthlyRate) / debt.minimum_payment) / 
            Math.log(1 + monthlyRate)
          );
          const payoffDate = new Date();
          payoffDate.setMonth(payoffDate.getMonth() + months);
          
          milestones.push({
            type: "debt_payoff",
            title: `${debt.name} payoff`,
            description: `${debt.name} payoff`,
            date: payoffDate.toISOString().split('T')[0],
            amount: debt.current_balance,
            priority: debt.interest_rate > 20 ? "high" : debt.interest_rate > 10 ? "medium" : "low",
          });
        }
      }
    });

    // Add goal targets
    goals.forEach(goal => {
      if (goal.target_date) {
        milestones.push({
          type: "goal_target",
          title: goal.name,
          description: goal.name,
          date: goal.target_date,
          amount: goal.target_amount - goal.current_amount,
          priority: "medium",
        });
      }
    });

    return milestones
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  };

  const getFinancialHealthScore = (insights: any) => {
    if (!insights) return 0;

    let score = 100;

    // Debt-to-income impact (0-40 points)
    if (summary?.debt_to_income_ratio) {
      if (summary.debt_to_income_ratio > 36) score -= 40;
      else if (summary.debt_to_income_ratio > 28) score -= 30;
      else if (summary.debt_to_income_ratio > 20) score -= 20;
      else if (summary.debt_to_income_ratio > 10) score -= 10;
    }

    // Budget planning impact (0-30 points)
    if (insights.budgetGap < -100) score -= 30; // Under-budgeted
    else if (insights.budgetGap < 0) score -= 15;
    else if (insights.budgetGap > insights.monthlyPayments * 0.5) score -= 10; // Over-budgeted

    // Goal progress impact (0-30 points)
    if (insights.debtGoals === 0) score -= 20; // No debt goals
    else if (insights.averageGoalProgress < 25) score -= 15;
    else if (insights.averageGoalProgress < 50) score -= 10;

    return Math.max(0, Math.min(100, score));
  };

  const insights = getIntegratedInsights();
  const healthScore = insights ? getFinancialHealthScore(insights) : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("debtIntegration.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("debtIntegration.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {t("debtIntegration.noData")}
            </p>
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
            <Target className="h-5 w-5" />
            {t("debtIntegration.title")}
          </CardTitle>
          <Badge 
            variant={healthScore >= 80 ? "default" : healthScore >= 60 ? "secondary" : "destructive"}
          >
            {t("debtIntegration.healthScore")}: {healthScore}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">{t("debtIntegration.overview")}</TabsTrigger>
            <TabsTrigger value="budget">{t("debtIntegration.budgetAlign")}</TabsTrigger>
            <TabsTrigger value="goals">{t("debtIntegration.goalTrack")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Financial Snapshot */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <CreditCard className="h-5 w-5 mx-auto mb-2 text-destructive" />
                <p className="text-sm text-muted-foreground">{t("debtIntegration.totalDebt")}</p>
                <p className="font-semibold text-destructive">
                  {formatCurrency(insights.totalDebtBalance)}
                </p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <DollarSign className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                <p className="text-sm text-muted-foreground">{t("debtIntegration.monthlyPayments")}</p>
                <p className="font-semibold">
                  {formatCurrency(insights.monthlyPayments)}
                </p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Target className="h-5 w-5 mx-auto mb-2 text-emerald-600" />
                <p className="text-sm text-muted-foreground">{t("debtIntegration.activeGoals")}</p>
                <p className="font-semibold">{insights.debtGoals}</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Calculator className="h-5 w-5 mx-auto mb-2 text-purple-600" />
                <p className="text-sm text-muted-foreground">{t("debtIntegration.budgets")}</p>
                <p className="font-semibold">{insights.debtBudgets}</p>
              </div>
            </div>

            {/* Health Score Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">{t("debtIntegration.financialHealth")}</h4>
                <span className="text-sm text-muted-foreground">
                  {healthScore >= 80 ? t("debtIntegration.excellent") :
                   healthScore >= 60 ? t("debtIntegration.good") :
                   healthScore >= 40 ? t("debtIntegration.fair") :
                   t("debtIntegration.needsAttention")}
                </span>
              </div>
              <Progress value={healthScore} className="h-3" />
              
              <div className="text-sm text-muted-foreground">
                {healthScore < 80 && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mt-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        {t("debtIntegration.improvementTip")}
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300">
                        {insights.debtGoals === 0 ? t("debtIntegration.tipCreateGoals") :
                         insights.budgetGap < -100 ? t("debtIntegration.tipIncreaseBudget") :
                         t("debtIntegration.tipOptimizePayments")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Milestones */}
            {insights.upcomingDebtMilestones.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("debtIntegration.upcomingMilestones")}
                </h4>
                <div className="space-y-2">
                  {insights.upcomingDebtMilestones.map((milestone, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          milestone.priority === "high" ? "bg-red-500" :
                          milestone.priority === "medium" ? "bg-yellow-500" :
                          "bg-green-500"
                        }`} />
                        <div>
                          <p className="font-medium">{milestone.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(milestone.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(milestone.amount || 0)}</p>
                        <p className="text-xs text-muted-foreground">
                          {milestone.type === "debt_payoff" ? t("debtIntegration.payoff") : t("debtIntegration.target")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="budget" className="space-y-4 mt-4">
            {/* Budget vs Payments Analysis */}
            <div className="space-y-4">
              <h4 className="font-semibold">{t("debtIntegration.budgetAnalysis")}</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span>{t("debtIntegration.requiredPayments")}:</span>
                  <span className="font-semibold">{formatCurrency(insights.monthlyPayments)}</span>
                </div>
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span>{t("debtIntegration.budgetedAmount")}:</span>
                  <span className="font-semibold">{formatCurrency(insights.budgetedForDebt)}</span>
                </div>
                <Separator />
                <div className={`flex justify-between p-3 rounded-lg ${
                  insights.budgetGap >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"
                }`}>
                  <span className="font-medium">
                    {insights.budgetGap >= 0 ? t("debtIntegration.surplus") : t("debtIntegration.shortfall")}:
                  </span>
                  <span className={`font-bold ${
                    insights.budgetGap >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {formatCurrency(Math.abs(insights.budgetGap))}
                  </span>
                </div>
              </div>

              {insights.budgetGap < 0 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        {t("debtIntegration.budgetShortfall")}
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                        {t("debtIntegration.budgetShortfallAdvice")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" onClick={onNavigateToBudgets}>
                  {t("debtIntegration.adjustBudgets")}
                </Button>
                <Button variant="outline" size="sm" onClick={onNavigateToDebts}>
                  {t("debtIntegration.viewDebts")}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4 mt-4">
            {/* Goal Progress Overview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">{t("debtIntegration.debtGoals")}</h4>
                <Button size="sm" onClick={onCreateDebtGoal} className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {t("debtIntegration.createGoal")}
                </Button>
              </div>

              {insights.debtGoals === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">{t("debtIntegration.noGoals")}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t("debtIntegration.noGoalsDescription")}
                  </p>
                  <Button onClick={onCreateDebtGoal}>
                    {t("debtIntegration.createFirstGoal")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>{t("debtIntegration.averageProgress")}:</span>
                    <span className="font-semibold">{insights.averageGoalProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={insights.averageGoalProgress} className="h-2" />
                  
                  <div className="grid gap-2">
                    {goals.filter(g => g.type === "debt_payoff" && g.is_active).slice(0, 3).map(goal => (
                      <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{goal.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{(goal.progress || 0).toFixed(1)}%</p>
                          {goal.target_date && (
                            <p className="text-xs text-muted-foreground">
                              {formatDate(goal.target_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" size="sm" onClick={onNavigateToGoals}>
                    {t("debtIntegration.viewAllGoals")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}