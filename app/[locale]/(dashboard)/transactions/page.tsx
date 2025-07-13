"use client";

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import {
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Download,
  Plus,
  Loader2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTransactions } from "@/contexts/transactions";
import { useTranslatedCategories } from "@/hooks/use-translated-categories";
import { TransactionCard } from "@/components/transactions/transaction-card";
import { AddTransactionButton } from "@/components/add-transaction-button";
import { EditTransactionModal } from "@/components/transactions/edit-transaction-modal";
import { UITransaction } from "@/lib/db/schemas/transaction";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

function TransactionsPageContent() {
  const { transactions, isLoading, error, mutate } = useTransactions();
  const { data: translatedCategories } = useTranslatedCategories();
  const searchParams = useSearchParams();
  const t = useTranslations("pages.transactions");

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [sortBy, setSortBy] = useState<string>("date-desc");

  // Edit modal state
  const [editingTransaction, setEditingTransaction] =
    useState<UITransaction | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Infinite scroll states
  const [displayedTransactions, setDisplayedTransactions] = useState<
    typeof transactions
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 10;
  const observerRef = useRef<HTMLDivElement>(null);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter((transaction) => {
      // Search filter
      if (
        searchTerm &&
        !transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !transaction.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) &&
        !transaction.categoryName
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Category filter
      if (
        selectedCategory !== "all" &&
        transaction.categoryId !== selectedCategory
      ) {
        return false;
      }

      // Type filter
      if (
        selectedType !== "all" &&
        transaction.transactionType !== selectedType
      ) {
        return false;
      }

      // Date range filter
      if (dateRange.from || dateRange.to) {
        const transactionDate = new Date(transaction.transactionDate);
        if (dateRange.from && transactionDate < dateRange.from) return false;
        if (dateRange.to && transactionDate > dateRange.to) return false;
      }

      return true;
    });

    // Sort transactions
    switch (sortBy) {
      case "date-desc":
        filtered.sort(
          (a, b) =>
            new Date(b.transactionDate).getTime() -
            new Date(a.transactionDate).getTime()
        );
        break;
      case "date-asc":
        filtered.sort(
          (a, b) =>
            new Date(a.transactionDate).getTime() -
            new Date(b.transactionDate).getTime()
        );
        break;
      case "amount-desc":
        filtered.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
        break;
      case "amount-asc":
        filtered.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
        break;
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return filtered;
  }, [
    transactions,
    searchTerm,
    selectedCategory,
    selectedType,
    dateRange,
    sortBy,
  ]);

  // Load more transactions function
  const loadMoreTransactions = useCallback(() => {
    setIsLoadingMore(true);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const newTransactions = filteredTransactions.slice(startIndex, endIndex);

    if (newTransactions.length > 0) {
      setDisplayedTransactions((prev) => [...prev, ...newTransactions]);
      setCurrentPage((prev) => prev + 1);
    }

    setIsLoadingMore(false);
  }, [currentPage, filteredTransactions]);

  // Reset displayed transactions when filters change
  useEffect(() => {
    setCurrentPage(1);
    const initialTransactions = filteredTransactions.slice(0, ITEMS_PER_PAGE);
    setDisplayedTransactions(initialTransactions);
    if (filteredTransactions.length > ITEMS_PER_PAGE) {
      setCurrentPage(2);
    }
  }, [filteredTransactions]);

  // Handle URL search parameters after hydration
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    if (searchFromUrl) {
      setSearchTerm(searchFromUrl);
    }
  }, [searchParams]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isLoadingMore && !isLoading) {
          const hasMore =
            displayedTransactions.length < filteredTransactions.length;
          if (hasMore) {
            loadMoreTransactions();
          }
        }
      },
      { threshold: 0.1 }
    );

    const currentObserverRef = observerRef.current;
    if (currentObserverRef) {
      observer.observe(currentObserverRef);
    }

    return () => {
      if (currentObserverRef) {
        observer.unobserve(currentObserverRef);
      }
    };
  }, [
    displayedTransactions.length,
    filteredTransactions.length,
    isLoadingMore,
    isLoading,
    loadMoreTransactions,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((t) => t.transactionType === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter((t) => t.transactionType === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netAmount = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      netAmount,
      transactionCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedType("all");
    setDateRange({ from: undefined, to: undefined });
    setSortBy("date-desc");
  };

  const handleEdit = (transaction: UITransaction) => {
    setEditingTransaction(transaction);
    setEditModalOpen(true);
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm(t("confirmDelete"))) {
      return;
    }

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("errors.deleteFailed"));
      }

      // Refresh the transactions list
      mutate();

      toast.success(t("success.transactionDeleted"));
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error(
        error instanceof Error ? error.message : t("errors.deleteFailed")
      );
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-400">
          <p>{t("errors.failedToLoad")}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            {t("errors.tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t("export")}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              {t("stats.totalIncome")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {formatCurrency(stats.totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <TrendingDown className="h-4 w-4 mr-2" />
              {t("stats.totalExpenses")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">
              {formatCurrency(stats.totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("stats.netAmount")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                stats.netAmount >= 0 ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {formatCurrency(stats.netAmount)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("stats.totalTransactions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactionCount}</div>
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            {t("filters.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("filters.search")}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("filters.searchPlaceholder")}
                  className="pl-10 bg-background border"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("filters.category")}
              </label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="bg-background border">
                  <SelectValue placeholder={t("filters.allCategories")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("filters.allCategories")}
                  </SelectItem>
                  {translatedCategories?.map((category) => (
                    <SelectItem key={category.id} value={category.id!}>
                      {category.translatedName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("filters.type")}</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-background border">
                  <SelectValue placeholder={t("filters.allTypes")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
                  <SelectItem value="income">{t("filters.income")}</SelectItem>
                  <SelectItem value="expense">
                    {t("filters.expense")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("filters.sortBy")}
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-background border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">
                    {t("filters.dateNewest")}
                  </SelectItem>
                  <SelectItem value="date-asc">
                    {t("filters.dateOldest")}
                  </SelectItem>
                  <SelectItem value="amount-desc">
                    {t("filters.amountHighest")}
                  </SelectItem>
                  <SelectItem value="amount-asc">
                    {t("filters.amountLowest")}
                  </SelectItem>
                  <SelectItem value="name-asc">
                    {t("filters.nameAZ")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="border"
            >
              {t("filters.clearFilters")}
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Transactions List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="grid gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {displayedTransactions.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t("emptyState.noTransactions")}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm ||
                selectedCategory !== "all" ||
                selectedType !== "all"
                  ? t("emptyState.tryAdjusting")
                  : t("emptyState.startAdding")}
              </p>
              {(searchTerm ||
                selectedCategory !== "all" ||
                selectedType !== "all") && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border"
                >
                  {t("filters.clearFilters")}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4">
              {displayedTransactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className={`transform transition-all duration-300 ease-in-out max-w-full ${
                    index < 10 ? "animate-in slide-in-from-bottom-4" : ""
                  }`}
                  style={{
                    animationDelay: index < 10 ? `${index * 100}ms` : "0ms",
                  }}
                >
                  <TransactionCard
                    transaction={transaction}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>

            {/* Loading More Indicator */}
            {isLoadingMore && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{t("loading.loadingMore")}</span>
                </div>
              </div>
            )}

            {/* Load More Trigger */}
            <div ref={observerRef} className="h-4 w-full flex justify-center">
              {displayedTransactions.length < filteredTransactions.length &&
                !isLoadingMore && (
                  <Button
                    variant="outline"
                    onClick={loadMoreTransactions}
                    className="border hover:border-accent"
                  >
                    {t("loading.loadMore")}
                  </Button>
                )}
            </div>

            {/* End of List Indicator */}
            {displayedTransactions.length >= filteredTransactions.length &&
              filteredTransactions.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">{t("loading.endOfList")}</p>
                  <p className="text-xs mt-1">
                    {t("loading.showing", {
                      displayed: displayedTransactions.length,
                      total: filteredTransactions.length,
                    })}
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
      {/* Add Transaction Button */}
      <AddTransactionButton />
      {/* Edit Transaction Modal */}
      <EditTransactionModal
        transaction={editingTransaction}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={() => {
          setEditingTransaction(null);
          mutate();
        }}
      />
    </div>
  );
}

// Loading component for Suspense fallback
function TransactionsPageLoading() {
  const t = useTranslations("pages.transactions");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card border">
            <CardContent className="p-6">
              <div className="h-6 w-20 bg-muted rounded animate-pulse mb-2" />
              <div className="h-8 w-24 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border">
        <CardContent className="p-6">
          <div className="h-6 w-16 bg-muted rounded animate-pulse mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main component wrapped with Suspense
export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsPageLoading />}>
      <TransactionsPageContent />
    </Suspense>
  );
}
