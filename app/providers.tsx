import { CategoriesProvider } from "@/contexts/categories";
import { TransactionsProvider } from "@/contexts/transactions";
export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <CategoriesProvider>
      <TransactionsProvider>{children}</TransactionsProvider>
    </CategoriesProvider>
  );
};
