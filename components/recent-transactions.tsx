"use client";
import { useTransactions } from "@/contexts/transactions";
import { Category } from "@/lib/db/schemas";
import { ArrowDownLeft, ShoppingBag, Coffee, Home } from "lucide-react";

const getCategoryIcon = (category: Category) => {
  switch (category.name) {
    case "Income":
      return <ArrowDownLeft className="h-5 w-5" />;
    case "Shopping":
      return <ShoppingBag className="h-5 w-5" />;
    case "Food & Drink":
      return <Coffee className="h-5 w-5" />;
    case "Housing":
      return <Home className="h-5 w-5" />;
    case "Utilities":
      return <Home className="h-5 w-5" />;
    default:
      return <ArrowDownLeft className="h-5 w-5" />;
  }
};

export function RecentTransactions() {
  const { transactions } = useTransactions();
  return (
    <div className="space-y-4">
      <div className="max-h-[350px] overflow-auto pr-2">
        {transactions.map((transaction) => (
          <div
            key={transaction._id}
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
                {getCategoryIcon(transaction.category)}
              </div>
              <div>
                <div className="font-medium text-sm text-white">
                  {transaction.name}
                </div>
                <div className="text-xs text-gray-400">
                  {transaction.category.name} • {transaction.date}
                </div>
              </div>
            </div>
            <div
              className={`font-medium ${
                transaction.amount > 0 ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {transaction.amount > 0 ? "+" : ""}
              {transaction.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
