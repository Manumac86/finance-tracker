"use client";

import { useState, useEffect } from "react";
import { GoalFormData, FormErrors, FormUpdateHandler } from "@/types/forms";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
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
  onSave: (goalId: string, goalData: Partial<UIGoal>) => void;
  goal: UIGoal | null;
}

export function EditGoalModal({
  isOpen,
  onClose,
  onSave,
  goal,
}: EditGoalModalProps) {
  const t = useTranslations("editGoalModal");
  const tCommon = useTranslations("common");
  
  const [formData, setFormData] = useState<GoalFormData>({
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

  const updateFormData: FormUpdateHandler = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">{t("title")}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t("subtitle")}
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
              <Label htmlFor="name">{t("goalName")} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder={t("goalNamePlaceholder")}
                className={`${
                  errors.name ? "border-destructive" : ""
                }`}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder={t("descriptionPlaceholder")}
                className=""
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">{t("goalType")}</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => updateFormData("type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">{t("savingsGoal")}</SelectItem>
                  <SelectItem value="debt_payoff">{t("debtPayoff")}</SelectItem>
                  <SelectItem value="spending_limit">{t("spendingLimit")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetAmount">{t("targetAmount")} *</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) =>
                    updateFormData("targetAmount", e.target.value)
                  }
                  placeholder={t("amountPlaceholder")}
                  className={`${
                    errors.targetAmount ? "border-destructive" : ""
                  }`}
                />
                {errors.targetAmount && (
                  <p className="text-sm text-destructive">{errors.targetAmount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentAmount">{t("currentAmount")}</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  value={formData.currentAmount}
                  onChange={(e) =>
                    updateFormData("currentAmount", e.target.value)
                  }
                  placeholder={t("amountPlaceholder")}
                  className=""
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">{t("targetDate")}</Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => updateFormData("targetDate", e.target.value)}
                className=""
              />
            </div>

            {formData.type === "spending_limit" && (
              <div className="space-y-2">
                <Label htmlFor="period">{t("period")}</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value) => updateFormData("period", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">{t("weekly")}</SelectItem>
                    <SelectItem value="monthly">{t("monthly")}</SelectItem>
                    <SelectItem value="yearly">{t("yearly")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>

          <div className="border-t p-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {t("updateGoal")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
