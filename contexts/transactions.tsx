"use client";
import { Transaction } from "@/lib/db/schemas";
import { fetcher } from "@/lib/utils";
import { methodType } from "@/types/common.type";
import { createContext, useContext, useEffect, useState } from "react";
import useSWR from "swr";

export const SWRContext = createContext({
  transactions: [] as Transaction[],
  setTransactions: (newTransactions: Transaction[]) => {},
});

export const TransactionsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const { data } = useSWR<Transaction[]>(
    ["/api/transactions", "GET"],
    ([url, method]: [string, methodType]) => fetcher(url, method)
  );

  useEffect(() => {
    if (data) {
      setTransactions(data);
    }
  }, [data]);

  return (
    <SWRContext.Provider
      value={{
        transactions,
        setTransactions: (newTransactions: Transaction[]) =>
          setTransactions(newTransactions),
      }}
    >
      {children}
    </SWRContext.Provider>
  );
};

export const useTransactions = () => {
  const { transactions, setTransactions } = useContext(SWRContext);
  return { transactions, setTransactions };
};
