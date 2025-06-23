import { CategoriesProvider } from "@/contexts/categories";
import { TransactionsProvider } from "@/contexts/transactions";
import { BudgetAlertsProvider } from "@/contexts/budget-alerts";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <CategoriesProvider>
      <TransactionsProvider>
        <BudgetAlertsProvider>
          {children}
        </BudgetAlertsProvider>
      </TransactionsProvider>
    </CategoriesProvider>
  );
};
