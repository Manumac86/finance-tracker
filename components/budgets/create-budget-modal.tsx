"use client";

import { useState } from "react";
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
import { useTranslations } from "next-intl";

interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budgetData: BudgetFormData) => void;
}

export function CreateBudgetModal({
  isOpen,
  onClose,
  onSave,
}: CreateBudgetModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budgetType: "category",
    categoryId: "",
    amount: "",
    period: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    alertThresholdPercentage: 80,
    alertEnabled: true,
    overspendAlertEnabled: true,
    rolloverEnabled: false,
    rolloverType: "none",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [activeTab, setActiveTab] = useState("basic");

  const t = useTranslations("createBudgetModal");
  const tCommon = useTranslations("common");

  if (!isOpen) return null;

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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data for submission
    const budgetData = {
      name: formData.name,
      description: formData.description || "",
      budgetType: formData.budgetType as "category" | "total" | "custom",
      categoryId: formData.categoryId || "",
      amount: formData.amount,
      period: formData.period as "weekly" | "monthly" | "yearly",
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

    onSave(budgetData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      budgetType: "category",
      categoryId: "",
      amount: "",
      period: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      alertThresholdPercentage: 80,
      alertEnabled: true,
      overspendAlertEnabled: true,
      rolloverEnabled: false,
      rolloverType: "none",
    });
    setErrors({});
    setActiveTab("basic");
  };

  const handleClose = () => {
    resetForm();
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-800 max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">{t("title")}</CardTitle>
              <p className="text-sm text-gray-400 mt-1">{t("subtitle")}</p>
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
                    className={`bg-gray-800 border-gray-700 ${
                      errors.name ? "border-red-500" : ""
                    }`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
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
                    className="bg-gray-800 border-gray-700"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budgetType">{t("budgetType")}</Label>
                  <Select
                    value={formData.budgetType}
                    onValueChange={(value) =>
                      updateFormData("budgetType", value)
                    }
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="category">
                        {t("categoryBudget")}
                      </SelectItem>
                      <SelectItem value="total">{t("totalBudget")}</SelectItem>
                      <SelectItem value="custom">
                        {t("customBudget")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {formData.budgetType === "category" &&
                      t("categoryBudgetDesc")}
                    {formData.budgetType === "total" && t("totalBudgetDesc")}
                    {formData.budgetType === "custom" && t("customBudgetDesc")}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="period" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">{t("budgetAmount")} *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) =>
                          updateFormData("amount", e.target.value)
                        }
                        placeholder="0.00"
                        className={`pl-10 bg-gray-800 border-gray-700 ${
                          errors.amount ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-sm text-red-500">{errors.amount}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="period">{t("period")}</Label>
                    <Select
                      value={formData.period}
                      onValueChange={(value) => updateFormData("period", value)}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">{t("weekly")}</SelectItem>
                        <SelectItem value="monthly">{t("monthly")}</SelectItem>
                        <SelectItem value="quarterly">
                          {t("quarterly")}
                        </SelectItem>
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
                      className={`bg-gray-800 border-gray-700 ${
                        errors.startDate ? "border-red-500" : ""
                      }`}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-red-500">{errors.startDate}</p>
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
                      className="bg-gray-800 border-gray-700"
                    />
                    <p className="text-xs text-gray-500">{t("endDateHelp")}</p>
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
                      <Label htmlFor="alertEnabled">
                        {t("enableBudgetAlerts")}
                      </Label>
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
                          className="bg-gray-800 border-gray-700 w-24"
                        />
                        <p className="text-xs text-gray-500">
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
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="surplus">
                            {t("surplusOnly")}
                          </SelectItem>
                          <SelectItem value="deficit">
                            {t("deficitOnly")}
                          </SelectItem>
                          <SelectItem value="both">
                            {t("bothSurplusDeficit")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        {t("rolloverHelp")}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          <div className="border-t border-gray-800 p-6 flex justify-between">
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
                  {t("createBudget")}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
}
