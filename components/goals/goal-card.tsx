"use client";

import { useState } from "react";
import { Edit, Trash2, Trophy, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { UIGoal } from "@/lib/db/schemas/goal";
import { CelebrationModal } from "./celebration-modal";
import { useTranslations } from "next-intl";

interface GoalCardProps {
  goal: UIGoal;
  onEdit: (goal: UIGoal) => void;
  onDelete: (goalId: string) => void;
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const [showCelebration, setShowCelebration] = useState(
    goal.isAchieved &&
      goal.achievedAt &&
      new Date(goal.achievedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000 // Within last 24 hours
  );
  const t = useTranslations("goalCard");

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

  const getGoalTypeColor = (type: string) => {
    switch (type) {
      case "savings":
        return "bg-emerald-600";
      case "debt_payoff":
        return "bg-rose-600";
      case "spending_limit":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case "savings":
        return t("savings");
      case "debt_payoff":
        return t("debtPayoff");
      case "spending_limit":
        return t("spendingLimit");
      default:
        return type;
    }
  };

  const getProgressDisplay = () => {
    if (goal.type === "debt_payoff") {
      return `${formatCurrency(goal.currentAmount)} ${t("remaining")}`;
    }
    return `${formatCurrency(goal.currentAmount)} / ${formatCurrency(
      goal.targetAmount
    )}`;
  };

  const getDeadlineDisplay = () => {
    if (!goal.deadlineStatus) return null;

    const { status, daysRemaining } = goal.deadlineStatus;

    if (status === "overdue") {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {t("daysOverdue", { days: Math.abs(daysRemaining) })}
        </Badge>
      );
    }

    if (status === "approaching") {
      return (
        <Badge variant="secondary" className="text-xs bg-yellow-600">
          <Clock className="h-3 w-3 mr-1" />
          {t("daysRemaining", { days: daysRemaining })}
        </Badge>
      );
    }

    return null;
  };

  return (
    <>
      <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`text-xs ${getGoalTypeColor(goal.type)}`}>
                  {getGoalTypeLabel(goal.type)}
                </Badge>
                {goal.isAchieved && (
                  <Badge
                    data-testid="achievement-badge"
                    className="text-xs bg-green-600"
                  >
                    <Trophy className="h-3 w-3 mr-1" />
                    {t("achieved")}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-lg">{goal.name}</h3>
              {goal.description && (
                <p className="text-sm text-gray-400 mt-1">{goal.description}</p>
              )}
            </div>
            <div className="flex gap-1 ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(goal)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(goal.id!)}
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
              <span className="text-sm text-gray-400">{t("progress")}</span>
              <span className="text-sm font-medium">{goal.progress || 0}%</span>
            </div>
            <Progress
              value={goal.progress || 0}
              className="h-2"
              aria-valuenow={goal.progress || 0}
            />
          </div>

          {/* Amount Display */}
          <div className="text-center py-2">
            <div className="text-xl font-bold">{getProgressDisplay()}</div>
          </div>

          {/* Target Date and Deadline Status */}
          {goal.targetDate && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">
                {t("target")}: {formatDate(goal.targetDate)}
              </span>
              {getDeadlineDisplay()}
            </div>
          )}

          {/* Achievement Date */}
          {goal.achievedAt && (
            <div className="text-center text-sm text-green-400">
              {t("achievedOn", { date: formatDate(goal.achievedAt) || "" })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Celebration Modal */}
      {showCelebration && (
        <CelebrationModal
          goal={goal}
          isOpen={showCelebration}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </>
  );
}
