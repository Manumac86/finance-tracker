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
import { UIGoal } from "@/lib/db/schemas/goal";
import { useTranslations } from "next-intl";

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: Partial<UIGoal>) => void;
}

export function CreateGoalModal({
  isOpen,
  onClose,
  onSave,
}: CreateGoalModalProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    name: "",
    description: "",
    type: "savings",
    targetAmount: "0.00",
    currentAmount: "0.00",
    targetDate: "",
    categoryId: "",
    period: "monthly",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const t = useTranslations("createGoalModal");
  const tCommon = useTranslations("common");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t("nameRequired");
    }

    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      newErrors.targetAmount = t("targetAmountRequired");
    }

    if (formData.type === "spending_limit" && !formData.categoryId) {
      newErrors.categoryId = t("categoryRequired");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data for submission
    const goalData = {
      name: formData.name,
      description: formData.description || "",
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
        { label: t("recommended1000"), value: 1000 },
        { label: t("emergencyFund3"), value: 7500 },
        { label: t("emergencyFund6"), value: 15000 },
      ];
    }
    return [];
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{t("title")}</CardTitle>
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
              <Label htmlFor="goal-name">{t("goalName")}</Label>
              <Input
                id="goal-name"
                type="text"
                placeholder={t("goalNamePlaceholder")}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className=""
              />
              {errors.name && (
                <p className="text-destructive text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Goal Type */}
            <div>
              <Label htmlFor="goal-type">{t("goalType")}</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    type: value as "savings" | "debt_payoff" | "spending_limit",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">{t("savingsGoal")}</SelectItem>
                  <SelectItem value="debt_payoff">{t("debtPayoff")}</SelectItem>
                  <SelectItem value="spending_limit">
                    {t("spendingLimit")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Amount */}
            <div>
              <Label htmlFor="target-amount">{t("targetAmount")}</Label>
              <Input
                id="target-amount"
                type="number"
                placeholder={t("targetAmountPlaceholder")}
                value={formData.targetAmount}
                onChange={(e) =>
                  setFormData({ ...formData, targetAmount: e.target.value })
                }
                className=""
              />
              {errors.targetAmount && (
                <p className="text-destructive text-sm mt-1">
                  {errors.targetAmount}
                </p>
              )}

              {/* Recommendations */}
              {getRecommendations().length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-muted-foreground">{t("suggestions")}</p>
                  <div className="flex flex-wrap gap-2">
                    {getRecommendations().map((rec, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-accent"
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
                <Label htmlFor="current-amount">{t("currentDebtAmount")}</Label>
                <Input
                  id="current-amount"
                  type="number"
                  placeholder={t("currentDebtPlaceholder")}
                  value={formData.currentAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, currentAmount: e.target.value })
                  }
                  className=""
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t("currentDebtHelp")}
                </p>
              </div>
            )}

            {/* Category (for spending limits) */}
            {formData.type === "spending_limit" && (
              <div>
                <Label htmlFor="category">{t("category")}</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cat_dining_123">Dining</SelectItem>
                    <SelectItem value="cat_shopping_123">Shopping</SelectItem>
                    <SelectItem value="cat_entertainment_123">
                      Entertainment
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.categoryId && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.categoryId}
                  </p>
                )}
              </div>
            )}

            {/* Period (for spending limits) */}
            {formData.type === "spending_limit" && (
              <div>
                <Label htmlFor="period">{t("period")}</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      period: value as "weekly" | "monthly" | "yearly",
                    })
                  }
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

            {/* Target Date */}
            <div>
              <Label htmlFor="target-date">{t("targetDate")}</Label>
              <Input
                id="target-date"
                type="date"
                value={formData.targetDate}
                onChange={(e) =>
                  setFormData({ ...formData, targetDate: e.target.value })
                }
                className=""
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                placeholder={t("descriptionPlaceholder")}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className=""
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className=""
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {t("saveGoal")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
