"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ChevronDown, Filter, TrendingDown, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BalanceChart } from "@/components/balance-chart";
import { RecentTransactions } from "@/components/recent-transactions";
import { ExpensesList } from "@/components/expenses-list";
import { IncomesList } from "@/components/incomes-list";
import Link from "next/link";

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/signin");
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while auth is loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div data-testid="auth-loading" className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirect indicator for unauthenticated users
  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div data-testid="auth-redirect" className="text-center">
          <p className="text-gray-400">Redirecting to sign in...</p>
        </div>
        {/* Mobile-specific redirect indicator */}
        <div data-testid="mobile-auth-redirect" className="text-center hidden">
          <p className="text-gray-400">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="grid gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-400">
            Welcome back! Here&apos;s an overview of your finances.
          </p>
          <div className="flex gap-4">
            <Link
              href="/onboarding"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Learn how it works
            </Link>
            <Link
              href="/goals"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Manage Goals
            </Link>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">
                Current Balance
              </CardDescription>
              <CardTitle className="text-2xl text-emerald-500">
                $8,250.00
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-400">+5.4% from last month</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">
                Monthly Income
              </CardDescription>
              <CardTitle className="text-2xl text-emerald-500">
                $4,250.00
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-400">+2.1% from last month</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">
                Monthly Expenses
              </CardDescription>
              <CardTitle className="text-2xl text-rose-500">
                $2,150.00
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-400">-1.3% from last month</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">
                Savings Rate
              </CardDescription>
              <CardTitle className="text-2xl text-emerald-500">49.4%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-400">+3.2% from last month</div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 md:grid-cols-7">
          <Card className="md:col-span-4 bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Balance Overview</CardTitle>
                <CardDescription className="text-gray-400">
                  Your balance history and projections
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 border-gray-800 bg-gray-950 text-gray-50 hover:bg-gray-900 hover:text-gray-50"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-gray-900 border-gray-800 text-gray-50"
                >
                  <DropdownMenuItem className="hover:bg-gray-800">
                    Last 10 Days
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-800">
                    Last Month
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-800">
                    Last Year
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <BalanceChart />
            </CardContent>
          </Card>
          {/* <Card className="md:col-span-3 bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Categories</CardTitle>
              <CardDescription>Your categories</CardDescription>
            </CardHeader>
            <CardContent>
              <CategoriesList />
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-gray-800 bg-gray-950 text-gray-50 hover:bg-gray-900 hover:text-gray-50"
              >
                View All Categories
              </Button>
            </CardFooter>
          </Card> */}
          <Card className="md:col-span-3 bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Transactions</CardTitle>
              <CardDescription>
                Your 10 most recent transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentTransactions />
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-gray-800 bg-gray-950 text-gray-50 hover:bg-gray-900 hover:text-gray-50"
              >
                View All Transactions
              </Button>
            </CardFooter>
          </Card>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Monthly Expenses</CardTitle>
                <CardDescription className="text-gray-400">
                  Your expenses for this month
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-gray-950 px-2 py-1 text-sm font-medium">
                <TrendingDown className="h-4 w-4 text-rose-500" />
                <span className="text-rose-500">$2,150.00</span>
              </div>
            </CardHeader>
            <CardContent>
              <ExpensesList />
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-gray-800 bg-gray-950 text-gray-50 hover:bg-gray-900 hover:text-gray-50"
              >
                View All Expenses
              </Button>
            </CardFooter>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Monthly Income</CardTitle>
                <CardDescription className="text-gray-400">
                  Your income for this month
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-gray-950 px-2 py-1 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-500">$4,250.00</span>
              </div>
            </CardHeader>
            <CardContent>
              <IncomesList />
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-gray-800 bg-gray-950 text-gray-50 hover:bg-gray-900 hover:text-gray-50"
              >
                View All Income
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
