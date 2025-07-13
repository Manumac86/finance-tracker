"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { CalendarIcon, Plus, Mic, MicOff, X, Download } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCategories } from "@/contexts/categories";
import { useTranslatedCategories } from "@/hooks/use-translated-categories";
import { useTransactions } from "@/contexts/transactions";
import { useBudgetAlerts } from "@/contexts/budget-alerts";
import { useAccounts } from "@/contexts/accounts";
import {
  suggestCategory,
  suggestMerchant,
  getQuickMerchantSuggestions,
} from "@/lib/utils/smart-suggestions";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { BudgetImpactPreview } from "@/components/budgets/budget-impact-preview";
import { BudgetAssignmentSelector } from "@/components/transactions/budget-assignment-selector";
import { UIBudget } from "@/lib/db/schemas/budget";
import useSWR from "swr";

interface BulkTransaction {
  id: string;
  name: string;
  amount: string;
  transactionType: "income" | "expense";
  categoryId: string;
  accountId?: string;
  description?: string;
  date: string;
}

export function AddTransactionButton() {
  const { data: categories } = useCategories();
  const { data: translatedCategories } = useTranslatedCategories();
  const { transactions, mutate } = useTransactions();
  const { checkBudgetAlerts } = useBudgetAlerts();
  const { accounts } = useAccounts();
  const tModals = useTranslations("modals");
  const tForms = useTranslations("forms");
  const tStatus = useTranslations("status");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [transactionType, setTransactionType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("none");
  const [date, setDate] = useState<Date>();
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [merchantSuggestions, setMerchantSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [activeTab, setActiveTab] = useState("single");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [budgetAssignmentNotes, setBudgetAssignmentNotes] = useState("");

  // Fetch budgets for impact preview
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data: budgetData } = useSWR<{ budgets: UIBudget[] }>(
    "/api/budgets",
    fetcher
  );
  const budgets = budgetData?.budgets || [];

  // Bulk transaction states
  const [bulkTransactions, setBulkTransactions] = useState<BulkTransaction[]>(
    []
  );
  const [textInput, setTextInput] = useState("");

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => {
          setIsListening(false);
          toast.error("Voice recognition failed. Please try again.");
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setDescription((prev) =>
            prev ? `${prev} ${transcript}` : transcript
          );
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Voice recognition handlers
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Transaction name is required");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    if (!category) {
      toast.error("Please select a category");
      return;
    }

    setIsSubmitting(true);

    try {
      const transactionData = {
        amount: parseFloat(amount),
        transactionType: transactionType as "income" | "expense",
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: category,
        accountId: account && account !== "none" ? account : undefined,
        transactionDate: (date || new Date()).toISOString(),
      };

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create transaction");
      }

      const result = await response.json();

      // Create budget assignment if manually selected
      if (selectedBudgetId && result.transaction) {
        try {
          await fetch("/api/transaction-budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transactionId: result.transaction.id,
              budgetId: selectedBudgetId,
              assignedAmount: parseFloat(amount),
              notes: budgetAssignmentNotes,
            }),
          });
        } catch (error) {
          console.error("Failed to create budget assignment:", error);
        }
      }

      // Check for budget alerts (only for expenses)
      if (transactionType === "expense" && result.transaction) {
        await checkBudgetAlerts(result.transaction);
      }

      // Refresh the transactions list
      mutate();

      // Show success message
      toast.success(
        `${
          transactionType === "income" ? "Income" : "Expense"
        } added successfully!`
      );

      // Reset form and close modal
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create transaction"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTransactionType("expense");
    setAmount("");
    setName("");
    setCategory("");
    setAccount("none");
    setDate(undefined);
    setDescription("");
    setMerchantSuggestions([]);
    setShowSuggestions(false);
    setBulkTransactions([]);
    setTextInput("");
    setActiveTab("single");
    setSelectedBudgetId(null);
    setBudgetAssignmentNotes("");
    if (isListening) {
      stopListening();
    }
  };

  // Handle merchant name changes and provide suggestions
  const handleNameChange = (value: string) => {
    setName(value);

    if (value.length >= 2) {
      const suggestions = suggestMerchant(value, transactions);
      setMerchantSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);

      // Auto-suggest category based on merchant name
      if (!category && value.length >= 3) {
        const suggestedCategory = suggestCategory(value, categories || []);
        if (suggestedCategory?.id) {
          setCategory(suggestedCategory.id);
        }
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle category changes and provide merchant suggestions
  const handleCategoryChange = (categoryId: string) => {
    setCategory(categoryId);

    // Provide merchant suggestions based on category
    const selectedCategory = categories?.find((cat) => cat.id === categoryId);
    if (selectedCategory && !name) {
      const quickSuggestions = getQuickMerchantSuggestions(
        selectedCategory.name
      );
      setMerchantSuggestions(quickSuggestions);
      setShowSuggestions(true);
    }
  };

  // Bulk transaction functions
  const addBulkTransaction = () => {
    const newTransaction: BulkTransaction = {
      id: `bulk_${Date.now()}_${Math.random()}`,
      name: "",
      amount: "",
      transactionType: "expense",
      categoryId: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    };
    setBulkTransactions([...bulkTransactions, newTransaction]);
  };

  const removeBulkTransaction = (id: string) => {
    setBulkTransactions(bulkTransactions.filter((t) => t.id !== id));
  };

  const updateBulkTransaction = (
    id: string,
    field: keyof BulkTransaction,
    value: string
  ) => {
    setBulkTransactions(
      bulkTransactions.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

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

    setBulkTransactions([...bulkTransactions, ...newTransactions]);
    setTextInput("");
    toast.success(`Added ${newTransactions.length} transactions`);
  };

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").slice(1);
      const newTransactions: BulkTransaction[] = [];

      lines.forEach((line, index) => {
        const [name, amount, type, categoryName, description, date] =
          line.split(",");
        if (name && amount) {
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

      setBulkTransactions([...bulkTransactions, ...newTransactions]);
      toast.success(`Imported ${newTransactions.length} transactions from CSV`);
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const handleBulkSubmit = async () => {
    if (bulkTransactions.length === 0) {
      toast.error("Add at least one transaction");
      return;
    }

    const invalidTransactions = bulkTransactions.filter(
      (t) =>
        !t.name.trim() ||
        !t.amount ||
        parseFloat(t.amount) <= 0 ||
        !t.categoryId
    );

    if (invalidTransactions.length > 0) {
      toast.error(
        `${invalidTransactions.length} transactions have missing or invalid data`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      let createdCount = 0;
      let failedCount = 0;

      for (const transaction of bulkTransactions) {
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

      mutate();

      if (createdCount > 0) {
        toast.success(`Successfully created ${createdCount} transactions`);
      }

      if (failedCount > 0) {
        toast.error(`Failed to create ${failedCount} transactions`);
      }

      if (failedCount === 0) {
        resetForm();
        setOpen(false);
      }
    } catch (error) {
      console.error("Error creating bulk transactions:", error);
      toast.error("Failed to create transactions");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setOpen(true)}
          size="lg"
          className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-4 border-border"
          data-testid="floating-add-transaction-button"
        >
          <Plus className="h-6 w-6" style={{ width: 36, height: 36 }} />
          <span className="sr-only">{tModals("addTransaction")}</span>
        </Button>
      </div>

      {/* Transaction Modal */}
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] p-0 flex flex-col">
          <div className="p-6 border-b">
            <DialogTitle>{tModals("addTransaction")}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add single transactions or import multiple transactions at once.
            </DialogDescription>
          </div>

          <div className="flex-1 p-6 overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="single">
                  {tModals("singleTransaction")}
                </TabsTrigger>
                <TabsTrigger value="bulk">{tModals("bulkImport")}</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="flex-1 flex flex-col mt-0">
                <form
                  id="transaction-form"
                  onSubmit={handleSubmit}
                  className="h-full flex flex-col"
                >
                  <div
                    className="flex-1 overflow-y-auto pr-2"
                    style={{ maxHeight: "calc(90vh - 300px)" }}
                  >
                    <div className="grid gap-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="transaction-type">
                          {tForms("transactionType")}
                        </Label>
                        <RadioGroup
                          id="transaction-type"
                          value={transactionType}
                          onValueChange={setTransactionType}
                          className="flex space-x-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="expense"
                              id="expense"
                              className="text-rose-500"
                            />
                            <Label htmlFor="expense" className="font-normal">
                              {tForms("expense")}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem
                              value="income"
                              id="income"
                              className="text-emerald-500"
                            />
                            <Label htmlFor="income" className="font-normal">
                              {tForms("income")}
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2 relative">
                        <Label htmlFor="name">
                          {tForms("transactionName")}
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder={tForms("transactionNamePlaceholder")}
                          className=""
                          value={name}
                          onChange={(e) => handleNameChange(e.target.value)}
                          onFocus={() => {
                            if (merchantSuggestions.length > 0) {
                              setShowSuggestions(true);
                            }
                          }}
                          onBlur={() => {
                            // Delay hiding suggestions to allow clicks
                            setTimeout(() => setShowSuggestions(false), 200);
                          }}
                          required
                        />

                        {/* Merchant Suggestions Dropdown */}
                        {showSuggestions && merchantSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg">
                            {merchantSuggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                className="px-3 py-2 cursor-pointer hover:bg-accent text-sm"
                                onClick={() => {
                                  setName(suggestion);
                                  setShowSuggestions(false);

                                  // Auto-suggest category for this merchant
                                  if (!category) {
                                    const suggestedCategory = suggestCategory(
                                      suggestion,
                                      categories || []
                                    );
                                    if (suggestedCategory?.id) {
                                      setCategory(suggestedCategory.id);
                                    }
                                  }
                                }}
                              >
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount">{tForms("amount")}</Label>
                        <div className="relative flex items-center justify-center">
                          <span className="absolute left-3 text-muted-foreground">
                            $
                          </span>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder={tForms("amountPlaceholder")}
                            className="pl-8"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">{tForms("category")}</Label>
                        <Select
                          value={category}
                          onValueChange={handleCategoryChange}
                          required
                        >
                          <SelectTrigger id="category" className="">
                            <SelectValue
                              placeholder={tForms("selectCategory")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {translatedCategories?.map((cat) => (
                              <SelectItem
                                key={cat.id}
                                value={cat.id || cat.name}
                              >
                                {cat.translatedName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="account">Account (Optional)</Label>
                        <Select
                          value={account}
                          onValueChange={setAccount}
                        >
                          <SelectTrigger id="account">
                            <SelectValue placeholder="Select account (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No account selected</SelectItem>
                            {accounts?.map((acc) => (
                              <SelectItem
                                key={acc.id}
                                value={acc.id || "none"}
                              >
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: acc.color }}
                                  />
                                  <span>{acc.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    ({acc.accountType})
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date">{tForms("date")}</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? format(date, "PPP") : "Select a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={setDate}
                              initialFocus
                              className=""
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">{tForms("notes")}</Label>
                        <div className="relative">
                          <Textarea
                            id="description"
                            placeholder={tForms("descriptionPlaceholder")}
                            className="pr-12"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                          />
                          {speechSupported && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className={`absolute top-2 right-2 h-8 w-8 p-0 ${
                                isListening
                                  ? "text-red-500 hover:text-red-600"
                                  : "text-muted-foreground hover:text-muted-foreground/80"
                              }`}
                              onClick={
                                isListening ? stopListening : startListening
                              }
                              disabled={isSubmitting}
                            >
                              {isListening ? (
                                <MicOff className="h-4 w-4" />
                              ) : (
                                <Mic className="h-4 w-4" />
                              )}
                              <span className="sr-only">
                                {isListening
                                  ? "Stop voice input"
                                  : tForms("voiceInput")}
                              </span>
                            </Button>
                          )}
                        </div>
                        {isListening && (
                          <p className="text-sm text-blue-400">
                            🎤 {tStatus("listeningVoice")}
                          </p>
                        )}
                      </div>

                      {/* Budget Assignment Selector */}
                      {transactionType === "expense" &&
                        amount &&
                        parseFloat(amount) > 0 &&
                        budgets.length > 0 && (
                          <BudgetAssignmentSelector
                            budgets={budgets}
                            transactionType={
                              transactionType as "expense" | "income"
                            }
                            selectedBudgetId={selectedBudgetId}
                            onBudgetSelect={setSelectedBudgetId}
                            assignmentNotes={budgetAssignmentNotes}
                            onNotesChange={setBudgetAssignmentNotes}
                          />
                        )}

                      {/* Budget Impact Preview */}
                      {transactionType === "expense" &&
                        amount &&
                        parseFloat(amount) > 0 &&
                        category &&
                        budgets.length > 0 && (
                          <BudgetImpactPreview
                            budgets={
                              selectedBudgetId
                                ? budgets.filter(
                                    (b) => b.id === selectedBudgetId
                                  )
                                : budgets
                            }
                            transactionAmount={parseFloat(amount)}
                            transactionType={transactionType}
                            categoryId={category}
                            transactionDate={date || new Date()}
                          />
                        )}
                    </div>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="bulk" className="flex-1 flex flex-col mt-0">
                <div
                  className="flex-1 overflow-y-auto pr-2"
                  style={{ maxHeight: "calc(90vh - 300px)" }}
                >
                  {/* Import Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{tForms("quickTextEntry")}</Label>
                      <Textarea
                        placeholder="Grocery Store $45.50&#10;Salary $3000 income&#10;Gas Station $35"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        className="h-20"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={parseTextInput}
                        disabled={!textInput.trim()}
                        className="w-full"
                      >
                        Parse Text
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>{tForms("csvUpload")}</Label>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className=""
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={downloadTemplate}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Template
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Manual Entry</Label>
                      <Button
                        type="button"
                        onClick={addBulkTransaction}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Transaction
                      </Button>
                    </div>
                  </div>

                  {/* Transaction List */}
                  {bulkTransactions.length > 0 && (
                    <div className="space-y-4 mt-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          Transactions ({bulkTransactions.length})
                        </h3>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setBulkTransactions([])}
                          className=""
                        >
                          Clear All
                        </Button>
                      </div>

                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {/* Header row - only visible on large screens */}
                        <div className="hidden xl:grid xl:grid-cols-[3fr_1.2fr_1.2fr_2fr_2fr_80px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                          <div>Name</div>
                          <div>Amount</div>
                          <div>Type</div>
                          <div>Category</div>
                          <div>Date</div>
                          <div className="text-center">Actions</div>
                        </div>
                        {bulkTransactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="p-4 bg-muted rounded-lg border"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[3fr_1.2fr_1.2fr_2fr_2fr_80px] gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground xl:hidden">Name</Label>
                                <Input
                                  placeholder="Transaction name"
                                  value={transaction.name}
                                  onChange={(e) =>
                                    updateBulkTransaction(
                                      transaction.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  className="bg-background"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground xl:hidden">Amount</Label>
                                <div className="relative flex items-center">
                                  <span className="absolute left-3 text-muted-foreground">
                                    $
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={transaction.amount}
                                    onChange={(e) =>
                                      updateBulkTransaction(
                                        transaction.id,
                                        "amount",
                                        e.target.value
                                      )
                                    }
                                    className="bg-background pl-8"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground xl:hidden">Type</Label>
                                <Select
                                  value={transaction.transactionType}
                                  onValueChange={(value) =>
                                    updateBulkTransaction(
                                      transaction.id,
                                      "transactionType",
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger className="bg-background">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="expense">Expense</SelectItem>
                                    <SelectItem value="income">Income</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground xl:hidden">Category</Label>
                                <Select
                                  value={transaction.categoryId}
                                  onValueChange={(value) =>
                                    updateBulkTransaction(
                                      transaction.id,
                                      "categoryId",
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select Category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {translatedCategories?.map((cat) => (
                                      <SelectItem
                                        key={cat.id || cat.name}
                                        value={cat.id || cat.name}
                                      >
                                        {cat.translatedName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground xl:hidden">Date</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal bg-background h-9 px-2",
                                        !transaction.date && "text-muted-foreground"
                                      )}
                                    >
                                      <CalendarIcon className="mr-1 h-4 w-4 flex-shrink-0" />
                                      <span className="truncate">
                                        {transaction.date ? format(new Date(transaction.date), "MM/dd/yyyy") : "Select date"}
                                      </span>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0">
                                    <Calendar
                                      mode="single"
                                      selected={transaction.date ? new Date(transaction.date) : undefined}
                                      onSelect={(date: Date | undefined) =>
                                        updateBulkTransaction(
                                          transaction.id,
                                          "date",
                                          date ? date.toISOString().split("T")[0] : ""
                                        )
                                      }
                                      initialFocus
                                      className=""
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="space-y-1 flex items-end xl:justify-center">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    removeBulkTransaction(transaction.id)
                                  }
                                  className="w-full xl:w-8 xl:h-8 xl:p-0 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                  <X className="h-4 w-4" />
                                  <span className="ml-1 xl:hidden">Remove</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="p-6 border-t bg-background">
            {activeTab === "single" ? (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                  className="hover:text-destructive"
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  type="submit"
                  form="transaction-form"
                  disabled={isSubmitting}
                  className={cn(
                    "",
                    transactionType === "expense"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  )}
                >
                  {isSubmitting
                    ? tStatus("saving")
                    : `${tCommon("save")} Transaction`}
                </Button>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                  className="hover:text-destructive"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={isSubmitting || bulkTransactions.length === 0}
                  className=""
                >
                  {isSubmitting
                    ? "Creating..."
                    : bulkTransactions.length > 0
                    ? `Create ${bulkTransactions.length} Transaction${
                        bulkTransactions.length === 1 ? "" : "s"
                      }`
                    : "Create Transactions"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
