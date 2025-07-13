"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import useSWR from 'swr';
import { UIManualAccount, CreateManualAccount, UpdateManualAccount } from '@/lib/db/schemas/manual-account';

interface AccountSummary {
  totalAccounts: number;
  activeAccounts: number;
  totalBalance: number;
  totalAssets: number;
  totalLiabilities: number;
  formattedTotalBalance: string;
  formattedTotalAssets: string;
  formattedTotalLiabilities: string;
  netWorth: number;
  formattedNetWorth: string;
  byType: {
    checking: { count: number; balance: number; formattedBalance: string };
    savings: { count: number; balance: number; formattedBalance: string };
    credit: { count: number; balance: number; formattedBalance: string };
    cash: { count: number; balance: number; formattedBalance: string };
    investment: { count: number; balance: number; formattedBalance: string };
  };
  healthIndicators: {
    hasAccounts: boolean;
    hasActiveAccounts: boolean;
    hasPositiveNetWorth: boolean;
    hasEmergencyFund: boolean;
    creditUtilization: number;
  };
}

interface AccountsContextType {
  accounts: UIManualAccount[] | undefined;
  summary: AccountSummary | undefined;
  isLoading: boolean;
  error: any;
  mutate: () => void;
  createAccount: (data: CreateManualAccount) => Promise<UIManualAccount>;
  updateAccount: (id: string, data: UpdateManualAccount) => Promise<UIManualAccount>;
  deleteAccount: (id: string) => Promise<void>;
  updateBalance: (id: string, newBalance: number, description?: string) => Promise<UIManualAccount>;
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch accounts');
  }
  return response.json();
};

export function AccountsProvider({ children }: { children: ReactNode }) {
  const { 
    data: accountsData, 
    error: accountsError, 
    mutate: mutateAccounts,
    isLoading: accountsLoading 
  } = useSWR('/api/accounts', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const { 
    data: summaryData, 
    error: summaryError, 
    mutate: mutateSummary,
    isLoading: summaryLoading 
  } = useSWR('/api/accounts/summary', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const mutate = () => {
    mutateAccounts();
    mutateSummary();
  };

  const createAccount = async (data: CreateManualAccount): Promise<UIManualAccount> => {
    const response = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create account');
    }

    const account = await response.json();
    mutate();
    return account;
  };

  const updateAccount = async (id: string, data: UpdateManualAccount): Promise<UIManualAccount> => {
    const response = await fetch(`/api/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update account');
    }

    const account = await response.json();
    mutate();
    return account;
  };

  const deleteAccount = async (id: string): Promise<void> => {
    const response = await fetch(`/api/accounts/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete account');
    }

    mutate();
  };

  const updateBalance = async (id: string, newBalance: number, description?: string): Promise<UIManualAccount> => {
    const response = await fetch(`/api/accounts/${id}/balance`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_balance: newBalance, description }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update balance');
    }

    const result = await response.json();
    mutate();
    return result.account;
  };

  const value: AccountsContextType = {
    accounts: accountsData?.accounts,
    summary: summaryData,
    isLoading: accountsLoading || summaryLoading,
    error: accountsError || summaryError,
    mutate,
    createAccount,
    updateAccount,
    deleteAccount,
    updateBalance,
  };

  return (
    <AccountsContext.Provider value={value}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
}

export function useAccount(id: string) {
  const { data, error, mutate, isLoading } = useSWR(
    id ? `/api/accounts/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    account: data?.account as UIManualAccount | undefined,
    history: data?.history,
    isLoading,
    error,
    mutate,
  };
}