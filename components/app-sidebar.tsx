"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Building2,
  DollarSign,
  FileDown,
  Receipt,
  Repeat,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: TrendingUp,
    enabled: !!+process.env.NEXT_PUBLIC_DASHBOARD_ENABLED!,
  },
  {
    title: "Goals",
    url: "/goals",
    icon: Target,
    enabled: !!+process.env.NEXT_PUBLIC_GOALS_ENABLED!,
  },
  {
    title: "Budgets",
    url: "/budgets",
    icon: DollarSign,
    enabled: !!+process.env.NEXT_PUBLIC_BUDGETS_ENABLED!,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: Receipt,
    enabled: !!+process.env.NEXT_PUBLIC_TRANSACTIONS_ENABLED!,
  },
  {
    title: "Recurring",
    url: "/recurring",
    icon: Repeat,
    enabled: !!+process.env.NEXT_PUBLIC_RECURRING_ENABLED!,
  },
  {
    title: "Manage",
    url: "/transactions/manage",
    icon: BarChart3,
    enabled: !!+process.env.NEXT_PUBLIC_MANAGE_ENABLED!,
  },
  {
    title: "Reports",
    url: "/reports/export",
    icon: FileDown,
    enabled: !!+process.env.NEXT_PUBLIC_REPORTS_ENABLED!,
  },
  {
    title: "Accounts",
    url: "/accounts",
    icon: Building2,
    enabled: !!+process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED!,
  },
  {
    title: "Family",
    url: "/family",
    icon: Users,
    enabled: !!+process.env.NEXT_PUBLIC_FAMILY_ENABLED!,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const tCommon = useTranslations("common");

  return (
    <Sidebar collapsible="offcanvas" {...props} className="border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground">
                <DollarSign className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {tCommon("appName")}
                </span>
                <span className="truncate text-xs">Finance Tracker</span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="m-4">
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: "John Doe",
            email: "john.doe@example.com",
            avatar: "https://github.com/shadcn.png",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
