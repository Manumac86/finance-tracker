"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Search,
  Target,
  TrendingUp,
  Receipt,
  Repeat,
  FileDown,
  Menu,
  X,
  BarChart3,
  Users,
} from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { BudgetAlertsPanel } from "@/components/budgets/budget-alerts-panel";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/transactions?search=${encodeURIComponent(searchQuery.trim())}`
      );
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
        <DollarSign className="h-6 w-6 text-emerald-500" />
        <span>FinTrack</span>
      </Link>

      {/* Navigation Links */}
      <nav className="hidden lg:flex items-center gap-1 ml-4 xl:ml-8">
        <Link href="/dashboard">
          <Button
            variant={
              isHydrated && pathname === "/dashboard" ? "default" : "ghost"
            }
            size="sm"
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/goals">
          <Button
            variant={isHydrated && pathname === "/goals" ? "default" : "ghost"}
            size="sm"
            className="gap-2"
          >
            <Target className="h-4 w-4" />
            Goals
          </Button>
        </Link>
        <Link href="/budgets">
          <Button
            variant={
              isHydrated && pathname === "/budgets" ? "default" : "ghost"
            }
            size="sm"
            className="gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Budgets
          </Button>
        </Link>
        <Link href="/transactions">
          <Button
            variant={
              isHydrated && pathname === "/transactions" ? "default" : "ghost"
            }
            size="sm"
            className="gap-2"
          >
            <Receipt className="h-4 w-4" />
            Transactions
          </Button>
        </Link>
        <Link href="/recurring">
          <Button
            variant={
              isHydrated && pathname === "/recurring" ? "default" : "ghost"
            }
            size="sm"
            className="gap-2"
          >
            <Repeat className="h-4 w-4" />
            Recurring
          </Button>
        </Link>
        <Link href="/transactions/manage">
          <Button
            variant={
              isHydrated && pathname === "/transactions/manage"
                ? "default"
                : "ghost"
            }
            size="sm"
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Manage
          </Button>
        </Link>
        <Link href="/reports/export">
          <Button
            variant={
              isHydrated && pathname === "/reports/export" ? "default" : "ghost"
            }
            size="sm"
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Reports
          </Button>
        </Link>
        <Link href="/family">
          <Button
            variant={isHydrated && pathname === "/family" ? "default" : "ghost"}
            size="sm"
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Family
          </Button>
        </Link>
      </nav>

      {/* Tablet Navigation - Condensed */}
      <nav className="hidden md:flex lg:hidden items-center gap-1 ml-4">
        <Link href="/dashboard">
          <Button
            variant={
              isHydrated && pathname === "/dashboard" ? "default" : "ghost"
            }
            size="sm"
            className="gap-1 px-2"
            title="Dashboard"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden xl:inline">Dashboard</span>
          </Button>
        </Link>
        <Link href="/transactions">
          <Button
            variant={
              isHydrated && pathname === "/transactions" ? "default" : "ghost"
            }
            size="sm"
            className="gap-1 px-2"
            title="Transactions"
          >
            <Receipt className="h-4 w-4" />
            <span className="hidden xl:inline">Transactions</span>
          </Button>
        </Link>
        <Link href="/budgets">
          <Button
            variant={pathname === "/budgets" ? "default" : "ghost"}
            size="sm"
            className="gap-1 px-2"
            title="Budgets"
          >
            <DollarSign className="h-4 w-4" />
            <span className="hidden xl:inline">Budgets</span>
          </Button>
        </Link>
        <Link href="/goals">
          <Button
            variant={isHydrated && pathname === "/goals" ? "default" : "ghost"}
            size="sm"
            className="gap-1 px-2"
            title="Goals"
          >
            <Target className="h-4 w-4" />
            <span className="hidden xl:inline">Goals</span>
          </Button>
        </Link>
      </nav>

      {/* Tablet/Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      <div className="ml-auto flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative hidden xl:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 xl:w-64 rounded-lg bg-gray-900 pl-8 text-sm ring-offset-gray-950 placeholder:text-gray-500 focus-visible:ring-gray-800"
          />
        </form>
        <BudgetAlertsPanel />
        <UserButton
          afterSignOutUrl="/signin"
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 sm:w-10 sm:h-10",
            },
          }}
        />
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 z-50 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm lg:hidden">
          <nav className="flex flex-col space-y-1 p-4">
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={
                  isHydrated && pathname === "/dashboard" ? "default" : "ghost"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/goals" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={
                  isHydrated && pathname === "/goals" ? "default" : "ghost"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Target className="h-4 w-4" />
                Goals
              </Button>
            </Link>
            <Link href="/budgets" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={pathname === "/budgets" ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Budgets
              </Button>
            </Link>
            <Link href="/transactions" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={
                  isHydrated && pathname === "/transactions"
                    ? "default"
                    : "ghost"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Receipt className="h-4 w-4" />
                Transactions
              </Button>
            </Link>
            <Link href="/recurring" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={
                  isHydrated && pathname === "/recurring" ? "default" : "ghost"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Repeat className="h-4 w-4" />
                Recurring
              </Button>
            </Link>
            <Link
              href="/transactions/manage"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Button
                variant={
                  isHydrated && pathname === "/transactions/manage"
                    ? "default"
                    : "ghost"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Manage
              </Button>
            </Link>
            <Link
              href="/reports/export"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Button
                variant={
                  isHydrated && pathname === "/reports/export"
                    ? "default"
                    : "ghost"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <FileDown className="h-4 w-4" />
                Reports
              </Button>
            </Link>
            <Link href="/family" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={
                  isHydrated && pathname === "/family" ? "default" : "ghost"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Users className="h-4 w-4" />
                Family
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
