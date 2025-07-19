"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function RecalculateBalancesButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRecalculate = async () => {
    setIsLoading(true);
    try {
      // Recalculate account balances
      const recalculateResponse = await fetch("/api/accounts/recalculate-balances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!recalculateResponse.ok) {
        throw new Error("Failed to recalculate balances");
      }

      const recalculateResult = await recalculateResponse.json();

      // Clear balance history cache to reflect updated balances
      const clearCacheResponse = await fetch("/api/balance-history/clear-cache", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!clearCacheResponse.ok) {
        console.warn("Failed to clear balance history cache");
      }

      toast.success(`Balances recalculated successfully! Updated ${recalculateResult.updatedAccounts} accounts.`);
      
      // Reload the page to refresh all data
      window.location.reload();
    } catch (error) {
      console.error("Error recalculating balances:", error);
      toast.error("Failed to recalculate balances");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleRecalculate} 
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      {isLoading ? "Recalculating..." : "Recalculate Account Balances"}
    </Button>
  );
}