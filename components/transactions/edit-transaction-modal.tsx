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
import { useCategories } from "@/contexts/categories";
import { useTransactions } from "@/contexts/transactions";
import { UITransaction } from "@/lib/db/schemas/transaction";
import { toast } from "sonner";

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
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { mutate } = useTransactions();
  
  const [transactionType, setTransactionType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
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
      setDate(new Date(transaction.transactionDate));
      setDescription(transaction.description || "");
    }
  }, [transaction]);

  // Debug log to check categories
  useEffect(() => {
    if (open && categories) {
      console.log("Available categories:", categories);
      console.log("Transaction category ID:", transaction?.categoryId);
      console.log("Selected category:", category);
    }
  }, [open, categories, transaction, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transaction?.id) {
      toast.error("Transaction ID is missing");
      return;
    }

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
        throw new Error(errorData.error || "Failed to update transaction");
      }

      // Refresh the transactions list
      mutate();

      // Show success message
      toast.success("Transaction updated successfully!");

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update transaction");
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
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-gray-50">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update the details of your transaction below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-transaction-type">Transaction Type</Label>
              <RadioGroup
                id="edit-transaction-type"
                value={transactionType}
                onValueChange={(value) => setTransactionType(value as "income" | "expense")}
                className="flex space-x-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="expense"
                    id="edit-expense"
                    className="border-gray-700 text-rose-500"
                  />
                  <Label htmlFor="edit-expense" className="font-normal">
                    Expense
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="income"
                    id="edit-income"
                    className="border-gray-700 text-emerald-500"
                  />
                  <Label htmlFor="edit-income" className="font-normal">
                    Income
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">Transaction Name</Label>
              <Input
                id="edit-name"
                type="text"
                placeholder="e.g., Grocery Store, Salary"
                className="bg-gray-800 border-gray-700 text-gray-50"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount</Label>
              <div className="relative flex items-center justify-center">
                <span className="absolute left-3 text-gray-500">$</span>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8 bg-gray-800 border-gray-700 text-gray-50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select 
                value={category} 
                onValueChange={setCategory} 
                required
                disabled={categoriesLoading}
              >
                <SelectTrigger
                  id="edit-category"
                  className="bg-gray-800 border-gray-700 text-gray-50"
                >
                  <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select a category"} />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-gray-50">
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id!}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-gray-50",
                      !date && "text-gray-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="bg-gray-800 text-gray-50"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Add notes about this transaction"
                className="bg-gray-800 border-gray-700 text-gray-50"
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
              className="border-gray-700 bg-gray-800 text-white hover:text-rose-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || categoriesLoading}
              className={cn(
                "text-white",
                transactionType === "expense"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}