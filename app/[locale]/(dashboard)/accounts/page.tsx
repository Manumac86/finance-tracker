"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  CreditCard,
  Wallet,
  PiggyBank,
  Landmark,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreateAccountModal } from "@/components/accounts/create-account-modal";
import { EditAccountModal } from "@/components/accounts/edit-account-modal";
import { AccountCard } from "@/components/accounts/account-card";
import { useAccounts } from "@/contexts/accounts";
import { RecalculateBalancesButton } from "@/components/admin/recalculate-balances-button";

const accountTypeIcons = {
  checking: Landmark,
  savings: PiggyBank,
  credit: CreditCard,
  cash: Wallet,
  investment: TrendingUp,
};

export default function AccountsPage() {
  const t = useTranslations("accounts");
  const tCommon = useTranslations("common");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);

  const { accounts, summary, isLoading, error } = useAccounts();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-destructive">{t("error.loading")}</p>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            {tCommon("retry")}
          </Button>
        </div>
      </div>
    );
  }

  const hasAccounts = accounts && accounts.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <RecalculateBalancesButton />
          <button
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          onClick={() => {
            setShowCreateModal((prev) => {
              return !prev;
            });
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t("add.title")}
        </button>
        </div>
      </div>

      {/* Account Summary */}
      {hasAccounts && summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("summary.totalBalance")}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.formattedTotalBalance}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.totalAccounts} {t("summary.accounts")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("summary.assets")}
              </CardTitle>
              <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summary.formattedTotalAssets}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("summary.savingsChecking")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("summary.liabilities")}
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summary.formattedTotalLiabilities}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("summary.creditDebt")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t("summary.netWorth")}
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  summary.netWorth >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {summary.formattedNetWorth}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("summary.assetsMinusLiabilities")}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Account Type Breakdown */}
      {hasAccounts && summary && (
        <Card>
          <CardHeader>
            <CardTitle>{t("breakdown.title")}</CardTitle>
            <CardDescription>{t("breakdown.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {Object.entries(summary.byType).map(([type, data]) => {
                const Icon =
                  accountTypeIcons[type as keyof typeof accountTypeIcons];
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium capitalize">
                        {t(`types.${type}`)}
                      </span>
                    </div>
                    <div className="text-lg font-semibold">
                      {data.formattedBalance}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {data.count}{" "}
                      {data.count === 1 ? t("account") : t("accounts")}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Accounts List */}
      {hasAccounts ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("list.title")}</h2>
            <Badge variant="outline">
              {accounts.length}{" "}
              {accounts.length === 1 ? t("account") : t("accounts")}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={() => setEditingAccount(account.id || "")}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("empty.title")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("empty.description")}
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("add.first")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateAccountModal
        open={showCreateModal}
        onOpenChange={(open) => {
          console.log("CreateAccountModal onOpenChange called with:", open);
          setShowCreateModal(open);
        }}
      />

      {editingAccount && (
        <EditAccountModal
          accountId={editingAccount}
          open={!!editingAccount}
          onOpenChange={(open) => !open && setEditingAccount(null)}
        />
      )}
    </div>
  );
}
