"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalCard } from "@/components/goals/goal-card";
import { CreateGoalModal } from "@/components/goals/create-goal-modal";
import { EditGoalModal } from "@/components/goals/edit-goal-modal";
import { UIGoal } from "@/lib/db/schemas/goal";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function GoalsPage() {
  const t = useTranslations("pages.goals");
  const tCommon = useTranslations("common");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<UIGoal | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Build API URL with proper query string construction
  const buildApiUrl = () => {
    const params = new URLSearchParams();
    
    if (selectedFilter !== "all") {
      params.append("type", selectedFilter);
    }
    
    const queryString = params.toString();
    return `/api/goals${queryString ? `?${queryString}` : ""}`;
  };

  const { data, error, isLoading, mutate } = useSWR<{ goals: UIGoal[] }>(
    buildApiUrl(),
    fetcher
  );

  const goals = data?.goals || [];

  const handleCreateGoal = async (goalData: Partial<UIGoal>) => {
    try {
      // Transform camelCase to snake_case for API
      const apiData = {
        name: goalData.name,
        description: goalData.description,
        type: goalData.type,
        target_amount: goalData.targetAmount,
        current_amount: goalData.currentAmount,
        target_date: goalData.targetDate,
        category_id: goalData.categoryId,
        period: goalData.period,
      };

      console.log("Sending goal data:", apiData); // Debug log
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        mutate(); // Refresh goals list
        setIsCreateModalOpen(false);
      } else {
        // Log the error response
        const errorData = await response.text();
        console.error("API Error:", response.status, errorData);
      }
    } catch (error) {
      console.error("Error creating goal:", error);
    }
  };

  const handleEditGoal = (goal: UIGoal) => {
    setSelectedGoal(goal);
    setIsEditModalOpen(true);
  };

  const handleUpdateGoal = async (
    goalId: string,
    updateData: Partial<UIGoal>
  ) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        mutate(); // Refresh goals list
        setIsEditModalOpen(false);
        setSelectedGoal(null);
      } else {
        const errorData = await response.text();
        console.error("API Error:", response.status, errorData);
      }
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        mutate(); // Refresh goals list
      }
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const filterOptions = [
    { value: "all", label: t("allGoals") },
    { value: "savings", label: t("savings") },
    { value: "debt_payoff", label: t("debtPayoff") },
    { value: "spending_limit", label: t("spendingLimits") },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{tCommon("error")}. {tCommon("tryAgain")}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          {tCommon("add")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={selectedFilter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter(option.value)}
            className={
              selectedFilter === option.value
                ? "bg-emerald-600 hover:bg-emerald-700"
                : ""
            }
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t("noGoalsYet")}</h3>
            <p className="text-muted-foreground mb-6">
              {t("createFirstGoal")}
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("createFirstGoal")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
            />
          ))}
        </div>
      )}

      {/* Goal Summary */}
      {goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("goalsSummary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-500">
                  {goals.length}
                </div>
                <div className="text-sm text-muted-foreground">{t("totalGoals")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-500">
                  {goals.filter((goal) => goal.isAchieved).length}
                </div>
                <div className="text-sm text-muted-foreground">{t("achieved")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {
                    goals.filter(
                      (goal) => !goal.isAchieved && (goal.progress ?? 0) >= 50
                    ).length
                  }
                </div>
                <div className="text-sm text-muted-foreground">{t("inProgress")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {
                    goals.filter(
                      (goal) => goal.deadlineStatus?.status === "approaching"
                    ).length
                  }
                </div>
                <div className="text-sm text-muted-foreground">{t("dueSoon")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateGoal}
      />

      {/* Edit Goal Modal */}
      <EditGoalModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedGoal(null);
        }}
        onSave={handleUpdateGoal}
        goal={selectedGoal}
      />
    </div>
  );
}
