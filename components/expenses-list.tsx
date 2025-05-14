"use client";

import { Coffee, CreditCard, Home, ShoppingBag } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Sample data for expenses
const expenses = [
  {
    id: 1,
    category: "Housing",
    amount: 1200.0,
    percentage: 55.8,
    icon: Home,
    color: "bg-blue-500",
  },
  {
    id: 2,
    category: "Food & Dining",
    amount: 450.0,
    percentage: 20.9,
    icon: Coffee,
    color: "bg-amber-500",
  },
  {
    id: 3,
    category: "Shopping",
    amount: 320.0,
    percentage: 14.9,
    icon: ShoppingBag,
    color: "bg-purple-500",
  },
  {
    id: 4,
    category: "Subscriptions",
    amount: 180.0,
    percentage: 8.4,
    icon: CreditCard,
    color: "bg-rose-500",
  },
];

export function ExpensesList() {
  return (
    <div className="space-y-4">
      {expenses.map((expense) => (
        <div key={expense.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full ${expense.color}/20`}
              >
                <expense.icon
                  className={`h-4 w-4 ${expense.color.replace("bg-", "text-")}`}
                />
              </div>
              <span className="font-medium">{expense.category}</span>
            </div>
            <div className="text-sm font-medium">
              ${expense.amount.toFixed(2)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Progress
              value={expense.percentage}
              className="h-2 bg-gray-800"
              indicatorClassName={expense.color}
            />
            <div className="text-xs text-gray-400">{expense.percentage}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}
