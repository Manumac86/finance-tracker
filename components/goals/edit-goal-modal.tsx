"use client";

import { useState, useEffect } from "react";
import { GoalFormData, FormErrors, FormUpdateHandler } from "@/types/forms";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UIGoal } from "@/lib/db/schemas/goal";

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalId: string, goalData: GoalFormData) => void;
  goal: UIGoal | null;
}

export function EditGoalModal({
  isOpen,
  onClose,
  onSave,
  goal,
}: EditGoalModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "savings",
    targetAmount: "",
    currentAmount: "",
    targetDate: "",
    categoryId: "",
    period: "monthly",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Load goal data when modal opens
  useEffect(() => {
    if (isOpen && goal) {
      setFormData({
        name: goal.name || "",
        description: goal.description || "",
        type: goal.type || "savings",
        targetAmount: goal.targetAmount?.toString() || "",
        currentAmount: goal.currentAmount?.toString() || "",
        targetDate: goal.targetDate || "",
        categoryId: goal.categoryId || "",
        period: goal.period || "monthly",
      });
    }
  }, [isOpen, goal]);

  if (!isOpen || !goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Goal name is required";
    }

    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      newErrors.targetAmount = "Target amount must be greater than 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data for submission (transform camelCase to snake_case)
    const goalData = {
      name: formData.name,
      description: formData.description || undefined,
      type: formData.type,
      target_amount: parseFloat(formData.targetAmount),
      current_amount: formData.currentAmount
        ? parseFloat(formData.currentAmount)
        : undefined,
      target_date: formData.targetDate || undefined,
      category_id: formData.categoryId || undefined,
      period: formData.type === "spending_limit" ? formData.period : undefined,
    };

    onSave(goal.id!, goalData);
    handleClose();
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const updateFormData: FormUpdateHandler = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-gray-900 border-gray-800">
        <CardHeader className="border-b border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Edit Goal</CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Update your financial goal
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Goal Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., Emergency Fund, Vacation Savings"
                className={`bg-gray-800 border-gray-700 ${
                  errors.name ? "border-red-500" : ""
                }`}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Optional description for this goal"
                className="bg-gray-800 border-gray-700"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Goal Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => updateFormData("type", value)}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings Goal</SelectItem>
                  <SelectItem value="debt_payoff">Debt Payoff</SelectItem>
                  <SelectItem value="spending_limit">Spending Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Amount *</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) =>
                    updateFormData("targetAmount", e.target.value)
                  }
                  placeholder="0.00"
                  className={`bg-gray-800 border-gray-700 ${
                    errors.targetAmount ? "border-red-500" : ""
                  }`}
                />
                {errors.targetAmount && (
                  <p className="text-sm text-red-500">{errors.targetAmount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentAmount">Current Amount</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  value={formData.currentAmount}
                  onChange={(e) =>
                    updateFormData("currentAmount", e.target.value)
                  }
                  placeholder="0.00"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => updateFormData("targetDate", e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>

            {formData.type === "spending_limit" && (
              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value) => updateFormData("period", value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>

          <div className="border-t border-gray-800 p-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Update Goal
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
