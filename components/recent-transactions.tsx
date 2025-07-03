"use client";
import { useTransactions } from "@/contexts/transactions";
import { useTranslations } from "next-intl";
import {
  useTranslatedCategories,
  getTranslatedCategoryName,
} from "@/hooks/use-translated-categories";
import {
  ArrowDownLeft,
  ShoppingBag,
  Coffee,
  Home,
  Car,
  Gamepad2,
  Receipt,
  Heart,
  GraduationCap,
  Plane,
  PiggyBank,
  Gift,
  Scissors,
  Shield,
  Calculator,
  MoreHorizontal,
} from "lucide-react";

const getCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case "ArrowDownLeft":
      return <ArrowDownLeft className="h-5 w-5" />;
    case "ShoppingBag":
      return <ShoppingBag className="h-5 w-5" />;
    case "Coffee":
      return <Coffee className="h-5 w-5" />;
    case "Home":
      return <Home className="h-5 w-5" />;
    case "Car":
      return <Car className="h-5 w-5" />;
    case "Gamepad2":
      return <Gamepad2 className="h-5 w-5" />;
    case "Receipt":
      return <Receipt className="h-5 w-5" />;
    case "Heart":
      return <Heart className="h-5 w-5" />;
    case "GraduationCap":
      return <GraduationCap className="h-5 w-5" />;
    case "Plane":
      return <Plane className="h-5 w-5" />;
    case "PiggyBank":
      return <PiggyBank className="h-5 w-5" />;
    case "Gift":
      return <Gift className="h-5 w-5" />;
    case "Scissors":
      return <Scissors className="h-5 w-5" />;
    case "Shield":
      return <Shield className="h-5 w-5" />;
    case "Calculator":
      return <Calculator className="h-5 w-5" />;
    case "MoreHorizontal":
      return <MoreHorizontal className="h-5 w-5" />;
    default:
      return <MoreHorizontal className="h-5 w-5" />;
  }
};

interface RecentTransactionsProps {
  excludeFuture?: boolean;
}

export function RecentTransactions({ excludeFuture = false }: RecentTransactionsProps) {
  const { transactions: allTransactions, isLoading } = useTransactions();
  const { data: translatedCategories } = useTranslatedCategories();
  const t = useTranslations("recentTransactions");

  // Filter transactions based on excludeFuture prop
  const transactions = excludeFuture 
    ? allTransactions.filter(transaction => {
        const today = new Date().toISOString().split('T')[0];
        const transactionDate = new Date(transaction.transactionDate).toISOString().split('T')[0];
        return transactionDate <= today;
      })
    : allTransactions;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t("today");
    
    // Handle future dates
    if (diffDays < 0) {
      const futureDays = Math.abs(diffDays);
      if (futureDays === 1) return t("tomorrow") || "tomorrow";
      if (futureDays < 7) return t("inDays", { days: futureDays }) || `in ${futureDays} days`;
      return date.toLocaleDateString();
    }
    
    // Handle past dates
    if (diffDays === 1) return t("yesterday");
    if (diffDays < 7) return t("daysAgo", { days: diffDays });
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="max-h-[350px] overflow-auto pr-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-border"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-muted rounded-full animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-h-[350px] overflow-auto pr-2">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t("noTransactions")}</p>
            <p className="text-sm">{t("startAdding")}</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between py-3 border-b border-border"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    transaction.amount > 0
                      ? "bg-emerald-500/20 text-emerald-500"
                      : "bg-rose-500/20 text-rose-500"
                  }`}
                >
                  {getCategoryIcon(transaction.categoryIcon)}
                </div>
                <div>
                  <div className="font-medium text-sm">{transaction.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {translatedCategories
                      ? getTranslatedCategoryName(
                          translatedCategories,
                          transaction.categoryId
                        )
                      : transaction.categoryName}{" "}
                    • {formatDate(transaction.transactionDate)}
                  </div>
                </div>
              </div>
              <div
                className={`font-medium ${
                  transaction.amount > 0 ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {transaction.amount > 0 ? "+" : ""}
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
