"use client";

import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateBudgetModal } from "@/components/budgets/create-budget-modal";
import { EditBudgetModal } from "@/components/budgets/edit-budget-modal";
import { EnhancedBudgetCard } from "@/components/budgets/enhanced-budget-card";
import { UIBudget } from "@/lib/db/schemas/budget";
import { BudgetFormData } from "@/types/forms";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BudgetsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<UIBudget | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  
  const t = useTranslations("pages.budgets");

  // Build API URL with proper query string construction
  const buildApiUrl = () => {
    const params = new URLSearchParams();

    if (selectedFilter !== "all") {
      params.append("period", selectedFilter);
    }

    const queryString = params.toString();
    return `/api/budgets${queryString ? `?${queryString}` : ""}`;
  };

  const { data, error, isLoading, mutate } = useSWR<{ budgets: UIBudget[] }>(
    buildApiUrl(),
    fetcher
  );

  const budgets = data?.budgets || [];

  const handleCreateBudget = async (budgetData: BudgetFormData) => {
    try {
      // Transform camelCase to snake_case for API
      const apiData = {
        name: budgetData.name,
        description: budgetData.description,
        budget_type: budgetData.budgetType,
        ...(budgetData.categoryId ? { category_id: budgetData.categoryId } : {}),
        amount: parseFloat(budgetData.amount),
        period: budgetData.period,
        start_date: budgetData.startDate,
        end_date: budgetData.endDate,
        alert_threshold_percentage: budgetData.alertThresholdPercentage,
        alert_enabled: budgetData.alertEnabled,
        overspend_alert_enabled: budgetData.overspendAlertEnabled,
        rollover_enabled: budgetData.rolloverEnabled,
        rollover_type: budgetData.rolloverType,
      };

      console.log("Sending budget data:", apiData);
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        mutate(); // Refresh budgets list
        setIsCreateModalOpen(false);
      } else {
        // Log the error response
        const errorData = await response.text();
        console.error("API Error:", response.status, errorData);
      }
    } catch (error) {
      console.error("Error creating budget:", error);
    }
  };

  const handleEditBudget = (budget: UIBudget) => {
    setSelectedBudget(budget);
    setIsEditModalOpen(true);
  };

  const handleUpdateBudget = async (
    budgetId: string,
    updateData: BudgetFormData
  ) => {
    try {
      // Transform camelCase to snake_case for API
      const apiData = {
        name: updateData.name,
        description: updateData.description,
        budget_type: updateData.budgetType,
        ...(updateData.categoryId ? { category_id: updateData.categoryId } : {}),
        amount: parseFloat(updateData.amount),
        period: updateData.period,
        start_date: updateData.startDate,
        end_date: updateData.endDate,
        alert_threshold_percentage: updateData.alertThresholdPercentage,
        alert_enabled: updateData.alertEnabled,
        overspend_alert_enabled: updateData.overspendAlertEnabled,
        rollover_enabled: updateData.rolloverEnabled,
        rollover_type: updateData.rolloverType,
      };

      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        mutate(); // Refresh budgets list
        setIsEditModalOpen(false);
        setSelectedBudget(null);
      } else {
        const errorData = await response.text();
        console.error("API Error:", response.status, errorData);
      }
    } catch (error) {
      console.error("Error updating budget:", error);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        mutate(); // Refresh budgets list
      }
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  };

  const getBudgetStats = () => {
    const totalBudgets = budgets.length;
    const activeBudgets = budgets.filter((b) => b.isActive).length;
    const overBudget = budgets.filter((b) => b.status === "overspent").length;
    const warningBudgets = budgets.filter((b) => b.status === "warning").length;

    return { totalBudgets, activeBudgets, overBudget, warningBudgets };
  };

  const stats = getBudgetStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t("loadingBudgets")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-destructive">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>{t("failedToLoadBudgets")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
          data-testid="create-budget-header-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("createBudget")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalBudgets")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBudgets}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("activeBudgets")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {stats.activeBudgets}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("warnings")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {stats.warningBudgets}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("overBudget")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.overBudget}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFilter("all")}
          className="border"
        >
          {t("allBudgets")}
        </Button>
        <Button
          variant={selectedFilter === "monthly" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFilter("monthly")}
          className="border"
        >
          {t("monthly")}
        </Button>
        <Button
          variant={selectedFilter === "weekly" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFilter("weekly")}
          className="border"
        >
          {t("weekly")}
        </Button>
        <Button
          variant={selectedFilter === "yearly" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedFilter("yearly")}
          className="border"
        >
          {t("yearly")}
        </Button>
      </div>

      {/* Budgets Grid */}
      {budgets.length === 0 ? (
        <Card className="bg-card border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-600/10 flex items-center justify-center mx-auto mb-4">
                <Plus className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">{t("noBudgetsYet")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("createFirstBudget")}
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
                data-testid="create-first-budget-button"
              >
                {t("createBudget")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {budgets.map((budget) => (
            <EnhancedBudgetCard
              key={budget.id}
              budget={budget}
              onEdit={handleEditBudget}
              onDelete={handleDeleteBudget}
            />
          ))}
        </div>
      )}

      {/* Create Budget Modal */}
      <CreateBudgetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateBudget}
      />

      {/* Edit Budget Modal */}
      <EditBudgetModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBudget(null);
        }}
        onSave={handleUpdateBudget}
        budget={selectedBudget}
      />
    </div>
  );
}
