"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { 
  Plus,
  Search,
  CreditCard,
  Grid3X3,
  List,
  SortAsc,
  SortDesc
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DebtCard } from "./debt-card";
import { type Debt } from "@/lib/db/schemas/debt";
import { useDebts } from "@/contexts/debts";

interface DebtListProps {
  onAddDebt: () => void;
  onEditDebt: (debt: Debt) => void;
  onViewDebt: (debt: Debt) => void;
}

type SortField = "name" | "current_balance" | "interest_rate" | "due_date" | "created_at";
type SortDirection = "asc" | "desc";
type ViewMode = "grid" | "list";

// const debtTypeIcons = {
//   credit_card: CreditCard,
//   loan: DollarSign,
//   mortgage: Home,
//   student_loan: GraduationCap,
//   other: DollarSign,
// };

export function DebtList({ onAddDebt, onEditDebt, onViewDebt }: DebtListProps) {
  const t = useTranslations("debts");
  const { debts, isLoading, error } = useDebts();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  if (isLoading) {
    return <DebtListSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-destructive mb-4">{t("error.loadingDebts")}</p>
            <Button onClick={() => window.location.reload()}>
              {t("error.retry")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter and sort debts
  const filteredDebts = debts?.filter(debt => {
    const matchesSearch = debt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         debt.lender_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || debt.debt_type === filterType;
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && debt.is_active) ||
                         (filterStatus === "inactive" && !debt.is_active);
    
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const sortedDebts = [...filteredDebts].sort((a, b) => {
    let aValue: string | number | null = a[sortField];
    let bValue: string | number | null = b[sortField];
    
    // Handle null values
    if (aValue === null) aValue = sortDirection === "asc" ? Infinity : -Infinity;
    if (bValue === null) bValue = sortDirection === "asc" ? Infinity : -Infinity;
    
    // Convert to numbers for numeric fields
    if (sortField === "current_balance" || sortField === "interest_rate") {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }
    
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const activeDebtsCount = debts?.filter(debt => debt.is_active).length || 0;
  const totalBalance = debts?.reduce((sum, debt) => sum + debt.current_balance, 0) || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("title")}</h2>
          <p className="text-muted-foreground">
            {t("subtitle", { count: activeDebtsCount, total: formatCurrency(totalBalance) })}
          </p>
        </div>
        <Button onClick={onAddDebt} className="min-h-[44px]">
          <Plus className="h-4 w-4 mr-2" />
          {t("actions.addDebt")}
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("search.placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("filter.type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filter.allTypes")}</SelectItem>
            <SelectItem value="credit_card">{t("types.credit_card")}</SelectItem>
            <SelectItem value="loan">{t("types.loan")}</SelectItem>
            <SelectItem value="mortgage">{t("types.mortgage")}</SelectItem>
            <SelectItem value="student_loan">{t("types.student_loan")}</SelectItem>
            <SelectItem value="other">{t("types.other")}</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t("filter.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filter.allStatuses")}</SelectItem>
            <SelectItem value="active">{t("filter.active")}</SelectItem>
            <SelectItem value="inactive">{t("filter.inactive")}</SelectItem>
          </SelectContent>
        </Select>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-h-[44px]">
              {sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              <span className="ml-2">{t("sort.label")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleSort("name")}>
              {t("sort.name")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("current_balance")}>
              {t("sort.balance")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("interest_rate")}>
              {t("sort.interestRate")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("due_date")}>
              {t("sort.dueDate")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSort("created_at")}>
              {t("sort.dateAdded")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="flex bg-muted p-1 rounded-md">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">{t("stats.showing")}</div>
            <div className="text-2xl font-bold">{sortedDebts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">{t("stats.active")}</div>
            <div className="text-2xl font-bold">{activeDebtsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">{t("stats.totalBalance")}</div>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">{t("stats.avgInterest")}</div>
            <div className="text-2xl font-bold">
              {debts?.length ? 
                (debts.reduce((sum, debt) => sum + (debt.interest_rate || 0), 0) / debts.length).toFixed(1) + "%" :
                "0%"
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debt List */}
      {sortedDebts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || filterType !== "all" || filterStatus !== "all" 
                ? t("empty.noResults") 
                : t("empty.noDebts")
              }
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterType !== "all" || filterStatus !== "all" 
                ? t("empty.tryDifferentFilters") 
                : t("empty.getStarted")
              }
            </p>
            {!searchTerm && filterType === "all" && filterStatus === "all" && (
              <Button onClick={onAddDebt}>
                <Plus className="h-4 w-4 mr-2" />
                {t("actions.addFirstDebt")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "space-y-4"
        }>
          {sortedDebts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onEdit={onEditDebt}
              onView={onViewDebt}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DebtListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-28 mb-2" />
              <Skeleton className="h-3 w-full mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}