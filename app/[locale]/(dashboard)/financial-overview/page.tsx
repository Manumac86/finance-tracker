"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { 
  Target,
  CreditCard,
  DollarSign,
  Plus,
  TrendingUp,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebtSummary } from "@/components/debts/debt-summary";
import { DebtPaymentBudget } from "@/components/budgets/debt-payment-budget";
import { DebtBudgetGoalsWidget } from "@/components/dashboard/debt-budget-goals-widget";
import { DebtPayoffGoalModal } from "@/components/goals/debt-payoff-goal-modal";
import { CreateDebtBudgetModal } from "@/components/budgets/create-debt-budget-modal";
import { DebtPayoffGoalCard } from "@/components/goals/debt-payoff-goal-card";

// Mock data - replace with actual API calls
const mockGoals = [
  {
    id: "goal-1",
    name: "Pay off Credit Card",
    description: "Aggressive payoff strategy for Chase Sapphire",
    type: "debt_payoff",
    target_amount: 5000,
    current_amount: 2000,
    target_date: "2025-12-31",
    progress: 40,
    is_active: true,
    metadata: {
      debt_id: "debt-1",
      debt_name: "Chase Sapphire",
      strategy: "accelerated",
      extra_payment_amount: 200,
      projected_months: 18,
      projected_total_interest: 800,
      monthly_payment: 350,
      interest_saved: 400,
      months_saved: 6,
    },
    created_at: "2025-01-01T00:00:00Z",
  },
];

const mockBudgets = [
  {
    id: "budget-1",
    name: "Debt Payments",
    description: "Monthly budget for all debt payments",
    amount: 1200,
    current_spent: 800,
    metadata: {
      debt_budget: true,
      debt_strategy: "accelerated",
    },
  },
];

export default function FinancialOverviewPage() {
  const t = useTranslations("financialOverview");
  const [showDebtGoalModal, setShowDebtGoalModal] = useState(false);
  const [showDebtBudgetModal, setShowDebtBudgetModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Mock API functions - replace with actual implementations
  const handleCreateDebtGoal = async (goalData: unknown) => {
    console.log("Creating debt goal:", goalData);
    // API call to create goal
  };

  const handleCreateDebtBudget = async (budgetData: unknown) => {
    console.log("Creating debt budget:", budgetData);
    // API call to create budget
  };

  const handleEditGoal = (goal: unknown) => {
    console.log("Editing goal:", goal);
    // Navigate to edit goal
  };

  const handleDeleteGoal = async (goalId: string) => {
    console.log("Deleting goal:", goalId);
    // API call to delete goal
  };

  const navigateToDebts = () => {
    // Navigate to debts page
    window.location.href = "/debts";
  };

  const navigateToGoals = () => {
    // Navigate to goals page
    window.location.href = "/goals";
  };

  const navigateToBudgets = () => {
    // Navigate to budgets page
    window.location.href = "/budgets";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowDebtGoalModal(true)}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            {t("actions.createGoal")}
          </Button>
          <Button 
            onClick={() => setShowDebtBudgetModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("actions.createBudget")}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
          <TabsTrigger value="debts">{t("tabs.debts")}</TabsTrigger>
          <TabsTrigger value="budgets">{t("tabs.budgets")}</TabsTrigger>
          <TabsTrigger value="goals">{t("tabs.goals")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Integrated Dashboard Widget */}
          <DebtBudgetGoalsWidget
            goals={mockGoals}
            budgets={mockBudgets}
            onNavigateToDebts={navigateToDebts}
            onNavigateToGoals={navigateToGoals}
            onNavigateToBudgets={navigateToBudgets}
            onCreateDebtGoal={() => setShowDebtGoalModal(true)}
          />

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("stats.totalDebt")}</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">$15,450</div>
                <p className="text-xs text-muted-foreground">
                  {t("stats.acrossDebts", { count: 3 })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("stats.monthlyPayments")}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$1,250</div>
                <p className="text-xs text-muted-foreground">
                  {t("stats.budgeted")}: $1,400
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("stats.activeGoals")}</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">
                  {t("stats.avgProgress")}: 45%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("stats.projectedSavings")}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">$2,800</div>
                <p className="text-xs text-muted-foreground">
                  {t("stats.interestSaved")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {t("recentActivity.title")}
                </CardTitle>
                <Button variant="ghost" size="sm">
                  {t("recentActivity.viewAll")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <div>
                      <p className="font-medium">{t("recentActivity.payment")}</p>
                      <p className="text-sm text-muted-foreground">Chase Sapphire - $350</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">2h ago</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div>
                      <p className="font-medium">{t("recentActivity.goalUpdate")}</p>
                      <p className="text-sm text-muted-foreground">Credit Card Payoff - 45% complete</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">1d ago</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <div>
                      <p className="font-medium">{t("recentActivity.budgetAlert")}</p>
                      <p className="text-sm text-muted-foreground">Debt Payments - 80% used</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">3d ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debts" className="space-y-6 mt-6">
          <DebtSummary />
          <DebtPaymentBudget 
            onCreateDebtBudget={() => setShowDebtBudgetModal(true)}
            onCreatePayoffGoal={() => setShowDebtGoalModal(true)}
          />
          
          <div className="flex justify-center">
            <Button onClick={navigateToDebts} className="flex items-center gap-2">
              {t("navigation.viewAllDebts")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("budgets.debtBudgets")}</CardTitle>
                <Button onClick={() => setShowDebtBudgetModal(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("budgets.createNew")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockBudgets.map((budget) => (
                  <div key={budget.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{budget.name}</h3>
                      <p className="text-sm text-muted-foreground">{budget.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${budget.current_spent} / ${budget.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        {((budget.current_spent / budget.amount) * 100).toFixed(0)}% used
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button onClick={navigateToBudgets} className="flex items-center gap-2">
              {t("navigation.viewAllBudgets")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t("goals.debtPayoffGoals")}</CardTitle>
                <Button onClick={() => setShowDebtGoalModal(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("goals.createNew")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {mockGoals.map((goal) => (
                  <DebtPayoffGoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={handleEditGoal}
                    onDelete={handleDeleteGoal}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button onClick={navigateToGoals} className="flex items-center gap-2">
              {t("navigation.viewAllGoals")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <DebtPayoffGoalModal
        open={showDebtGoalModal}
        onClose={() => setShowDebtGoalModal(false)}
        onSubmit={handleCreateDebtGoal}
      />

      <CreateDebtBudgetModal
        open={showDebtBudgetModal}
        onClose={() => setShowDebtBudgetModal(false)}
        onSubmit={handleCreateDebtBudget}
      />
    </div>
  );
}