"use client";

import { useState } from "react";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UITransaction } from "@/lib/db/schemas/transaction";
import { getCategoryIcon } from "@/lib/utils/icons";
import { useTranslations } from "next-intl";
import {
  useTranslatedCategories,
  getTranslatedCategoryName,
} from "@/hooks/use-translated-categories";
import { formatTime } from "@/lib/utils/dates";
import { formatCurrency } from "@/lib/utils/currencies";

interface TransactionCardProps {
  transaction: UITransaction;
  onEdit?: (transaction: UITransaction) => void;
  onDelete?: (transactionId: string) => void;
}

export function TransactionCard({
  transaction,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const t = useTranslations("transactionCard");
  const { data: translatedCategories } = useTranslatedCategories();

  // Get translated category name
  const categoryName = translatedCategories
    ? getTranslatedCategoryName(translatedCategories, transaction.categoryId)
    : transaction.categoryName;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t("today");
    
    // Handle future dates
    if (diffDays < 0) {
      const futureDays = Math.abs(diffDays);
      if (futureDays === 1) return t("tomorrow");
      if (futureDays < 7) return t("inDays", { days: futureDays });
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
    
    // Handle past dates
    if (diffDays === 1) return t("yesterday");
    if (diffDays < 7) return t("daysAgo", { days: diffDays });
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <Card
      className={`group bg-card border-border transition-all duration-200 hover:border-accent hover:shadow-lg py-4 ${
        isHovered ? "transform hover:scale-101" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit && onEdit(transaction)}
    >
      <CardContent className="px-4">
        <div className="flex items-center justify-between min-h-16">
          <div className="flex items-center gap-4">
            {/* Category Icon */}
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                transaction.transactionType === "income"
                  ? "bg-emerald-500/20 text-emerald-500"
                  : "bg-rose-500/20 text-rose-500"
              }`}
            >
              {getCategoryIcon(transaction.categoryIcon)}
            </div>

            {/* Transaction Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{transaction.name}</h3>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    transaction.transactionType === "income"
                      ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                      : "border-rose-500/30 text-rose-400 bg-rose-500/10"
                  }`}
                >
                  {transaction.transactionType === "income"
                    ? t("income")
                    : t("expense")}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-muted-foreground">{categoryName}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {formatDate(transaction.transactionDate)}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {formatTime(transaction.transactionDate)}
                </span>
              </div>

              {transaction.description && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {transaction.description}
                </p>
              )}
            </div>
          </div>

          {/* Amount and Actions */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div
                className={`text-xl font-bold ${
                  transaction.transactionType === "income"
                    ? "text-emerald-500"
                    : "text-rose-500"
                }`}
              >
                {formatCurrency(
                  transaction.amount,
                  transaction.transactionType
                )}
              </div>
            </div>

            {/* Actions Dropdown */}
            {(onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover border">
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={() => onEdit(transaction)}
                      className="text-foreground hover:text-foreground hover:bg-accent"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {t("edit")}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(transaction.id!)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("delete")}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
