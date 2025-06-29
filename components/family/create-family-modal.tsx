"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Settings, DollarSign } from "lucide-react";
import { UIFamilyGroup } from "@/lib/db/schemas/family-clerk";
import { useFamilyGroup } from "@/hooks/use-family-group";
import { useTranslations } from "next-intl";

interface CreateFamilyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (family: UIFamilyGroup) => void;
}

export function CreateFamilyModal({
  open,
  onClose,
  onSuccess,
}: CreateFamilyModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    familySettings: {
      shared_currency: "USD",
      monthly_family_budget: undefined as number | undefined,
      permissions: {
        members_can_view_all_transactions: true,
        members_can_edit_shared_budgets: false,
        members_can_create_shared_goals: true,
        require_admin_approval_for_large_expenses: false,
        large_expense_threshold: 100,
        allow_individual_budgets: true,
        spending_notifications_enabled: true,
      },
    },
  });

  const { createFamily, isCreating } = useFamilyGroup();
  const t = useTranslations("family.createModal");
  const tPermissions = useTranslations("family.permissions");
  const tCommon = useTranslations("common");

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setFormData({
        name: "",
        slug: "",
        familySettings: {
          shared_currency: "USD",
          monthly_family_budget: undefined,
          permissions: {
            members_can_view_all_transactions: true,
            members_can_edit_shared_budgets: false,
            members_can_create_shared_goals: true,
            require_admin_approval_for_large_expenses: false,
            large_expense_threshold: 100,
            allow_individual_budgets: true,
            spending_notifications_enabled: true,
          },
        },
      });
    }
  }, [open]);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const family = await createFamily(formData);
      onSuccess(family);
      // Reset form
      setStep(1);
      setFormData({
        name: "",
        slug: "",
        familySettings: {
          shared_currency: "USD",
          monthly_family_budget: undefined,
          permissions: {
            members_can_view_all_transactions: true,
            members_can_edit_shared_budgets: false,
            members_can_create_shared_goals: true,
            require_admin_approval_for_large_expenses: false,
            large_expense_threshold: 100,
            allow_individual_budgets: true,
            spending_notifications_enabled: true,
          },
        },
      });
    } catch (error) {
      console.error("Failed to create family:", error);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      name: "",
      slug: "",
      familySettings: {
        shared_currency: "USD",
        monthly_family_budget: undefined,
        permissions: {
          members_can_view_all_transactions: true,
          members_can_edit_shared_budgets: false,
          members_can_create_shared_goals: true,
          require_admin_approval_for_large_expenses: false,
          large_expense_threshold: 100,
          allow_individual_budgets: true,
          spending_notifications_enabled: true,
        },
      },
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicators */}
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`h-2 w-8 rounded-full ${
                  stepNumber <= step ? "bg-emerald-500" : "bg-gray-700"
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("step1.title")}</CardTitle>
                <CardDescription>{t("step1.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("step1.familyName")}</Label>
                  <Input
                    id="name"
                    placeholder={t("step1.familyNamePlaceholder")}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">{t("step1.urlIdentifier")}</Label>
                  <Input
                    id="slug"
                    placeholder={t("step1.urlIdentifierPlaceholder")}
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">{t("step1.urlHelp")}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t("step2.title")}
                </CardTitle>
                <CardDescription>{t("step2.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">{t("step2.sharedCurrency")}</Label>
                  <select
                    id="currency"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                    value={formData.familySettings.shared_currency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        familySettings: {
                          ...formData.familySettings,
                          shared_currency: e.target.value,
                        },
                      })
                    }
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">{t("step2.monthlyBudget")}</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder={t("step2.monthlyBudgetPlaceholder")}
                    value={formData.familySettings.monthly_family_budget || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        familySettings: {
                          ...formData.familySettings,
                          monthly_family_budget: e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t("step3.title")}
                </CardTitle>
                <CardDescription>{t("step3.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>
                        {tPermissions("membersCanViewAllTransactions")}
                      </Label>
                      <p className="text-xs text-gray-500">
                        {tPermissions("membersCanViewAllTransactionsDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={
                        formData.familySettings.permissions
                          .members_can_view_all_transactions
                      }
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          familySettings: {
                            ...formData.familySettings,
                            permissions: {
                              ...formData.familySettings.permissions,
                              members_can_view_all_transactions: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>
                        {tPermissions("membersCanEditSharedBudgets")}
                      </Label>
                      <p className="text-xs text-gray-500">
                        {tPermissions("membersCanEditSharedBudgetsDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={
                        formData.familySettings.permissions
                          .members_can_edit_shared_budgets
                      }
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          familySettings: {
                            ...formData.familySettings,
                            permissions: {
                              ...formData.familySettings.permissions,
                              members_can_edit_shared_budgets: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>
                        {tPermissions("membersCanCreateSharedGoals")}
                      </Label>
                      <p className="text-xs text-gray-500">
                        {tPermissions("membersCanCreateSharedGoalsDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={
                        formData.familySettings.permissions
                          .members_can_create_shared_goals
                      }
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          familySettings: {
                            ...formData.familySettings,
                            permissions: {
                              ...formData.familySettings.permissions,
                              members_can_create_shared_goals: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{tPermissions("allowIndividualBudgets")}</Label>
                      <p className="text-xs text-gray-500">
                        {tPermissions("allowIndividualBudgetsDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={
                        formData.familySettings.permissions
                          .allow_individual_budgets
                      }
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          familySettings: {
                            ...formData.familySettings,
                            permissions: {
                              ...formData.familySettings.permissions,
                              allow_individual_budgets: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>
                        {tPermissions("enableSpendingNotifications")}
                      </Label>
                      <p className="text-xs text-gray-500">
                        {tPermissions("enableSpendingNotificationsDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={
                        formData.familySettings.permissions
                          .spending_notifications_enabled
                      }
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          familySettings: {
                            ...formData.familySettings,
                            permissions: {
                              ...formData.familySettings.permissions,
                              spending_notifications_enabled: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={step === 1 ? handleClose : handleBack}
              disabled={isCreating}
            >
              {step === 1 ? tCommon("cancel") : tCommon("back")}
            </Button>
            <Button
              onClick={step === 3 ? handleSubmit : handleNext}
              disabled={isCreating || (step === 1 && !formData.name.trim())}
            >
              {isCreating
                ? t("creating")
                : step === 3
                ? t("createFamilyGroup")
                : tCommon("next")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
