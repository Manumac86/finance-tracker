"use client";

import type React from "react";

import { useState } from "react";
import { CalendarIcon, Plus } from "lucide-react";
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

export function AddTransactionButton() {
  const { categories } = useCategories();
  const [open, setOpen] = useState(false);
  const [transactionType, setTransactionType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState<Date>();
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Here you would typically save the transaction data
    console.log({
      type: transactionType,
      amount: Number.parseFloat(amount),
      category,
      date: date || new Date(),
      description,
    });

    // Reset form and close modal
    resetForm();
    setOpen(false);
  };

  const resetForm = () => {
    setTransactionType("expense");
    setAmount("");
    setCategory("");
    setDate(undefined);
    setDescription("");
  };

  return (
    <>
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center">
        <Button
          onClick={() => setOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full bg-white text-emerald-600 hover:text-white hover:bg-emerald-700 shadow-lg hover:shadow-emerald-700 hover:shadow-2xl"
        >
          <Plus className="h-8 w-8" />
          <span className="sr-only">Add Transaction</span>
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
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-gray-50">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the details of your transaction below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="transaction-type">Transaction Type</Label>
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
                      className="border-gray-700 text-rose-500"
                    />
                    <Label htmlFor="expense" className="font-normal">
                      Expense
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="income"
                      id="income"
                      className="border-gray-700 text-emerald-500"
                    />
                    <Label htmlFor="income" className="font-normal">
                      Income
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative flex items-center justify-center">
                  <span className="absolute left-3 text-gray-500">$</span>
                  <Input
                    id="amount"
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
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger
                    id="category"
                    className="bg-gray-800 border-gray-700 text-gray-50"
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-gray-50">
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id || cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
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
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
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
                onClick={() => setOpen(false)}
                className="border-gray-700 bg-gray-800 text-white hover:text-rose-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className={cn(
                  "text-white",
                  transactionType === "expense"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                Save Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
