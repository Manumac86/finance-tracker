"use client";

import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { TopBar } from "@/components/top-bar";
import { AddTransactionButton } from "@/components/add-transaction-button";

export function DashboardLayoutWrapper({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <TopBar />
        <div className="flex flex-1 flex-col">
          {children}
          <AddTransactionButton />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
