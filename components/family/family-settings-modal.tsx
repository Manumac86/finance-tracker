"use client";

import { useState } from "react";
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
import {
  Settings,
  DollarSign,
  Shield,
  Trash,
  AlertTriangle,
} from "lucide-react";
import { UIFamilyGroup } from "@/lib/db/schemas/family-clerk";
import { useFamilyGroup } from "@/hooks/use-family-group";
import { useTranslations } from "next-intl";

interface FamilySettingsModalProps {
  open: boolean;
  onClose: () => void;
  familyGroup: UIFamilyGroup;
}

export function FamilySettingsModal({
  open,
  onClose,
  familyGroup,
}: FamilySettingsModalProps) {
  const [activeTab, setActiveTab] = useState<
    "general" | "permissions" | "danger"
  >("general");
  const [formData, setFormData] = useState({
    name: familyGroup.name,
    slug: familyGroup.slug || "",
    familySettings: {
      shared_currency: familyGroup.settings.sharedCurrency,
      monthly_family_budget: familyGroup.settings.monthlyFamilyBudget,
      permissions: {
        members_can_view_all_transactions:
          familyGroup.settings.permissions.membersCanViewAllTransactions,
        members_can_edit_shared_budgets:
          familyGroup.settings.permissions.membersCanEditSharedBudgets,
        members_can_create_shared_goals:
          familyGroup.settings.permissions.membersCanCreateSharedGoals,
        require_admin_approval_for_large_expenses:
          familyGroup.settings.permissions.requireAdminApprovalForLargeExpenses,
        large_expense_threshold:
          familyGroup.settings.permissions.largeExpenseThreshold,
        allow_individual_budgets:
          familyGroup.settings.permissions.allowIndividualBudgets,
        spending_notifications_enabled:
          familyGroup.settings.permissions.spendingNotificationsEnabled,
      },
    },
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { updateFamily, deleteFamily, isCreating } = useFamilyGroup();

  const t = useTranslations("family.settings");
  const tPermissions = useTranslations("family.permissions");
  const tCreateModal = useTranslations("family.createModal");
  const tCommon = useTranslations("common");

  const handleSave = async () => {
    try {
      await updateFamily(familyGroup.organizationId, formData);
      onClose();
    } catch (error) {
      console.error("Failed to update family settings:", error);
    }
  };

  const handleDeleteFamily = async () => {
    try {
      await deleteFamily(familyGroup.organizationId);
      onClose();
    } catch (error) {
      console.error("Failed to delete family:", error);
    }
  };

  const hasChanges =
    JSON.stringify(formData) !==
    JSON.stringify({
      name: familyGroup.name,
      slug: familyGroup.slug || "",
      familySettings: {
        shared_currency: familyGroup.settings.sharedCurrency,
        monthly_family_budget: familyGroup.settings.monthlyFamilyBudget,
        permissions: {
          members_can_view_all_transactions:
            familyGroup.settings.permissions.membersCanViewAllTransactions,
          members_can_edit_shared_budgets:
            familyGroup.settings.permissions.membersCanEditSharedBudgets,
          members_can_create_shared_goals:
            familyGroup.settings.permissions.membersCanCreateSharedGoals,
          require_admin_approval_for_large_expenses:
            familyGroup.settings.permissions
              .requireAdminApprovalForLargeExpenses,
          large_expense_threshold:
            familyGroup.settings.permissions.largeExpenseThreshold,
          allow_individual_budgets:
            familyGroup.settings.permissions.allowIndividualBudgets,
          spending_notifications_enabled:
            familyGroup.settings.permissions.spendingNotificationsEnabled,
        },
      },
    });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-500" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-800 mb-6">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "general"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("general")}
            >
              {t("general")}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "permissions"
                  ? "border-emerald-500 text-emerald-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("permissions")}
            >
              {t("permissions")}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "danger"
                  ? "border-red-500 text-red-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("danger")}
            >
              {t("danger")}
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6 overflow-y-auto max-h-[50vh]">
            {activeTab === "general" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {tCreateModal("step1.title")}
                    </CardTitle>
                    <CardDescription>{t("updateFamilyName")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        {tCreateModal("step1.familyName")}
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">
                        {tCreateModal("step1.urlIdentifier")}
                      </Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({ ...formData, slug: e.target.value })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      {tCreateModal("step2.title")}
                    </CardTitle>
                    <CardDescription>
                      {tCreateModal("step2.subtitle")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">
                        {tCreateModal("step2.sharedCurrency")}
                      </Label>
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
                      <Label htmlFor="budget">
                        {tCreateModal("step2.monthlyBudget")}
                      </Label>
                      <Input
                        id="budget"
                        type="number"
                        value={
                          formData.familySettings.monthly_family_budget || ""
                        }
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
              </div>
            )}

            {activeTab === "permissions" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {tCreateModal("step3.title")}
                  </CardTitle>
                  <CardDescription>{t("configurePermissions")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                      <Label>{tPermissions("requireAdminApproval")}</Label>
                      <p className="text-xs text-gray-500">
                        {tPermissions("requireAdminApprovalDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={
                        formData.familySettings.permissions
                          .require_admin_approval_for_large_expenses
                      }
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          familySettings: {
                            ...formData.familySettings,
                            permissions: {
                              ...formData.familySettings.permissions,
                              require_admin_approval_for_large_expenses:
                                checked,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  {formData.familySettings.permissions
                    .require_admin_approval_for_large_expenses && (
                    <div className="space-y-2 ml-6">
                      <Label htmlFor="threshold">
                        {tPermissions("largeExpenseThreshold")}
                      </Label>
                      <Input
                        id="threshold"
                        type="number"
                        value={
                          formData.familySettings.permissions
                            .large_expense_threshold
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            familySettings: {
                              ...formData.familySettings,
                              permissions: {
                                ...formData.familySettings.permissions,
                                large_expense_threshold:
                                  parseFloat(e.target.value) || 0,
                              },
                            },
                          })
                        }
                      />
                    </div>
                  )}

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
                </CardContent>
              </Card>
            )}

            {activeTab === "danger" && (
              <Card className="border-red-800">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    {t("dangerZone")}
                  </CardTitle>
                  <CardDescription>{t("dangerZoneDesc")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border border-red-800 rounded-lg bg-red-900/10">
                    <h4 className="font-medium text-red-400 mb-2">
                      {t("deleteFamilyGroup")}
                    </h4>
                    <p className="text-sm text-gray-400 mb-4">
                      {t("deleteFamilyGroupDesc")}
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="gap-2"
                    >
                      <Trash className="h-4 w-4" />
                      {t("deleteFamilyGroup")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-6 border-t border-gray-800">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            {tCommon("cancel")}
          </Button>
          {activeTab !== "danger" && (
            <Button onClick={handleSave} disabled={!hasChanges || isCreating}>
              {isCreating ? tCommon("saving") + "..." : t("updateSettings")}
            </Button>
          )}
        </div>

        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md border-red-800">
              <CardHeader>
                <CardTitle className="text-red-400">
                  {tCommon("confirm")}
                </CardTitle>
                <CardDescription>{t("deleteConfirmation")}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteFamily}
                  className="flex-1"
                >
                  {tCommon("delete")}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
