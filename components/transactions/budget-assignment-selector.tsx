"use client";

import { Calculator } from "lucide-react";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { UIBudget } from "@/lib/db/schemas/budget";
import { useTranslations } from "next-intl";

interface BudgetAssignmentSelectorProps {
  budgets: UIBudget[];
  transactionType: "income" | "expense";
  selectedBudgetId: string | null;
  onBudgetSelect: (budgetId: string | null) => void;
  assignmentNotes: string;
  onNotesChange: (notes: string) => void;
  disabled?: boolean;
}

export function BudgetAssignmentSelector({
  budgets,
  transactionType,
  selectedBudgetId,
  onBudgetSelect,
  assignmentNotes,
  onNotesChange,
  disabled = false,
}: BudgetAssignmentSelectorProps) {
  const t = useTranslations("budgetAssignment");

  // Don't show for income transactions
  if (transactionType !== "expense") {
    return null;
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          {t("manualAssignment")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Budget Selection */}
        <div className="space-y-2">
          <Label className="text-sm">{t("overrideBudget")}</Label>
          <Select
            value={selectedBudgetId || "auto"}
            onValueChange={(value) => onBudgetSelect(value === "auto" ? null : value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectBudget")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                {t("automaticAssignment")}
              </SelectItem>
              {budgets.map((budget) => (
                <SelectItem key={budget.id} value={budget.id!}>
                  {budget.name}
                  {budget.budgetType === "category" && budget.categoryId && (
                    <span className="text-muted-foreground text-xs ml-2">
                      (Category)
                    </span>
                  )}
                  {budget.budgetType === "total" && (
                    <span className="text-muted-foreground text-xs ml-2">
                      (Total)
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t("overrideDescription")}
          </p>
        </div>

        {/* Assignment Notes - only show when a budget is selected */}
        {selectedBudgetId && (
          <div className="space-y-2">
            <Label className="text-sm">{t("assignmentReason")}</Label>
            <Textarea
              value={assignmentNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              disabled={disabled}
              placeholder={t("notesPlaceholder")}
              className="h-20 text-sm resize-none"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}