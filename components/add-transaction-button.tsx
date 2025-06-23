"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { CalendarIcon, Plus, Mic, MicOff, Upload } from "lucide-react";
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
import { useBudgetAlerts } from "@/contexts/budget-alerts";
import { suggestCategory, suggestMerchant, getQuickMerchantSuggestions } from "@/lib/utils/smart-suggestions";
import { BulkTransactionModal } from "@/components/bulk-transaction-modal";
import { toast } from "sonner";

export function AddTransactionButton() {
  const { categories } = useCategories();
  const { transactions, mutate } = useTransactions();
  const { checkBudgetAlerts } = useBudgetAlerts();
  const [open, setOpen] = useState(false);
  const [transactionType, setTransactionType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState<Date>();
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [merchantSuggestions, setMerchantSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => {
          setIsListening(false);
          toast.error('Voice recognition failed. Please try again.');
        };
        
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          setDescription(prev => prev ? `${prev} ${transcript}` : transcript);
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
        transactionType: transactionType as 'income' | 'expense',
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: category,
        transactionDate: (date || new Date()).toISOString(),
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      const result = await response.json();
      
      // Check for budget alerts (only for expenses)
      if (transactionType === 'expense' && result.transaction) {
        await checkBudgetAlerts(result.transaction);
      }
      
      // Refresh the transactions list
      mutate();
      
      // Show success message
      toast.success(`${transactionType === 'income' ? 'Income' : 'Expense'} added successfully!`);
      
      // Reset form and close modal
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTransactionType("expense");
    setAmount("");
    setName("");
    setCategory("");
    setDate(undefined);
    setDescription("");
    setMerchantSuggestions([]);
    setShowSuggestions(false);
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
        const suggestedCategory = suggestCategory(value, categories);
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
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    if (selectedCategory && !name) {
      const quickSuggestions = getQuickMerchantSuggestions(selectedCategory.name);
      setMerchantSuggestions(quickSuggestions);
      setShowSuggestions(true);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center gap-4">
        <Button
          onClick={() => setBulkModalOpen(true)}
          size="lg"
          className="h-12 px-4 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-700 hover:shadow-xl"
        >
          <Upload className="h-5 w-5 mr-2" />
          Bulk
          <span className="sr-only">Bulk Add Transactions</span>
        </Button>
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

              <div className="space-y-2 relative">
                <Label htmlFor="name">Transaction Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Grocery Store, Salary"
                  className="bg-gray-800 border-gray-700 text-gray-50"
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
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
                    {merchantSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-700 text-sm"
                        onClick={() => {
                          setName(suggestion);
                          setShowSuggestions(false);
                          
                          // Auto-suggest category for this merchant
                          if (!category) {
                            const suggestedCategory = suggestCategory(suggestion, categories);
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
                <Select value={category} onValueChange={handleCategoryChange} required>
                  <SelectTrigger
                    id="category"
                    className="bg-gray-800 border-gray-700 text-gray-50"
                  >
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-gray-50">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id || cat.name}>
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
                <div className="relative">
                  <Textarea
                    id="description"
                    placeholder="Add notes about this transaction"
                    className="bg-gray-800 border-gray-700 text-gray-50 pr-12"
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
                          ? 'text-red-500 hover:text-red-600' 
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                      onClick={isListening ? stopListening : startListening}
                      disabled={isSubmitting}
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {isListening ? 'Stop voice input' : 'Start voice input'}
                      </span>
                    </Button>
                  )}
                </div>
                {isListening && (
                  <p className="text-sm text-blue-400">
                    🎤 Listening... Speak now to add description
                  </p>
                )}
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
                disabled={isSubmitting}
                className={cn(
                  "text-white",
                  transactionType === "expense"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {isSubmitting ? "Saving..." : "Save Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Transaction Modal */}
      <BulkTransactionModal 
        open={bulkModalOpen} 
        onOpenChange={setBulkModalOpen} 
      />
    </>
  );
}
