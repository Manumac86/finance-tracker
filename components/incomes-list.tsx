"use client";

import { Briefcase, CreditCard, DollarSign, Laptop } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Sample data for income
const incomes = [
  {
    id: 1,
    category: "Salary",
    amount: 3500.0,
    percentage: 82.4,
    icon: Briefcase,
    color: "bg-emerald-500",
  },
  {
    id: 2,
    category: "Freelance",
    amount: 350.0,
    percentage: 8.2,
    icon: Laptop,
    color: "bg-cyan-500",
  },
  {
    id: 3,
    category: "Investments",
    amount: 250.0,
    percentage: 5.9,
    icon: DollarSign,
    color: "bg-yellow-500",
  },
  {
    id: 4,
    category: "Cashback",
    amount: 150.0,
    percentage: 3.5,
    icon: CreditCard,
    color: "bg-indigo-500",
  },
];

export function IncomesList() {
  return (
    <div className="space-y-4">
      {incomes.map((income) => (
        <div key={income.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full ${income.color}/20`}
              >
                <income.icon
                  className={`h-4 w-4 ${income.color.replace("bg-", "text-")}`}
                />
              </div>
              <span className="font-medium">{income.category}</span>
            </div>
            <div className="text-sm font-medium">
              ${income.amount.toFixed(2)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Progress
              value={income.percentage}
              className="h-2 bg-muted"
              indicatorClassName={income.color}
            />
            <div className="text-xs text-muted-foreground">{income.percentage}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}
