"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Filter, Search, TrendingUp, TrendingDown, Download, Plus, Loader2 } from "lucide-react";
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
import { useCategories } from "@/contexts/categories";
import { TransactionCard } from "@/components/transactions/transaction-card";
import { AddTransactionButton } from "@/components/add-transaction-button";

export default function TransactionsPage() {
  const { transactions, isLoading, error } = useTransactions();
  const { categories } = useCategories();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [sortBy, setSortBy] = useState<string>("date-desc");

  // Infinite scroll states
  const [displayedTransactions, setDisplayedTransactions] = useState<typeof transactions>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 10;
  const observerRef = useRef<HTMLDivElement>(null);

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    const filtered = transactions.filter((transaction) => {
      // Search filter
      if (searchTerm && !transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !transaction.categoryName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Category filter
      if (selectedCategory !== "all" && transaction.categoryId !== selectedCategory) {
        return false;
      }

      // Type filter
      if (selectedType !== "all" && transaction.transactionType !== selectedType) {
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
        filtered.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
        break;
      case "date-asc":
        filtered.sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());
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
  }, [transactions, searchTerm, selectedCategory, selectedType, dateRange, sortBy]);

  // Load more transactions function
  const loadMoreTransactions = useCallback(() => {
    setIsLoadingMore(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const newTransactions = filteredTransactions.slice(startIndex, endIndex);
      
      if (newTransactions.length > 0) {
        setDisplayedTransactions(prev => [...prev, ...newTransactions]);
        setCurrentPage(prev => prev + 1);
      }
      
      setIsLoadingMore(false);
    }, 500);
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

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isLoadingMore && !isLoading) {
          const hasMore = displayedTransactions.length < filteredTransactions.length;
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
  }, [displayedTransactions.length, filteredTransactions.length, isLoadingMore, isLoading, loadMoreTransactions]);

  // Statistics
  const stats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.transactionType === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.transactionType === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const netAmount = totalIncome - totalExpenses;
    
    return {
      totalIncome,
      totalExpenses,
      netAmount,
      transactionCount: filteredTransactions.length
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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-400">
          <p>Failed to load transactions</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
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
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-gray-400">
            View and manage all your financial transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {formatCurrency(stats.totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <TrendingDown className="h-4 w-4 mr-2" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">
              {formatCurrency(stats.totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Net Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              stats.netAmount >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              {formatCurrency(stats.netAmount)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactionCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-10 bg-gray-800 border-gray-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id!}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                  <SelectItem value="amount-desc">Amount (Highest First)</SelectItem>
                  <SelectItem value="amount-asc">Amount (Lowest First)</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="border-gray-700"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-gray-800 rounded-full animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-gray-800 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="h-6 w-20 bg-gray-800 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayedTransactions.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No transactions found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || selectedCategory !== "all" || selectedType !== "all" 
                  ? "Try adjusting your filters or search terms"
                  : "Start by adding your first transaction"
                }
              </p>
              {(searchTerm || selectedCategory !== "all" || selectedType !== "all") && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-gray-700"
                >
                  Clear Filters
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
                  className={`transform transition-all duration-300 ease-in-out ${
                    index < 10 ? 'animate-in slide-in-from-bottom-4' : ''
                  }`}
                  style={{
                    animationDelay: index < 10 ? `${index * 100}ms` : '0ms',
                  }}
                >
                  <TransactionCard transaction={transaction} />
                </div>
              ))}
            </div>

            {/* Loading More Indicator */}
            {isLoadingMore && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading more transactions...</span>
                </div>
              </div>
            )}

            {/* Load More Trigger */}
            <div
              ref={observerRef}
              className="h-4 w-full flex justify-center"
            >
              {displayedTransactions.length < filteredTransactions.length && !isLoadingMore && (
                <Button
                  variant="outline"
                  onClick={loadMoreTransactions}
                  className="border-gray-700 hover:border-gray-600"
                >
                  Load More Transactions
                </Button>
              )}
            </div>

            {/* End of List Indicator */}
            {displayedTransactions.length >= filteredTransactions.length && filteredTransactions.length > 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">You&apos;ve reached the end of the list</p>
                <p className="text-xs mt-1">
                  Showing {displayedTransactions.length} of {filteredTransactions.length} transactions
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Transaction Button */}
      <AddTransactionButton />
    </div>
  );
}