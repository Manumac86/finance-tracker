"use client";

import { createContext, useContext, ReactNode } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { 
  type Debt, 
  type DebtSummary, 
  type DebtWithAccount,
  type CreateDebt,
  type UpdateDebt,
  type DebtPayment,
  type RecordPayment
} from "@/lib/db/schemas/debt";

interface DebtsContextType {
  // Data
  debts: Debt[] | undefined;
  summary: DebtSummary | undefined;
  isLoading: boolean;
  error: any;
  
  // Actions
  createDebt: (data: CreateDebt) => Promise<Debt>;
  updateDebt: (id: string, data: Partial<UpdateDebt>) => Promise<Debt>;
  deleteDebt: (id: string) => Promise<void>;
  refreshDebts: () => Promise<void>;
  refreshSummary: () => Promise<void>;
}

const DebtsContext = createContext<DebtsContextType | undefined>(undefined);

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }
  return res.json();
};

export function DebtsProvider({ children }: { children: ReactNode }) {
  // Fetch debts list
  const { 
    data: debtsData, 
    error: debtsError, 
    isLoading: debtsLoading,
    mutate: mutateDebts 
  } = useSWR("/api/debts", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 30000, // 30 seconds
  });

  // Fetch debt summary
  const { 
    data: summaryData, 
    error: summaryError, 
    isLoading: summaryLoading,
    mutate: mutateSummary 
  } = useSWR("/api/debts/summary", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000, // 1 minute
  });

  const debts = debtsData?.debts;
  const summary = summaryData?.summary;
  const isLoading = debtsLoading || summaryLoading;
  const error = debtsError || summaryError;

  // Create new debt
  const createDebt = async (data: CreateDebt): Promise<Debt> => {
    try {
      const response = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create debt");
      }

      const result = await response.json();
      
      // Refresh data
      await Promise.all([mutateDebts(), mutateSummary()]);
      
      toast.success("Debt created successfully");
      return result.debt;
    } catch (error) {
      console.error("Error creating debt:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create debt");
      throw error;
    }
  };

  // Update existing debt
  const updateDebt = async (id: string, data: Partial<UpdateDebt>): Promise<Debt> => {
    try {
      const response = await fetch(`/api/debts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update debt");
      }

      const result = await response.json();
      
      // Refresh data
      await Promise.all([mutateDebts(), mutateSummary()]);
      
      toast.success("Debt updated successfully");
      return result.debt;
    } catch (error) {
      console.error("Error updating debt:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update debt");
      throw error;
    }
  };

  // Delete debt
  const deleteDebt = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/debts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete debt");
      }

      const result = await response.json();
      
      // Refresh data
      await Promise.all([mutateDebts(), mutateSummary()]);
      
      toast.success(result.deactivated ? "Debt deactivated" : "Debt deleted");
    } catch (error) {
      console.error("Error deleting debt:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete debt");
      throw error;
    }
  };

  // Refresh functions
  const refreshDebts = async () => {
    await mutateDebts();
  };

  const refreshSummary = async () => {
    await mutateSummary();
  };

  const value: DebtsContextType = {
    debts,
    summary,
    isLoading,
    error,
    createDebt,
    updateDebt,
    deleteDebt,
    refreshDebts,
    refreshSummary,
  };

  return (
    <DebtsContext.Provider value={value}>
      {children}
    </DebtsContext.Provider>
  );
}

export function useDebts() {
  const context = useContext(DebtsContext);
  if (context === undefined) {
    throw new Error("useDebts must be used within a DebtsProvider");
  }
  return context;
}

// Hook for fetching individual debt details with payments
export function useDebt(debtId: string | null) {
  const { 
    data: debtData, 
    error: debtError, 
    isLoading: debtLoading,
    mutate: mutateDebt 
  } = useSWR(
    debtId ? `/api/debts/${debtId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
    }
  );

  const { 
    data: paymentsData, 
    error: paymentsError, 
    isLoading: paymentsLoading,
    mutate: mutatePayments 
  } = useSWR(
    debtId ? `/api/debts/${debtId}/payments` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
    }
  );

  const recordPayment = async (paymentData: RecordPayment) => {
    try {
      const response = await fetch(`/api/debts/${debtId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to record payment");
      }

      const result = await response.json();
      
      // Refresh both debt and payments data
      await Promise.all([mutateDebt(), mutatePayments()]);
      
      toast.success("Payment recorded successfully");
      return result;
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to record payment");
      throw error;
    }
  };

  return {
    debt: debtData?.debt as Debt | undefined,
    payments: paymentsData?.payments as DebtPayment[] | null,
    error: debtError || paymentsError,
    isLoading: debtLoading || paymentsLoading,
    recordPayment,
    refresh: async () => {
      await Promise.all([mutateDebt(), mutatePayments()]);
    },
  };
}

// Hook for fetching debt payments
export function useDebtPayments(debtId: string | null, limit = 50, offset = 0) {
  const { 
    data, 
    error, 
    isLoading,
    mutate 
  } = useSWR(
    debtId ? `/api/debts/${debtId}/payments?limit=${limit}&offset=${offset}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
    }
  );

  const recordPayment = async (paymentData: any) => {
    try {
      const response = await fetch(`/api/debts/${debtId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to record payment");
      }

      const result = await response.json();
      
      // Refresh payments and debt data
      await mutate();
      
      toast.success("Payment recorded successfully");
      return result;
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to record payment");
      throw error;
    }
  };

  return {
    payments: data?.payments || [],
    pagination: data?.pagination,
    error,
    isLoading,
    recordPayment,
    refresh: mutate,
  };
}