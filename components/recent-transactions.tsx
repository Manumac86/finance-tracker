"use client";
import { useTransactions } from "@/contexts/transactions";
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
  MoreHorizontal
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

export function RecentTransactions() {
  const { transactions, isLoading } = useTransactions();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
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
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-gray-800 rounded-full animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-800 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-16 bg-gray-800 rounded animate-pulse" />
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
          <div className="text-center py-8 text-gray-400">
            <p>No transactions yet</p>
            <p className="text-sm">Start by adding your first transaction</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between py-3 border-b border-gray-800"
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
                  <div className="font-medium text-sm text-white">
                    {transaction.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {transaction.categoryName} • {formatDate(transaction.transactionDate)}
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
