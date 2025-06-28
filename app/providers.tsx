"use client";

import { CategoriesProvider } from "@/contexts/categories";
import { TransactionsProvider } from "@/contexts/transactions";
import { BudgetAlertsProvider } from "@/contexts/budget-alerts";
import { ThemeProvider } from "next-themes";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="fintrack-theme"
    >
      <CategoriesProvider>
        <TransactionsProvider>
          <BudgetAlertsProvider>
            {children}
          </BudgetAlertsProvider>
        </TransactionsProvider>
      </CategoriesProvider>
    </ThemeProvider>
  );
};
