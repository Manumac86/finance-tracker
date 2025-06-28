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
  Building2,
} from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { usePathname, useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { BudgetAlertsPanel } from "@/components/budgets/budget-alerts-panel";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
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
        `/${locale}/transactions?search=${encodeURIComponent(searchQuery.trim())}`
      );
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur-sm">
      <Link href={`/${locale}/dashboard`} className="flex items-center gap-2 font-semibold">
        <DollarSign className="h-6 w-6 text-primary" />
        <span>{tCommon('appName')}</span>
      </Link>

      {/* Navigation Links */}
      <nav className="hidden lg:flex items-center gap-1 ml-4 xl:ml-8">
        <Link href={`/${locale}/dashboard`}>
          <Button
            variant={
              isHydrated && pathname === `/${locale}/dashboard` ? "default" : "ghost"
            }
            size="sm"
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            {t('dashboard')}
          </Button>
        </Link>
        <Link href={`/${locale}/goals`}>
          <Button
            variant={isHydrated && pathname === `/${locale}/goals` ? "default" : "ghost"}
            size="sm"
            className="gap-2"
          >
            <Target className="h-4 w-4" />
            {t('goals')}
          </Button>
        </Link>
        <Link href={`/${locale}/budgets`}>
          <Button
            variant={
              isHydrated && pathname === `/${locale}/budgets` ? "default" : "ghost"
            }
            size="sm"
            className="gap-2"
          >
            <DollarSign className="h-4 w-4" />
            {t('budgets')}
          </Button>
        </Link>
        <Link href={`/${locale}/transactions`}>
          <Button
            variant={
              isHydrated && pathname === `/${locale}/transactions` ? "default" : "ghost"
            }
            size="sm"
            className="gap-2"
          >
            <Receipt className="h-4 w-4" />
            {t('transactions')}
          </Button>
        </Link>
        <Link href={`/${locale}/recurring`}>
          <Button
            variant={
              isHydrated && pathname === `/${locale}/recurring` ? "default" : "ghost"
            }
            size="sm"
            className="gap-2"
          >
            <Repeat className="h-4 w-4" />
            {t('recurring')}
          </Button>
        </Link>
        <Link href={`/${locale}/transactions/manage`}>
          <Button
            variant={
              isHydrated && pathname === `/${locale}/transactions/manage`
                ? "default"
                : "ghost"
            }
            size="sm"
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {t('manage')}
          </Button>
        </Link>
        <Link href={`/${locale}/reports/export`}>
          <Button
            variant={
              isHydrated && pathname === `/${locale}/reports/export` ? "default" : "ghost"
            }
            size="sm"
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            {t('reports')}
          </Button>
        </Link>
        <Link href={`/${locale}/banking`}>
          <Button
            variant={isHydrated && pathname === `/${locale}/banking` ? "default" : "ghost"}
            size="sm"
            className="gap-2"
          >
            <Building2 className="h-4 w-4" />
            {t('banking')}
          </Button>
        </Link>
        <Link href={`/${locale}/family`}>
          <Button
            variant={isHydrated && pathname === `/${locale}/family` ? "default" : "ghost"}
            size="sm"
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            {t('family')}
          </Button>
        </Link>
      </nav>

      {/* Tablet Navigation - Condensed */}
      <nav className="hidden md:flex lg:hidden items-center gap-1 ml-4">
        <Link href={`/${locale}/dashboard`}>
          <Button
            variant={
              isHydrated && pathname === `/${locale}/dashboard` ? "default" : "ghost"
            }
            size="sm"
            className="gap-1 px-2"
            title={t('dashboard')}
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden xl:inline">{t('dashboard')}</span>
          </Button>
        </Link>
        <Link href={`/${locale}/transactions`}>
          <Button
            variant={
              isHydrated && pathname === `/${locale}/transactions` ? "default" : "ghost"
            }
            size="sm"
            className="gap-1 px-2"
            title={t('transactions')}
          >
            <Receipt className="h-4 w-4" />
            <span className="hidden xl:inline">{t('transactions')}</span>
          </Button>
        </Link>
        <Link href={`/${locale}/budgets`}>
          <Button
            variant={pathname === `/${locale}/budgets` ? "default" : "ghost"}
            size="sm"
            className="gap-1 px-2"
            title={t('budgets')}
          >
            <DollarSign className="h-4 w-4" />
            <span className="hidden xl:inline">{t('budgets')}</span>
          </Button>
        </Link>
        <Link href={`/${locale}/goals`}>
          <Button
            variant={isHydrated && pathname === `/${locale}/goals` ? "default" : "ghost"}
            size="sm"
            className="gap-1 px-2"
            title={t('goals')}
          >
            <Target className="h-4 w-4" />
            <span className="hidden xl:inline">{t('goals')}</span>
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
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 xl:w-64 rounded-lg bg-input pl-8 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring"
          />
        </form>
        <BudgetAlertsPanel />
        <ThemeSwitcher />
        <LanguageSwitcher />
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
        <div className="absolute top-16 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur-sm lg:hidden">
          <nav className="flex flex-col space-y-1 p-4">
            <Link href={`/${locale}/dashboard`} onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={
                  isHydrated && pathname === `/${locale}/dashboard` ? "default" : "ghost"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                {t('dashboard')}
              </Button>
            </Link>
            <Link href={`/${locale}/goals`} onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={
                  isHydrated && pathname === `/${locale}/goals` ? "default" : "ghost"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Target className="h-4 w-4" />
                {t('goals')}
              </Button>
            </Link>
            <Link href={`/${locale}/budgets`} onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={pathname === `/${locale}/budgets` ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start gap-2"
              >
                <DollarSign className="h-4 w-4" />
                {t('budgets')}
              </Button>
            </Link>
            <Link href={`/${locale}/transactions`} onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={
                  isHydrated && pathname === `/${locale}/transactions`
                    ? "default"
                    : "ghost"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Receipt className="h-4 w-4" />
                {t('transactions')}
              </Button>
            </Link>
            <Link href={`/${locale}/recurring`} onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={
                  isHydrated && pathname === `/${locale}/recurring` ? "default" : "ghost"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Repeat className="h-4 w-4" />
                {t('recurring')}
              </Button>
            </Link>
            <Link
              href={`/${locale}/transactions/manage`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Button
                variant={
                  isHydrated && pathname === `/${locale}/transactions/manage`
                    ? "default"
                    : "ghost"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                {t('manage')}
              </Button>
            </Link>
            <Link
              href={`/${locale}/reports/export`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Button
                variant={
                  isHydrated && pathname === `/${locale}/reports/export`
                    ? "default"
                    : "ghost"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <FileDown className="h-4 w-4" />
                {t('reports')}
              </Button>
            </Link>
            <Link href={`/${locale}/banking`} onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={
                  isHydrated && pathname === `/${locale}/banking` ? "default" : "ghost"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Building2 className="h-4 w-4" />
                {t('banking')}
              </Button>
            </Link>
            <Link href={`/${locale}/family`} onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={
                  isHydrated && pathname === `/${locale}/family` ? "default" : "ghost"
                }
                size="sm"
                className="w-full justify-start gap-2"
              >
                <Users className="h-4 w-4" />
                {t('family')}
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
