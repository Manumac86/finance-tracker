"use client";

import { useState, useEffect } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { useTransactions } from "@/contexts/transactions";
import { UITransaction } from "@/lib/db/schemas/transaction";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useTranslatedCategories } from "@/hooks/use-translated-categories";
import { useAccounts } from "@/contexts/accounts";

interface EditTransactionModalProps {
  transaction: UITransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditTransactionModal({
  transaction,
  open,
  onOpenChange,
  onSuccess,
}: EditTransactionModalProps) {
  const { data: translatedCategories, isLoading: categoriesLoading } =
    useTranslatedCategories();
  const { mutate } = useTransactions();
  const { accounts } = useAccounts();
  const t = useTranslations("editTransactionModal");

  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "expense"
  );
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("none");
  const [date, setDate] = useState<Date>();
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when transaction changes
  useEffect(() => {
    if (transaction) {
      setTransactionType(transaction.transactionType);
      setAmount(Math.abs(transaction.amount).toString());
      setName(transaction.name);
      setCategory(transaction.categoryId);
      setAccount(transaction.accountId || "none");
      setDate(new Date(transaction.transactionDate));
      setDescription(transaction.description || "");
    }
  }, [transaction]);

  // Debug log to check categories
  useEffect(() => {
    if (open && translatedCategories) {
      console.log("Available categories:", translatedCategories);
      console.log("Transaction category ID:", transaction?.categoryId);
      console.log("Selected category:", category);
    }
  }, [open, translatedCategories, transaction, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transaction?.id) {
      toast.error(t("errors.missingId"));
      return;
    }

    if (!name.trim()) {
      toast.error(t("errors.nameRequired"));
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t("errors.amountRequired"));
      return;
    }

    if (!category) {
      toast.error(t("errors.categoryRequired"));
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

      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("errors.updateFailed"));
      }

      // Refresh the transactions list
      mutate();

      // Show success message
      toast.success(t("success.transactionUpdated"));

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error(
        error instanceof Error ? error.message : t("errors.updateFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("subtitle")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-transaction-type">
                {t("transactionType")}
              </Label>
              <RadioGroup
                id="edit-transaction-type"
                value={transactionType}
                onValueChange={(value) =>
                  setTransactionType(value as "income" | "expense")
                }
                className="flex space-x-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="expense"
                    id="edit-expense"
                    className="border-border text-rose-500"
                  />
                  <Label htmlFor="edit-expense" className="font-normal">
                    {t("expense")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="income"
                    id="edit-income"
                    className="border-border text-emerald-500"
                  />
                  <Label htmlFor="edit-income" className="font-normal">
                    {t("income")}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">{t("transactionName")}</Label>
              <Input
                id="edit-name"
                type="text"
                placeholder={t("transactionNamePlaceholder")}
                className="bg-card border-border text-foreground"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount">{t("amount")}</Label>
              <div className="relative flex items-center justify-center">
                <span className="absolute left-3 text-gray-500">$</span>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8 bg-card border-border text-foreground"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">{t("category")}</Label>
              <Select
                value={category}
                onValueChange={setCategory}
                required
                disabled={categoriesLoading}
              >
                <SelectTrigger
                  id="edit-category"
                  className="bg-card border-border text-foreground"
                >
                  <SelectValue
                    placeholder={
                      categoriesLoading
                        ? t("loadingCategories")
                        : t("selectCategory")
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {translatedCategories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id!}>
                      {cat.translatedName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-account">{t("account")}</Label>
              <Select
                value={account}
                onValueChange={setAccount}
              >
                <SelectTrigger
                  id="edit-account"
                  className="bg-card border-border text-foreground"
                >
                  <SelectValue placeholder={t("selectAccount")} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  <SelectItem value="none">{t("noAccount")}</SelectItem>
                  {accounts?.map((acc) => acc.id ? (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ) : null)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">{t("date")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-card border-border text-foreground",
                      !date && "text-gray-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : t("selectDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="bg-card border-border text-foreground"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">{t("description")}</Label>
              <Textarea
                id="edit-description"
                placeholder={t("descriptionPlaceholder")}
                className="bg-card border-border text-foreground"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className="hover:bg-destructive text-foreground hover:text-white"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || categoriesLoading}
              className={cn(
                "text-white",
                transactionType === "expense"
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {isSubmitting ? t("saving") : t("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
