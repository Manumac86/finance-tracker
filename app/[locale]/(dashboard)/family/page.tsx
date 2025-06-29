"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Settings, Crown, User, Eye } from "lucide-react";
import { CreateFamilyModal } from "@/components/family/create-family-modal";
import { FamilyMembersPanel } from "@/components/family/family-members-panel";
import { FamilySettingsModal } from "@/components/family/family-settings-modal";
import { useFamilyGroup } from "@/hooks/use-family-group";
import { useTranslations } from "next-intl";

export default function FamilyPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const { familyGroup, isLoading, error } = useFamilyGroup();
  const t = useTranslations("family");
  const tCommon = useTranslations("common");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-500">
              {t("errors.failedToLoadData")}
            </p>
            <p className="text-center text-sm text-gray-500 mt-2">
              {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "org:admin":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "org:member":
        return <User className="h-4 w-4 text-blue-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "org:admin":
        return (
          <Badge variant="default" className="bg-yellow-500/10 text-yellow-400">
            {t("members.roles.admin")}
          </Badge>
        );
      case "org:member":
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-400">
            {t("members.roles.member")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{t("members.roles.viewer")}</Badge>;
    }
  };

  if (!familyGroup) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            {t("createFamily")}
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {t("noFamilyGroup")}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t("noFamilyGroupDescription")}
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {t("createFamily")}
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                {t("askAdminToInvite")}
              </p>
            </div>
          </CardContent>
        </Card>

        <CreateFamilyModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            // The family will be automatically set via the hook
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="h-8 w-8 text-emerald-500" />
              {familyGroup.name}
            </h1>
            <p className="text-gray-400 mt-2">
              {t("financialManagement")} • {familyGroup.memberCount}{" "}
              {familyGroup.memberCount === 1 ? t("member") : t("members")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getRoleIcon(familyGroup.currentUserRole)}
            {getRoleBadge(familyGroup.currentUserRole)}
            {familyGroup.currentUserRole === "org:admin" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettingsModal(true)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                {tCommon("settings")}
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    {t("stats.monthlySpending")}
                  </p>
                  <p className="text-xl font-bold text-white">
                    ${familyGroup.totalMonthlySpending.toFixed(2)}
                  </p>
                </div>
                <div className="h-8 w-8 bg-red-500/10 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    {t("stats.monthlyIncome")}
                  </p>
                  <p className="text-xl font-bold text-white">
                    ${familyGroup.totalMonthlyIncome.toFixed(2)}
                  </p>
                </div>
                <div className="h-8 w-8 bg-green-500/10 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    {t("stats.budgetUsage")}
                  </p>
                  <p className="text-xl font-bold text-white">
                    {familyGroup.budgetUtilization}%
                  </p>
                </div>
                <div className="h-8 w-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    {t("stats.sharedGoals")}
                  </p>
                  <p className="text-xl font-bold text-white">
                    {familyGroup.sharedGoalsCount}
                  </p>
                </div>
                <div className="h-8 w-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Family Members */}
        <Card className="border-gray-800 bg-gray-900/50">
          <CardHeader>
            <CardTitle>{t("members.title")}</CardTitle>
            <CardDescription>{t("members.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <FamilyMembersPanel familyGroup={familyGroup} />
          </CardContent>
        </Card>

        {/* Family Settings */}
        <Card className="border-gray-800 bg-gray-900/50">
          <CardHeader>
            <CardTitle>{t("settings.title")}</CardTitle>
            <CardDescription>{t("settings.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {t("settings.sharedCurrency")}
                    </p>
                    <p className="text-sm text-gray-400">
                      {familyGroup.settings.sharedCurrency}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="font-medium">{t("settings.monthlyBudget")}</p>
                    <p className="text-sm text-gray-400">
                      {familyGroup.settings.monthlyFamilyBudget
                        ? `$${familyGroup.settings.monthlyFamilyBudget}`
                        : t("settings.notSet")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {t("permissions.membersCanViewAllTransactions")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      familyGroup.settings.permissions
                        .membersCanViewAllTransactions
                        ? "default"
                        : "secondary"
                    }
                  >
                    {familyGroup.settings.permissions
                      .membersCanViewAllTransactions
                      ? t("settings.enabled")
                      : t("settings.disabled")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      {t("permissions.membersCanEditSharedBudgets")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      familyGroup.settings.permissions
                        .membersCanEditSharedBudgets
                        ? "default"
                        : "secondary"
                    }
                  >
                    {familyGroup.settings.permissions
                      .membersCanEditSharedBudgets
                      ? t("settings.enabled")
                      : t("settings.disabled")}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <FamilySettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        familyGroup={familyGroup}
      />
    </div>
  );
}
