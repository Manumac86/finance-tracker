"use client";

import { useState } from "react";
import { X, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/contexts/categories";
import { useTransactions } from "@/contexts/transactions";
import { useBudgetAlerts } from "@/contexts/budget-alerts";
import { suggestCategory } from "@/lib/utils/smart-suggestions";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface BulkTransaction {
  id: string;
  name: string;
  amount: string;
  transactionType: "income" | "expense";
  categoryId: string;
  description?: string;
  date: string;
}

interface BulkTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkTransactionModal({
  open,
  onOpenChange,
}: BulkTransactionModalProps) {
  const { data: categories } = useCategories();
  const { mutate } = useTransactions();
  const { checkBudgetAlerts } = useBudgetAlerts();
  const [transactions, setTransactions] = useState<BulkTransaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [textInput, setTextInput] = useState("");
  const t = useTranslations("bulkTransactions");
  const tCommon = useTranslations("common");

  // Add a new empty transaction
  const addTransaction = () => {
    const newTransaction: BulkTransaction = {
      id: `bulk_${Date.now()}_${Math.random()}`,
      name: "",
      amount: "",
      transactionType: "expense",
      categoryId: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    };
    setTransactions([...transactions, newTransaction]);
  };

  // Remove a transaction
  const removeTransaction = (id: string) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  // Update a transaction field
  const updateTransaction = (
    id: string,
    field: keyof BulkTransaction,
    value: string
  ) => {
    setTransactions(
      transactions.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  // Parse text input for bulk transactions
  const parseTextInput = () => {
    if (!textInput.trim()) return;

    const lines = textInput.trim().split("\n");
    const newTransactions: BulkTransaction[] = [];

    lines.forEach((line, index) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const amount =
          parts
            .find((part) => /^\$?[\d.,]+$/.test(part))
            ?.replace(/[$,]/g, "") || "";
        const name = parts
          .filter(
            (part) =>
              !/^\$?[\d.,]+$/.test(part) &&
              !["expense", "income"].includes(part.toLowerCase())
          )
          .join(" ");
        const type = parts.some((part) => part.toLowerCase() === "income")
          ? "income"
          : "expense";

        // Auto-suggest category
        const suggestedCategory = suggestCategory(name, categories || []);

        const transaction: BulkTransaction = {
          id: `parsed_${Date.now()}_${index}`,
          name: name || `Transaction ${index + 1}`,
          amount,
          transactionType: type,
          categoryId: suggestedCategory?.id || "",
          description: "",
          date: new Date().toISOString().split("T")[0],
        };

        newTransactions.push(transaction);
      }
    });

    setTransactions([...transactions, ...newTransactions]);
    setTextInput("");
    toast.success(t("addedTransactions", { count: newTransactions.length }));
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = [
      "Name,Amount,Type,Category,Description,Date",
      "Grocery Store,45.50,expense,Food & Drink,Weekly groceries,2024-01-15",
      "Salary,3000.00,income,Income,Monthly salary,2024-01-15",
      "Gas Station,35.00,expense,Transportation,Car fuel,2024-01-14",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_transactions_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle CSV file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").slice(1); // Skip header
      const newTransactions: BulkTransaction[] = [];

      lines.forEach((line, index) => {
        const [name, amount, type, categoryName, description, date] =
          line.split(",");
        if (name && amount) {
          // Find category by name
          const category = categories?.find(
            (cat) =>
              cat.name.toLowerCase() === categoryName?.toLowerCase().trim()
          );

          const transaction: BulkTransaction = {
            id: `csv_${Date.now()}_${index}`,
            name: name.trim(),
            amount: amount.trim(),
            transactionType: (type?.toLowerCase().trim() === "income"
              ? "income"
              : "expense") as "income" | "expense",
            categoryId: category?.id || "",
            description: description?.trim() || "",
            date: date?.trim() || new Date().toISOString().split("T")[0],
          };

          newTransactions.push(transaction);
        }
      });

      setTransactions([...transactions, ...newTransactions]);
      toast.success(t("importedFromCsv", { count: newTransactions.length }));
    };

    reader.readAsText(file);
    event.target.value = ""; // Reset file input
  };

  // Submit all transactions
  const handleSubmit = async () => {
    if (transactions.length === 0) {
      toast.error(t("addAtLeastOne"));
      return;
    }

    // Validate all transactions
    const invalidTransactions = transactions.filter(
      (t) =>
        !t.name.trim() ||
        !t.amount ||
        parseFloat(t.amount) <= 0 ||
        !t.categoryId
    );

    if (invalidTransactions.length > 0) {
      toast.error(
        t("missingInvalidData", { count: invalidTransactions.length })
      );
      return;
    }

    setIsSubmitting(true);

    try {
      let createdCount = 0;
      let failedCount = 0;

      for (const transaction of transactions) {
        try {
          const transactionData = {
            amount: parseFloat(transaction.amount),
            transactionType: transaction.transactionType,
            name: transaction.name.trim(),
            description: transaction.description?.trim() || undefined,
            categoryId: transaction.categoryId,
            transactionDate: new Date(transaction.date).toISOString(),
          };

          const response = await fetch("/api/transactions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(transactionData),
          });

          if (response.ok) {
            const result = await response.json();

            // Check for budget alerts (only for expenses)
            if (
              transaction.transactionType === "expense" &&
              result.transaction
            ) {
              await checkBudgetAlerts(result.transaction);
            }

            createdCount++;
          } else {
            failedCount++;
          }
        } catch {
          failedCount++;
        }
      }

      // Refresh the transactions list
      mutate();

      if (createdCount > 0) {
        toast.success(t("successfullyCreated", { count: createdCount }));
      }

      if (failedCount > 0) {
        toast.error(t("failedToCreate", { count: failedCount }));
      }

      // Close modal and reset if all succeeded
      if (failedCount === 0) {
        setTransactions([]);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating bulk transactions:", error);
      toast.error("Failed to create transactions");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTransactions([]);
    setTextInput("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-800 text-gray-50">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {t("subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Import Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t("quickTextEntry")}</Label>
              <Textarea
                placeholder="Grocery Store $45.50&#10;Salary $3000 income&#10;Gas Station $35"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-50 h-20"
              />
              <Button
                type="button"
                size="sm"
                onClick={parseTextInput}
                disabled={!textInput.trim()}
                className="w-full"
              >
                {t("parseText")}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>{t("csvUpload")}</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="bg-gray-800 border-gray-700 text-gray-50"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={downloadTemplate}
                  className="w-full border-gray-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t("template")}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("manualEntry")}</Label>
              <Button
                type="button"
                onClick={addTransaction}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("addTransaction")}
              </Button>
            </div>
          </div>

          {/* Transaction List */}
          {transactions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {t("transactions")} ({transactions.length})
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setTransactions([])}
                  className="border-gray-700"
                >
                  {t("clearAll")}
                </Button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="grid grid-cols-6 gap-2 p-3 bg-gray-800 rounded-lg"
                  >
                    <Input
                      placeholder={t("name")}
                      value={transaction.name}
                      onChange={(e) =>
                        updateTransaction(
                          transaction.id,
                          "name",
                          e.target.value
                        )
                      }
                      className="bg-gray-700 border-gray-600 text-gray-50"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      value={transaction.amount}
                      onChange={(e) =>
                        updateTransaction(
                          transaction.id,
                          "amount",
                          e.target.value
                        )
                      }
                      className="bg-gray-700 border-gray-600 text-gray-50"
                    />
                    <select
                      value={transaction.transactionType}
                      onChange={(e) =>
                        updateTransaction(
                          transaction.id,
                          "transactionType",
                          e.target.value
                        )
                      }
                      className="bg-gray-700 border-gray-600 text-gray-50 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="expense">{t("expense")}</option>
                      <option value="income">{t("income")}</option>
                    </select>
                    <select
                      value={transaction.categoryId}
                      onChange={(e) =>
                        updateTransaction(
                          transaction.id,
                          "categoryId",
                          e.target.value
                        )
                      }
                      className="bg-gray-700 border-gray-600 text-gray-50 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">{t("selectCategory")}</option>
                      {categories?.map((cat) => (
                        <option
                          key={cat.id || cat.name}
                          value={cat.id || cat.name}
                        >
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="date"
                      value={transaction.date}
                      onChange={(e) =>
                        updateTransaction(
                          transaction.id,
                          "date",
                          e.target.value
                        )
                      }
                      className="bg-gray-700 border-gray-600 text-gray-50"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeTransaction(transaction.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 bg-gray-800 text-white hover:text-rose-600"
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || transactions.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting
              ? t("creating")
              : t("createTransactions", { count: transactions.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
