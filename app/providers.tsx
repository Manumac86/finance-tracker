"use client";

import { CategoriesProvider } from "@/contexts/categories";
import { TransactionsProvider } from "@/contexts/transactions";
import { BudgetAlertsProvider } from "@/contexts/budget-alerts";
import { AccountsProvider } from "@/contexts/accounts";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="fintrack-theme"
    >
      <ClerkProvider
        appearance={{
          cssLayerName: "fintrack-theme",
        }}
      >
        <CategoriesProvider>
          <TransactionsProvider>
            <AccountsProvider>
              <BudgetAlertsProvider>{children}</BudgetAlertsProvider>
            </AccountsProvider>
          </TransactionsProvider>
        </CategoriesProvider>
      </ClerkProvider>
    </ThemeProvider>
  );
};
