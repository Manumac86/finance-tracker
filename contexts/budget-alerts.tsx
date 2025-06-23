"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { BudgetAlert, BudgetAlertService } from "@/lib/services/budget-alerts";
import { UITransaction } from "@/lib/db/schemas/transaction";
import { toast } from "sonner";

interface BudgetAlertsContextType {
  alerts: BudgetAlert[];
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  dismissAlert: (alertId: string) => void;
  checkBudgetAlerts: (newTransaction: UITransaction) => Promise<void>;
  clearAllAlerts: () => void;
}

const BudgetAlertsContext = createContext<BudgetAlertsContextType | undefined>(undefined);

interface BudgetAlertsProviderProps {
  children: ReactNode;
}

export function BudgetAlertsProvider({ children }: BudgetAlertsProviderProps) {
  const { userId } = useAuth();
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const alertService = BudgetAlertService.getInstance();

  // Subscribe to alerts from the service
  useEffect(() => {
    if (!isEnabled) return;

    const unsubscribe = alertService.onAlert((alert: BudgetAlert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep only last 10 alerts
      
      // Show toast notification
      showAlertToast(alert);
    });

    return unsubscribe;
  }, [alertService, isEnabled]);

  // Show toast notification for alerts
  const showAlertToast = (alert: BudgetAlert) => {
    const toastOptions = {
      duration: alert.severity === 'critical' ? 8000 : 5000,
    };

    switch (alert.severity) {
      case 'critical':
        toast.error(alert.message, {
          ...toastOptions,
          description: alert.recommendation,
        });
        break;
      case 'warning':
        toast.warning(alert.message, {
          ...toastOptions,
          description: alert.recommendation,
        });
        break;
      case 'info':
        toast.info(alert.message, {
          ...toastOptions,
          description: alert.recommendation,
        });
        break;
      default:
        toast(alert.message, toastOptions);
    }
  };

  // Check budget alerts after a new transaction
  const checkBudgetAlerts = async (newTransaction: UITransaction) => {
    if (!userId || !isEnabled) return;

    try {
      await alertService.checkBudgetAlerts(userId, newTransaction);
    } catch (error) {
      console.error('Error checking budget alerts:', error);
    }
  };

  // Dismiss a specific alert
  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  // Clear all alerts
  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const value: BudgetAlertsContextType = {
    alerts,
    isEnabled,
    setIsEnabled,
    dismissAlert,
    checkBudgetAlerts,
    clearAllAlerts,
  };

  return (
    <BudgetAlertsContext.Provider value={value}>
      {children}
    </BudgetAlertsContext.Provider>
  );
}

export function useBudgetAlerts(): BudgetAlertsContextType {
  const context = useContext(BudgetAlertsContext);
  if (context === undefined) {
    throw new Error("useBudgetAlerts must be used within a BudgetAlertsProvider");
  }
  return context;
}