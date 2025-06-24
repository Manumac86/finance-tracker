"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Settings, DollarSign } from "lucide-react";
import { UIFamilyGroup } from "@/lib/db/schemas/family-clerk";
import { useFamilyGroup } from "@/hooks/use-family-group";

interface CreateFamilyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (family: UIFamilyGroup) => void;
}

export function CreateFamilyModal({ open, onClose, onSuccess }: CreateFamilyModalProps) {
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

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setFormData({
        name: '',
        slug: '',
        familySettings: {
          shared_currency: 'USD',
          monthly_family_budget: undefined,
          permissions: {
            members_can_view_all_transactions: true,
            members_can_edit_shared_budgets: false,
            members_can_create_shared_goals: true,
            require_admin_approval_for_large_expenses: false,
            large_expense_threshold: 100,
            allow_individual_budgets: true,
            spending_notifications_enabled: true,
          }
        }
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
      console.error('Failed to create family:', error);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      name: '',
      slug: '',
      familySettings: {
        shared_currency: 'USD',
        monthly_family_budget: undefined,
        permissions: {
          members_can_view_all_transactions: true,
          members_can_edit_shared_budgets: false,
          members_can_create_shared_goals: true,
          require_admin_approval_for_large_expenses: false,
          large_expense_threshold: 100,
          allow_individual_budgets: true,
          spending_notifications_enabled: true,
        }
      }
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            Create Family Group
          </DialogTitle>
          <DialogDescription>
            Set up a family group to share budgets, goals, and track expenses together.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicators */}
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`h-2 w-8 rounded-full ${
                  stepNumber <= step
                    ? "bg-emerald-500"
                    : "bg-gray-700"
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>
                  Choose a name and identifier for your family group
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Family Group Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., The Smith Family"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Identifier (optional)</Label>
                  <Input
                    id="slug"
                    placeholder="e.g., smith-family"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">
                    This will be used in sharing links. Leave empty for auto-generation.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Settings
                </CardTitle>
                <CardDescription>
                  Configure currency and budget settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Shared Currency</Label>
                  <select
                    id="currency"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                    value={formData.familySettings.shared_currency}
                    onChange={(e) => setFormData({
                      ...formData,
                      familySettings: {
                        ...formData.familySettings,
                        shared_currency: e.target.value,
                      },
                    })}
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
                  <Label htmlFor="budget">Monthly Family Budget (optional)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g., 5000"
                    value={formData.familySettings.monthly_family_budget || ""}
                    onChange={(e) => setFormData({
                      ...formData,
                      familySettings: {
                        ...formData.familySettings,
                        monthly_family_budget: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    })}
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
                  Permissions & Preferences
                </CardTitle>
                <CardDescription>
                  Configure what family members can do
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Members can view all transactions</Label>
                      <p className="text-xs text-gray-500">
                        Allow all family members to see each other&apos;s transactions
                      </p>
                    </div>
                    <Switch
                      checked={formData.familySettings.permissions.members_can_view_all_transactions}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        familySettings: {
                          ...formData.familySettings,
                          permissions: {
                            ...formData.familySettings.permissions,
                            members_can_view_all_transactions: checked,
                          },
                        },
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Members can edit shared budgets</Label>
                      <p className="text-xs text-gray-500">
                        Allow members to modify family budgets (admins can always edit)
                      </p>
                    </div>
                    <Switch
                      checked={formData.familySettings.permissions.members_can_edit_shared_budgets}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        familySettings: {
                          ...formData.familySettings,
                          permissions: {
                            ...formData.familySettings.permissions,
                            members_can_edit_shared_budgets: checked,
                          },
                        },
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Members can create shared goals</Label>
                      <p className="text-xs text-gray-500">
                        Allow members to create goals that affect the whole family
                      </p>
                    </div>
                    <Switch
                      checked={formData.familySettings.permissions.members_can_create_shared_goals}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        familySettings: {
                          ...formData.familySettings,
                          permissions: {
                            ...formData.familySettings.permissions,
                            members_can_create_shared_goals: checked,
                          },
                        },
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow individual budgets</Label>
                      <p className="text-xs text-gray-500">
                        Members can create personal budgets in addition to shared ones
                      </p>
                    </div>
                    <Switch
                      checked={formData.familySettings.permissions.allow_individual_budgets}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        familySettings: {
                          ...formData.familySettings,
                          permissions: {
                            ...formData.familySettings.permissions,
                            allow_individual_budgets: checked,
                          },
                        },
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable spending notifications</Label>
                      <p className="text-xs text-gray-500">
                        Send notifications for budget limits and large expenses
                      </p>
                    </div>
                    <Switch
                      checked={formData.familySettings.permissions.spending_notifications_enabled}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        familySettings: {
                          ...formData.familySettings,
                          permissions: {
                            ...formData.familySettings.permissions,
                            spending_notifications_enabled: checked,
                          },
                        },
                      })}
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
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            <Button 
              onClick={step === 3 ? handleSubmit : handleNext}
              disabled={isCreating || (step === 1 && !formData.name.trim())}
            >
              {isCreating ? "Creating..." : step === 3 ? "Create Family Group" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}