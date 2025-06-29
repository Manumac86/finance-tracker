"use client";

import {
  Plus,
  Target,
  DollarSign,
  PieChart,
  Settings,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function QuickActionsCard() {
  const t = useTranslations("quickActions");

  const quickActions = [
    {
      label: t("addTransaction.title"),
      href: "/transactions",
      icon: <Plus className="h-4 w-4" />,
      description: t("addTransaction.description"),
      color: "bg-emerald-600 hover:bg-emerald-700",
    },
    {
      label: t("createGoal.title"),
      href: "/goals",
      icon: <Target className="h-4 w-4" />,
      description: t("createGoal.description"),
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      label: t("setBudget.title"),
      href: "/budgets",
      icon: <DollarSign className="h-4 w-4" />,
      description: t("setBudget.description"),
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      label: t("viewReports.title"),
      href: "/reports",
      icon: <PieChart className="h-4 w-4" />,
      description: t("viewReports.description"),
      color: "bg-orange-600 hover:bg-orange-700",
    },
  ];

  const insights = [
    {
      title: t("monthlySavings"),
      value: "$1,250",
      change: "+12%",
      positive: true,
      description: t("vsLastMonth"),
    },
    {
      title: t("topCategory"),
      value: "Groceries",
      change: "$420",
      positive: false,
      description: t("thisMonth"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Button
                className={`w-full h-auto p-4 flex flex-col items-center gap-2 ${action.color}`}
              >
                {action.icon}
                <div className="text-center">
                  <div className="font-medium text-sm">{action.label}</div>
                  <div className="text-xs opacity-80">{action.description}</div>
                </div>
              </Button>
            </Link>
          ))}
        </div>

        {/* Quick Insights */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            {t("quickInsights")}
          </div>
          {insights.map((insight, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div>
                <div className="font-medium text-sm">{insight.title}</div>
                <div className="text-xs text-muted-foreground">
                  {insight.description}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm">{insight.value}</div>
                <div
                  className={`text-xs flex items-center gap-1 ${
                    insight.positive ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  <TrendingUp
                    className={`h-3 w-3 ${
                      insight.positive ? "" : "rotate-180"
                    }`}
                  />
                  {insight.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Actions */}
        <div className="border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-2">
            <Link href="/settings">
              <Button variant="outline" size="sm" className="w-full">
                {t("settings")}
              </Button>
            </Link>
            <Link href="/help">
              <Button variant="outline" size="sm" className="w-full">
                {t("help")}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
