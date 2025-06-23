"use client";
import { UITransaction } from "@/lib/db/schemas/transaction";
import { createContext, useContext } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TransactionsContextType {
  transactions: UITransaction[];
  isLoading: boolean;
  error: any;
  mutate: () => void;
}

export const TransactionsContext = createContext<TransactionsContextType>({
  transactions: [],
  isLoading: false,
  error: null,
  mutate: () => {},
});

export const TransactionsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data, error, isLoading, mutate } = useSWR<{ transactions: UITransaction[] }>(
    "/api/transactions",
    fetcher
  );

  return (
    <TransactionsContext.Provider
      value={{
        transactions: data?.transactions || [],
        isLoading,
        error,
        mutate,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error("useTransactions must be used within a TransactionsProvider");
  }
  return context;
};
