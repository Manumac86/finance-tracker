"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UserPlus,
  Crown,
  User,
  MoreVertical,
  Calendar,
  DollarSign,
  Settings,
  Trash,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UIFamilyGroup } from "@/lib/db/schemas/family-clerk";
import { useFamilyMembers } from "@/hooks/use-family-members";
import { useTranslations } from "next-intl";

interface FamilyMembersPanelProps {
  familyGroup: UIFamilyGroup;
}

export function FamilyMembersPanel({ familyGroup }: FamilyMembersPanelProps) {
  const { members, isLoading, error, removeMember } = useFamilyMembers(
    familyGroup.organizationId
  );

  const t = useTranslations("family.members");

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "org:admin":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "org:member":
        return <User className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "org:admin":
        return (
          <Badge variant="default" className="bg-yellow-500/10 text-yellow-400">
            {t("roles.admin")}
          </Badge>
        );
      case "org:member":
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-400">
            {t("roles.member")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{t("roles.viewer")}</Badge>;
    }
  };

  const getInitials = (
    firstName?: string,
    lastName?: string,
    email?: string
  ) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "?";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const canManageMembers = familyGroup.currentUserRole === "org:admin";

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-700 animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-700 rounded w-2/3 animate-pulse"></div>
                </div>
                <div className="h-6 w-16 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-800 bg-red-900/10">
        <CardContent className="p-4">
          <p className="text-red-400 text-center">{t("failedToLoad")}</p>
          <p className="text-sm text-gray-500 text-center mt-1">
            {error.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with invite button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {members.length}{" "}
          {members.length === 1 ? t("../member") : t("../membersLabel")}
        </p>
        {canManageMembers && (
          <Button size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            {t("inviteMember")}
          </Button>
        )}
      </div>

      {/* Members list */}
      <div className="space-y-3">
        {members.map((member) => (
          <Card
            key={member.clerkUserId}
            className="border-gray-800 bg-gray-900/50"
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.imageUrl} alt={member.displayName} />
                  <AvatarFallback className="bg-gray-700 text-gray-200">
                    {getInitials(
                      member.firstName,
                      member.lastName,
                      member.email
                    )}
                  </AvatarFallback>
                </Avatar>

                {/* Member info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white truncate">
                      {member.displayName}
                      {member.isCurrentUser && (
                        <span className="text-xs text-gray-400 ml-1">
                          {t("you")}
                        </span>
                      )}
                    </h4>
                    {getRoleIcon(member.role)}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                    <span className="truncate">{member.email}</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {t("joined")} {formatDate(member.joinedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-gray-400">{t("thisMonth")}</p>
                    <p className="font-medium text-white">
                      ${member.currentMonthSpending?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  {member.settings?.spendingLimitPerMonth && (
                    <div className="text-center">
                      <p className="text-gray-400">{t("limit")}</p>
                      <p className="font-medium text-white">
                        ${member.settings.spendingLimitPerMonth.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Role badge */}
                <div className="flex items-center gap-2">
                  {getRoleBadge(member.role)}

                  {/* Actions menu */}
                  {canManageMembers && !member.isCurrentUser && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          {t("editSettings")}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <DollarSign className="h-4 w-4 mr-2" />
                          {t("setSpendingLimit")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-400 focus:text-red-400"
                          onClick={() => removeMember(member.clerkUserId)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          {t("removeMember")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Mobile stats */}
              <div className="md:hidden mt-3 pt-3 border-t border-gray-800">
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-gray-400">{t("thisMonth")}: </span>
                    <span className="text-white font-medium">
                      ${member.currentMonthSpending?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  {member.settings?.spendingLimitPerMonth && (
                    <div>
                      <span className="text-gray-400">{t("limit")}: </span>
                      <span className="text-white font-medium">
                        ${member.settings.spendingLimitPerMonth.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {members.length === 0 && (
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 space-y-2">
              <User className="h-8 w-8 mx-auto opacity-50" />
              <p>{t("noMembers")}</p>
              <p className="text-sm">{t("noMembersDesc")}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
