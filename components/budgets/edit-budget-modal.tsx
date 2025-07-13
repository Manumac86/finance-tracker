"use client";

import { useState, useEffect } from "react";
import { BudgetFormData, FormErrors, FormUpdateHandler } from "@/types/forms";
import { X, DollarSign, Settings } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { UIBudget } from "@/lib/db/schemas/budget";
import { useTranslatedCategories } from "@/hooks/use-translated-categories";
import { getCategoryIcon } from "@/lib/utils/icons";
import { useTranslations } from "next-intl";

interface EditBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budgetId: string, budgetData: BudgetFormData) => void;
  budget: UIBudget | null;
}

export function EditBudgetModal({
  isOpen,
  onClose,
  onSave,
  budget,
}: EditBudgetModalProps) {
  const [formData, setFormData] = useState<BudgetFormData>({
    name: "",
    description: "",
    budgetType: "category",
    categoryIds: [],
    amount: "",
    period: "monthly",
    startDate: "",
    endDate: "",
    alertThresholdPercentage: 80,
    alertEnabled: true,
    overspendAlertEnabled: true,
    rolloverEnabled: false,
    rolloverType: "none",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [activeTab, setActiveTab] = useState("basic");
  const { data: translatedCategories } = useTranslatedCategories();
  
  const t = useTranslations("editBudgetModal");
  const tCommon = useTranslations("common");

  // Load budget data when modal opens
  useEffect(() => {
    if (isOpen && budget) {
      // Ensure we have valid values with proper fallbacks
      const budgetType =
        budget.budgetType &&
        ["category", "total", "custom"].includes(budget.budgetType)
          ? budget.budgetType
          : "category";

      const categoryIds =
        budget.categoryIds && Array.isArray(budget.categoryIds)
          ? budget.categoryIds
          : [];

      setFormData({
        name: budget.name || "",
        description: budget.description || "",
        budgetType: budgetType,
        categoryIds: categoryIds,
        amount: budget.amount?.toString() || "",
        period: budget.period || "monthly",
        startDate: budget.startDate || "",
        endDate: budget.endDate || "",
        alertThresholdPercentage: budget.alertThresholdPercentage || 80,
        alertEnabled: budget.alertEnabled ?? true,
        overspendAlertEnabled: budget.overspendAlertEnabled ?? true,
        rolloverEnabled: budget.rolloverEnabled ?? false,
        rolloverType: budget.rolloverType || "none",
      });
    }
  }, [isOpen, budget]);

  if (!isOpen || !budget) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t("nameRequired");
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = t("amountRequired");
    }

    if (!formData.startDate) {
      newErrors.startDate = t("startDateRequired");
    }

    if (formData.budgetType === "category" && formData.categoryIds.length === 0) {
      newErrors.categoryIds = t("categoryRequired");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data for submission (transform camelCase to snake_case)
    const budgetData: BudgetFormData = {
      name: formData.name,
      description: formData.description || "",
      budgetType: formData.budgetType as "category" | "total" | "custom",
      categoryIds: formData.budgetType === "category" ? formData.categoryIds : [],
      amount: formData.amount,
      period: formData.period,
      startDate: formData.startDate,
      endDate: formData.endDate || "",
      alertThresholdPercentage: formData.alertThresholdPercentage,
      alertEnabled: formData.alertEnabled,
      overspendAlertEnabled: formData.overspendAlertEnabled,
      rolloverEnabled: formData.rolloverEnabled,
      rolloverType: formData.rolloverType as
        | "none"
        | "surplus"
        | "deficit"
        | "both",
    };

    onSave(budget.id!, budgetData);
    handleClose();
  };

  const handleClose = () => {
    setErrors({});
    setActiveTab("basic");
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

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => {
      const newCategoryIds = prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId];
      return { ...prev, categoryIds: newCategoryIds };
    });
    
    // Clear error when categories are selected
    if (errors.categoryIds) {
      setErrors(prev => ({ ...prev, categoryIds: "" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-card border max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b border-border">
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
          <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">{t("basicInfo")}</TabsTrigger>
                <TabsTrigger value="period">{t("periodAmount")}</TabsTrigger>
                <TabsTrigger value="alerts">{t("alertsSettings")}</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("budgetName")} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    placeholder={t("budgetNamePlaceholder")}
                    className={`bg-input border-input ${
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
                    onChange={(e) =>
                      updateFormData("description", e.target.value)
                    }
                    placeholder={t("descriptionPlaceholder")}
                    className="bg-input border-input"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budgetType">{t("budgetType")}</Label>
                  <Select
                    key={`budgetType-${budget?.id}-${formData.budgetType}`}
                    value={formData.budgetType}
                    onValueChange={(value) =>
                      updateFormData("budgetType", value)
                    }
                  >
                    <SelectTrigger className="bg-input border-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="category">{t("categoryBudget")}</SelectItem>
                      <SelectItem value="total">{t("totalBudget")}</SelectItem>
                      <SelectItem value="custom">{t("customBudget")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Multi-Category Selection - Only show for category budget type */}
                {formData.budgetType === "category" && (
                  <div className="space-y-2">
                    <Label htmlFor="categories">{t("selectCategories")} *</Label>
                    <div className={`border rounded-md p-3 bg-input ${
                      errors.categoryIds ? "border-destructive" : "border-input"
                    }`}>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {translatedCategories?.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category.id}`}
                              checked={formData.categoryIds.includes(category.id || "")}
                              onCheckedChange={() => handleCategoryToggle(category.id || "")}
                            />
                            <label
                              htmlFor={`category-${category.id}`}
                              className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                              {getCategoryIcon(category.icon)}
                              <span>{category.translatedName}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                      {formData.categoryIds.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            {t("selectedCategories", { count: formData.categoryIds.length })}
                          </p>
                        </div>
                      )}
                    </div>
                    {errors.categoryIds && (
                      <p className="text-sm text-destructive">
                        {errors.categoryIds}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t("multiCategorySelectionHelp")}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="period" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">{t("budgetAmount")} *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) =>
                          updateFormData("amount", e.target.value)
                        }
                        placeholder="0.00"
                        className={`pl-10 bg-input border-input ${
                          errors.amount ? "border-destructive" : ""
                        }`}
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-sm text-destructive">
                        {errors.amount}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="period">{t("period")}</Label>
                    <Select
                      value={formData.period}
                      onValueChange={(value) => updateFormData("period", value)}
                    >
                      <SelectTrigger className="bg-input border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">{t("weekly")}</SelectItem>
                        <SelectItem value="monthly">{t("monthly")}</SelectItem>
                        <SelectItem value="quarterly">{t("quarterly")}</SelectItem>
                        <SelectItem value="yearly">{t("yearly")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">{t("startDate")} *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        updateFormData("startDate", e.target.value)
                      }
                      className={`bg-input border-input ${
                        errors.startDate ? "border-destructive" : ""
                      }`}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-destructive">
                        {errors.startDate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">{t("endDate")}</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        updateFormData("endDate", e.target.value)
                      }
                      className="bg-input border-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("endDateHelp")}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    {t("alertSettings")}
                  </h4>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="alertEnabled"
                        checked={formData.alertEnabled}
                        onCheckedChange={(checked) =>
                          updateFormData("alertEnabled", checked)
                        }
                      />
                      <Label htmlFor="alertEnabled">{t("enableBudgetAlerts")}</Label>
                    </div>

                    {formData.alertEnabled && (
                      <div className="space-y-2 ml-6">
                        <Label htmlFor="alertThreshold">
                          {t("alertThreshold")}
                        </Label>
                        <Input
                          id="alertThreshold"
                          type="number"
                          min="1"
                          max="100"
                          value={formData.alertThresholdPercentage}
                          onChange={(e) =>
                            updateFormData(
                              "alertThresholdPercentage",
                              parseInt(e.target.value)
                            )
                          }
                          className="bg-input border-input w-24"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("alertThresholdHelp")}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="overspendAlert"
                        checked={formData.overspendAlertEnabled}
                        onCheckedChange={(checked) =>
                          updateFormData("overspendAlertEnabled", checked)
                        }
                      />
                      <Label htmlFor="overspendAlert">
                        {t("alertWhenOver")}
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">{t("rolloverSettings")}</h4>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rolloverEnabled"
                      checked={formData.rolloverEnabled}
                      onCheckedChange={(checked) =>
                        updateFormData("rolloverEnabled", checked)
                      }
                    />
                    <Label htmlFor="rolloverEnabled">
                      {t("enableRollover")}
                    </Label>
                  </div>

                  {formData.rolloverEnabled && (
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="rolloverType">{t("rolloverType")}</Label>
                      <Select
                        value={formData.rolloverType}
                        onValueChange={(value) =>
                          updateFormData("rolloverType", value)
                        }
                      >
                        <SelectTrigger className="bg-input border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="surplus">{t("surplusOnly")}</SelectItem>
                          <SelectItem value="deficit">{t("deficitOnly")}</SelectItem>
                          <SelectItem value="both">
                            {t("bothSurplusDeficit")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          <div className="border-t border-border p-6 flex justify-between">
            <Button type="button" variant="outline" onClick={handleClose}>
              {tCommon("cancel")}
            </Button>
            <div className="flex gap-2">
              {activeTab !== "basic" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tabs = ["basic", "period", "alerts"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex > 0) {
                      setActiveTab(tabs[currentIndex - 1]);
                    }
                  }}
                >
                  {t("previous")}
                </Button>
              )}
              {activeTab !== "alerts" ? (
                <Button
                  type="button"
                  onClick={() => {
                    const tabs = ["basic", "period", "alerts"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1]);
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {t("next")}
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {t("updateBudget")}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
