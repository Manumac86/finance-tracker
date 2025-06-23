"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DollarSign, Search, Plus, Target, TrendingUp, Receipt } from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { BudgetAlertsPanel } from "@/components/budgets/budget-alerts-panel";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-800 bg-gray-950/95 px-4 backdrop-blur-sm sm:px-6">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
        <DollarSign className="h-6 w-6 text-emerald-500" />
        <span>FinTrack</span>
      </Link>
      
      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-1 ml-8">
        <Link href="/dashboard">
          <Button 
            variant={pathname === "/dashboard" ? "default" : "ghost"}
            size="sm"
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/goals">
          <Button 
            variant={pathname === "/goals" ? "default" : "ghost"}
            size="sm"
            className="gap-2"
          >
            <Target className="h-4 w-4" />
            Goals
          </Button>
        </Link>
        <Link href="/budgets">
          <Button 
            variant={pathname === "/budgets" ? "default" : "ghost"}
            size="sm"
            className="gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Budgets
          </Button>
        </Link>
        <Link href="/transactions">
          <Button 
            variant={pathname === "/transactions" ? "default" : "ghost"}
            size="sm"
            className="gap-2"
          >
            <Receipt className="h-4 w-4" />
            Transactions
          </Button>
        </Link>
      </nav>

      <div className="ml-auto flex items-center gap-4">
        <form className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search transactions..."
            className="w-64 rounded-lg bg-gray-900 pl-8 text-sm ring-offset-gray-950 placeholder:text-gray-500 focus-visible:ring-gray-800"
          />
        </form>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 border-gray-800 bg-gray-950 text-gray-50 hover:bg-gray-900 hover:text-gray-50"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Transaction</span>
        </Button>
        <BudgetAlertsPanel />
        <UserButton 
          afterSignOutUrl="/signin"
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 sm:w-10 sm:h-10"
            }
          }}
        />
      </div>
    </header>
  );
}
