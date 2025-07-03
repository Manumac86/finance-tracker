"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BankConnectionModal } from "@/components/banking/bank-connection-modal";
import {
  Building2,
  CreditCard,
  Plus,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
} from "lucide-react";

// Use the same BankAccount interface to ensure type compatibility
interface BankAccount {
  id: string;
  accountName: string;
  accountType: string;
  institutionName: string;
  mask?: string;
  currentBalance?: number;
  currencyCode: string;
  // Extended properties for the page
  provider?: string;
  region?: string;
  formattedBalance?: string;
  syncStatus?: "synced" | "pending" | "failed" | "disconnected";
  lastSyncedAt?: string;
  lastError?: string;
  isActive?: boolean;
}

interface SyncStatus {
  summary: {
    totalAccounts: number;
    activeAccounts: number;
    syncedAccounts: number;
    failedAccounts: number;
    lastGlobalSync: number;
  };
  accounts: Array<{
    accountId: string;
    accountName: string;
    provider: string;
    region: string;
    syncStatus: string;
    lastSyncedAt?: string;
    lastError?: string;
    isActive: boolean;
  }>;
}

export default function BankingPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchBankAccounts();
    fetchSyncStatus();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch("/api/banking/connect?action=accounts");
      const data = await response.json();

      if (data.success) {
        setBankAccounts(data.data.accounts);
      }
    } catch (error) {
      console.error("Failed to fetch bank accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch("/api/banking/sync");
      const data = await response.json();

      if (data.success) {
        setSyncStatus(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch sync status:", error);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/banking/sync?action=all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        await fetchBankAccounts();
        await fetchSyncStatus();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Failed to sync accounts:", error);
      alert(
        "Failed to sync accounts: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncAccount = async (accountId: string) => {
    try {
      const response = await fetch("/api/banking/sync?action=account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchBankAccounts();
        await fetchSyncStatus();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Failed to sync account:", error);
      alert(
        "Failed to sync account: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  const handleConnectionSuccess = (accounts: BankAccount[]) => {
    setBankAccounts((prev) => [...prev, ...accounts]);
    setIsConnectionModalOpen(false);
    fetchSyncStatus(); // Refresh sync status
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case "synced":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case "synced":
        return "bg-emerald-100 text-emerald-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProviderInfo = (provider: string, region: string) => {
    const providerInfo = {
      plaid: { name: "Plaid", flag: "🇺🇸", region: "United States" },
      truelayer: { name: "TrueLayer", flag: "🇪🇸", region: "Spain & Europe" },
      belvo: { name: "Belvo", flag: "🇦🇷", region: "Argentina & LATAM" },
    };
    return (
      providerInfo[provider as keyof typeof providerInfo] || {
        name: provider,
        flag: "🌍",
        region,
      }
    );
  };

  const formatLastSync = (lastSyncedAt?: string) => {
    if (!lastSyncedAt) return "Never";

    const date = new Date(lastSyncedAt);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  if (!!!+process.env.NEXT_PUBLIC_BANK_ENABLED!) {
    return (
      <div className="space-y-6 h-full flex flex-col items-center justify-center">
        <div className="flex flex-col gap-6 items-center justify-center">
          <h1 className="text-3xl font-bold">Coming Soon</h1>
          <div className="flex flex-col gap-2 justify-center items-center">
            <p className="text-muted-foreground text-center">
              From this section, you will be able to connect your bank accounts
              and integrate your bank accounts with your financial data.
            </p>
            <p className="text-muted-foreground text-center">
              Please share your email to be notified when this feature is
              available.
            </p>
          </div>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const email = formData.get("email") as string;
              console.log(email);
            }}
          >
            <Input placeholder="Email" />
            <Button variant="outline" type="submit">
              Waitlist
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Bank Accounts</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bank Accounts</h1>
          <p className="text-muted-foreground">
            Manage your connected bank accounts and sync transactions
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSyncAll}
            disabled={isSyncing || bankAccounts.length === 0}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync All
              </>
            )}
          </Button>
          <Button onClick={() => setIsConnectionModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Connect Bank
          </Button>
        </div>
      </div>

      {/* Sync Status Summary */}
      {syncStatus && bankAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Sync Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {syncStatus.summary.totalAccounts}
                </div>
                <div className="text-sm text-muted-foreground">Total Accounts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {syncStatus.summary.syncedAccounts}
                </div>
                <div className="text-sm text-muted-foreground">Synced</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {syncStatus.summary.failedAccounts}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {syncStatus.summary.activeAccounts}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {bankAccounts.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Building2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No Bank Accounts Connected
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Connect your bank accounts to automatically import transactions
                and keep your finances up to date.
              </p>
              <Button onClick={() => setIsConnectionModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Connect Your First Bank
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bank Accounts List */}
      {bankAccounts.length > 0 && (
        <div className="grid gap-4">
          {bankAccounts.map((account) => {
            const providerInfo = getProviderInfo(
              account.provider || "",
              account.region || ""
            );
            const syncInfo = syncStatus?.accounts.find(
              (s) => s.accountId === account.id
            );

            return (
              <Card key={account.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {account.accountName}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {account.accountType}
                          </Badge>
                          {!account.isActive && (
                            <Badge variant="destructive" className="text-xs">
                              Disconnected
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {account.institutionName} •••• {account.mask}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span>{providerInfo.flag}</span>
                            <span>{providerInfo.name}</span>
                          </div>
                          <div>{account.currencyCode}</div>
                          <div className="flex items-center gap-1">
                            {getSyncStatusIcon(
                              syncInfo?.syncStatus || "unknown"
                            )}
                            <span>
                              Last sync:{" "}
                              {formatLastSync(syncInfo?.lastSyncedAt)}
                            </span>
                          </div>
                        </div>
                        {syncInfo?.lastError && (
                          <Alert className="mt-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {syncInfo.lastError}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {account.formattedBalance && (
                        <div className="text-right mr-4">
                          <div className="font-semibold">
                            {account.formattedBalance}
                          </div>
                          <Badge
                            className={`text-xs ${getSyncStatusColor(
                              syncInfo?.syncStatus || "unknown"
                            )}`}
                          >
                            {syncInfo?.syncStatus || "unknown"}
                          </Badge>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncAccount(account.id)}
                        disabled={!account.isActive}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bank Connection Modal */}
      <BankConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        onSuccess={handleConnectionSuccess}
      />
    </div>
  );
}
