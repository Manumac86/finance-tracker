"use client";

import { Plus, Target, DollarSign, PieChart, Settings, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function QuickActionsCard() {
  const quickActions = [
    {
      label: "Add Transaction",
      href: "/transactions",
      icon: <Plus className="w-4 h-4" />,
      description: "Record income or expense",
      color: "bg-emerald-600 hover:bg-emerald-700"
    },
    {
      label: "Create Goal",
      href: "/goals",
      icon: <Target className="w-4 h-4" />,
      description: "Set a financial target",
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      label: "Set Budget",
      href: "/budgets",
      icon: <DollarSign className="w-4 h-4" />,
      description: "Control your spending",
      color: "bg-purple-600 hover:bg-purple-700"
    },
    {
      label: "View Reports",
      href: "/reports",
      icon: <PieChart className="w-4 h-4" />,
      description: "Analyze your finances",
      color: "bg-orange-600 hover:bg-orange-700"
    }
  ];

  const insights = [
    {
      title: "Monthly Savings",
      value: "$1,250",
      change: "+12%",
      positive: true,
      description: "vs last month"
    },
    {
      title: "Top Category",
      value: "Groceries",
      change: "$420",
      positive: false,
      description: "this month"
    }
  ];

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Quick Actions
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
          <div className="text-sm font-medium text-gray-300">Quick Insights</div>
          {insights.map((insight, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div>
                <div className="font-medium text-sm">{insight.title}</div>
                <div className="text-xs text-gray-400">{insight.description}</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm">{insight.value}</div>
                <div className={`text-xs flex items-center gap-1 ${
                  insight.positive ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  <TrendingUp className={`w-3 h-3 ${
                    insight.positive ? '' : 'rotate-180'
                  }`} />
                  {insight.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Actions */}
        <div className="border-t border-gray-800 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <Link href="/settings">
              <Button variant="outline" size="sm" className="w-full border-gray-700">
                Settings
              </Button>
            </Link>
            <Link href="/help">
              <Button variant="outline" size="sm" className="w-full border-gray-700">
                Help
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}