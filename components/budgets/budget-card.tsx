"use client";

import { Edit, Trash2, AlertTriangle, TrendingUp, Calendar, Target } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { UIBudget } from "@/lib/db/schemas/budget";

interface BudgetCardProps {
  budget: UIBudget;
  onEdit: (budget: UIBudget) => void;
  onDelete: (budgetId: string) => void;
}

export function BudgetCard({ budget, onEdit, onDelete }: BudgetCardProps) {
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

  const getBudgetTypeColor = (type: string) => {
    switch (type) {
      case "category":
        return "bg-blue-600";
      case "total":
        return "bg-purple-600";
      case "custom":
        return "bg-orange-600";
      default:
        return "bg-gray-600";
    }
  };

  const getBudgetTypeLabel = (type: string) => {
    switch (type) {
      case "category":
        return "Category Budget";
      case "total":
        return "Total Budget";
      case "custom":
        return "Custom Budget";
      default:
        return type;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "overspent":
        return "text-red-400 bg-red-900/20";
      case "warning":
        return "text-yellow-400 bg-yellow-900/20";
      case "on_track":
        return "text-emerald-400 bg-emerald-900/20";
      default:
        return "text-gray-400 bg-gray-900/20";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "overspent":
        return <AlertTriangle className="w-3 h-3 mr-1" />;
      case "warning":
        return <AlertTriangle className="w-3 h-3 mr-1" />;
      case "on_track":
        return <TrendingUp className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getProgressColor = (status?: string) => {
    switch (status) {
      case "overspent":
        return "bg-red-600";
      case "warning":
        return "bg-yellow-600";
      case "on_track":
        return "bg-emerald-600";
      default:
        return "bg-gray-600";
    }
  };

  const getPeriodDisplay = (period: string) => {
    switch (period) {
      case "weekly":
        return "Weekly";
      case "monthly":
        return "Monthly";
      case "quarterly":
        return "Quarterly";
      case "yearly":
        return "Yearly";
      default:
        return period;
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`text-xs ${getBudgetTypeColor(budget.budgetType)}`}>
                {getBudgetTypeLabel(budget.budgetType)}
              </Badge>
              <Badge className={`text-xs ${getPeriodDisplay(budget.period)}`}>
                {getPeriodDisplay(budget.period)}
              </Badge>
              {budget.status && (
                <Badge 
                  className={`text-xs ${getStatusColor(budget.status)}`}
                >
                  {getStatusIcon(budget.status)}
                  {budget.status === "on_track" ? "On Track" : 
                   budget.status === "warning" ? "Warning" : "Over Budget"}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg">{budget.name}</h3>
            {budget.description && (
              <p className="text-sm text-gray-400 mt-1">{budget.description}</p>
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
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm font-medium">{budget.percentageUsed || 0}%</span>
          </div>
          <Progress 
            value={Math.min(budget.percentageUsed || 0, 100)} 
            className="h-2"
          />
        </div>

        {/* Amount Display */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Spent</span>
            <span className="font-medium">{formatCurrency(budget.currentSpent)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Budget</span>
            <span className="font-medium">{formatCurrency(budget.amount)}</span>
          </div>
          <div className="flex justify-between items-center border-t border-gray-800 pt-2">
            <span className="text-sm text-gray-400">Remaining</span>
            <span className={`font-medium ${
              (budget.remaining || 0) < 0 ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {formatCurrency(budget.remaining || 0)}
            </span>
          </div>
        </div>

        {/* Period Info */}
        <div className="flex justify-between items-center text-sm text-gray-400 border-t border-gray-800 pt-4">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Starts: {formatDate(budget.startDate)}</span>
          </div>
          {budget.daysRemaining !== undefined && (
            <div className="flex items-center">
              <Target className="w-4 h-4 mr-1" />
              <span>{budget.daysRemaining} days left</span>
            </div>
          )}
        </div>

        {/* Alert Settings */}
        {budget.alertEnabled && (
          <div className="text-xs text-gray-500 border-t border-gray-800 pt-2">
            Alert at {budget.alertThresholdPercentage}% • 
            {budget.overspendAlertEnabled ? " Overspend alerts on" : " Overspend alerts off"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}