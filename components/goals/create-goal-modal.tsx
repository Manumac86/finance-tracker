"use client";

import { useState } from "react";
import { GoalFormData, FormErrors } from "@/types/forms";
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
import { Badge } from "@/components/ui/badge";

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: GoalFormData) => void;
}

export function CreateGoalModal({
  isOpen,
  onClose,
  onSave,
}: CreateGoalModalProps) {
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Goal name is required";
    }

    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      newErrors.targetAmount = "Target amount is required and must be positive";
    }

    if (formData.type === "spending_limit" && !formData.categoryId) {
      newErrors.categoryId = "Category is required for spending limits";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data for submission
    const goalData = {
      name: formData.name,
      description: formData.description || undefined,
      type: formData.type,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: formData.currentAmount
        ? parseFloat(formData.currentAmount)
        : 0,
      targetDate: formData.targetDate || undefined,
      categoryId: formData.categoryId || undefined,
      period: formData.type === "spending_limit" ? formData.period : undefined,
    };

    onSave(goalData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "savings",
      targetAmount: "",
      currentAmount: "",
      targetDate: "",
      categoryId: "",
      period: "monthly",
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getRecommendations = () => {
    if (formData.type === "savings") {
      return [
        { label: "Recommended: $1,000", value: 1000 },
        { label: "3-month emergency fund: $7,500", value: 7500 },
        { label: "6-month emergency fund: $15,000", value: 15000 },
      ];
    }
    return [];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-800 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Create New Goal</CardTitle>
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

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Goal Name */}
            <div>
              <Label htmlFor="goal-name">Goal Name</Label>
              <Input
                id="goal-name"
                type="text"
                placeholder="e.g., Emergency Fund"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="bg-gray-800 border-gray-700"
              />
              {errors.name && (
                <p className="text-rose-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Goal Type */}
            <div>
              <Label htmlFor="goal-type">Goal Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="savings">Savings Goal</SelectItem>
                  <SelectItem value="debt_payoff">Debt Payoff</SelectItem>
                  <SelectItem value="spending_limit">Spending Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Amount */}
            <div>
              <Label htmlFor="target-amount">Target Amount</Label>
              <Input
                id="target-amount"
                type="number"
                placeholder="e.g., 5000"
                value={formData.targetAmount}
                onChange={(e) =>
                  setFormData({ ...formData, targetAmount: e.target.value })
                }
                className="bg-gray-800 border-gray-700"
              />
              {errors.targetAmount && (
                <p className="text-rose-500 text-sm mt-1">
                  {errors.targetAmount}
                </p>
              )}

              {/* Recommendations */}
              {getRecommendations().length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-400">Suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {getRecommendations().map((rec, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-gray-700"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            targetAmount: rec.value.toString(),
                          })
                        }
                      >
                        {rec.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Current Amount (for debt payoff) */}
            {formData.type === "debt_payoff" && (
              <div>
                <Label htmlFor="current-amount">Current Debt Amount</Label>
                <Input
                  id="current-amount"
                  type="number"
                  placeholder="e.g., 3000"
                  value={formData.currentAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, currentAmount: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700"
                />
                <p className="text-sm text-gray-400 mt-1">
                  Enter the current amount you owe
                </p>
              </div>
            )}

            {/* Category (for spending limits) */}
            {formData.type === "spending_limit" && (
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="cat_dining_123">Dining</SelectItem>
                    <SelectItem value="cat_shopping_123">Shopping</SelectItem>
                    <SelectItem value="cat_entertainment_123">
                      Entertainment
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-rose-500 text-sm mt-1">
                    {errors.categoryId}
                  </p>
                )}
              </div>
            )}

            {/* Period (for spending limits) */}
            {formData.type === "spending_limit" && (
              <div>
                <Label htmlFor="period">Period</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value) =>
                    setFormData({ ...formData, period: value })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Target Date */}
            <div>
              <Label htmlFor="target-date">Target Date (Optional)</Label>
              <Input
                id="target-date"
                type="date"
                value={formData.targetDate}
                onChange={(e) =>
                  setFormData({ ...formData, targetDate: e.target.value })
                }
                className="bg-gray-800 border-gray-700"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any notes about this goal..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-gray-800 border-gray-700"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Save Goal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
