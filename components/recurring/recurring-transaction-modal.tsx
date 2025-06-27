"use client";

import { useState, useEffect } from "react";
import { X, Calendar, DollarSign, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCategories } from "@/contexts/categories";
import { Frequency, getUpcomingDates } from "@/lib/utils/recurring-dates";
import dayjs from "dayjs";

interface RecurringTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: RecurringTransactionFormData) => void;
  initialData?: Partial<RecurringTransactionFormData>;
}

export interface RecurringTransactionFormData {
  name: string;
  description: string;
  amount: number;
  transactionType: "income" | "expense";
  categoryId: string;
  frequency: Frequency;
  startDate: string;
  endDate: string;
  isBill: boolean;
  reminderDaysBefore: number;
  autoCreateTransaction: boolean;
}

export function RecurringTransactionModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: RecurringTransactionModalProps) {
  const { data: categories } = useCategories();
  const [formData, setFormData] = useState<RecurringTransactionFormData>({
    name: "",
    description: "",
    amount: 0,
    transactionType: "expense",
    categoryId: "",
    frequency: "monthly",
    startDate: dayjs().format("YYYY-MM-DD"),
    endDate: "",
    isBill: true,
    reminderDaysBefore: 3,
    autoCreateTransaction: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  // Update form data when initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || "",
          description: initialData.description || "",
          amount: initialData.amount || 0,
          transactionType: initialData.transactionType || "expense",
          categoryId: initialData.categoryId || "",
          frequency: initialData.frequency || "monthly",
          startDate: initialData.startDate || dayjs().format("YYYY-MM-DD"),
          endDate: initialData.endDate || "",
          isBill: initialData.isBill ?? true,
          reminderDaysBefore: initialData.reminderDaysBefore ?? 3,
          autoCreateTransaction: initialData.autoCreateTransaction ?? true,
        });
      } else {
        // Reset to defaults when opening for new transaction
        setFormData({
          name: "",
          description: "",
          amount: 0,
          transactionType: "expense",
          categoryId: "",
          frequency: "monthly",
          startDate: dayjs().format("YYYY-MM-DD"),
          endDate: "",
          isBill: true,
          reminderDaysBefore: 3,
          autoCreateTransaction: true,
        });
      }
    }
  }, [isOpen, initialData, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.amount || formData.amount <= 0 || isNaN(formData.amount)) {
      newErrors.amount = "Amount must be greater than 0";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (formData.isBill && !formData.categoryId) {
      newErrors.categoryId = "Category is required for bills";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Ensure empty endDate is sent as empty string, not null
    const cleanedFormData = {
      ...formData,
      endDate: formData.endDate || ""
    };
    
    onSave(cleanedFormData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      amount: 0,
      transactionType: "expense",
      categoryId: "",
      frequency: "monthly",
      startDate: dayjs().format("YYYY-MM-DD"),
      endDate: "",
      isBill: true,
      reminderDaysBefore: 3,
      autoCreateTransaction: true,
    });
    setErrors({});
    setShowPreview(false);
    onClose();
  };

  const updateFormData = (
    field: keyof RecurringTransactionFormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const upcomingDates = formData.startDate
    ? getUpcomingDates(formData.startDate, formData.frequency, 5)
    : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-800 max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">
                {initialData ? "Edit" : "Create"} Recurring Transaction
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Set up automatic transactions and bill reminders
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300">
                  Basic Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transactionType">Type</Label>
                    <Select
                      value={formData.transactionType}
                      onValueChange={(value: "income" | "expense") =>
                        updateFormData("transactionType", value)
                      }
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isBill">Transaction Category</Label>
                    <div className="flex items-center space-x-4 h-10">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <Checkbox
                          checked={formData.isBill}
                          onCheckedChange={(checked) =>
                            updateFormData("isBill", checked)
                          }
                        />
                        <span className="text-sm">This is a bill</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    placeholder={
                      formData.isBill
                        ? "e.g., Netflix Subscription"
                        : "e.g., Monthly Salary"
                    }
                    className={`bg-gray-800 border-gray-700 ${
                      errors.name ? "border-red-500" : ""
                    }`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={formData.amount || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty string for user to clear the field
                          if (value === "") {
                            updateFormData("amount", 0);
                          } else {
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                              updateFormData("amount", numValue);
                            }
                          }
                        }}
                        placeholder="0.00"
                        className={`pl-10 bg-gray-800 border-gray-700 ${
                          errors.amount ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                    {errors.amount && (
                      <p className="text-sm text-red-500">{errors.amount}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Category</Label>
                    <Select
                      key={`category-${formData.categoryId}-${isOpen}`}
                      value={formData.categoryId || ""}
                      onValueChange={(value) =>
                        updateFormData("categoryId", value)
                      }
                    >
                      <SelectTrigger
                        className={`bg-gray-800 border-gray-700 ${
                          errors.categoryId ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {!categories ? (
                          <SelectItem value="loading" disabled>
                            Loading categories...
                          </SelectItem>
                        ) : categories.length === 0 ? (
                          <SelectItem value="no-categories" disabled>
                            No categories available
                          </SelectItem>
                        ) : (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.id!}>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && (
                      <p className="text-sm text-red-500">
                        {errors.categoryId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      updateFormData("description", e.target.value)
                    }
                    placeholder="Optional notes about this recurring transaction"
                    className="bg-gray-800 border-gray-700"
                    rows={2}
                  />
                </div>
              </div>

              {/* Recurrence Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Recurrence Settings
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value: Frequency) =>
                        updateFormData("frequency", value)
                      }
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        updateFormData("startDate", e.target.value)
                      }
                      className={`bg-gray-800 border-gray-700 ${
                        errors.startDate ? "border-red-500" : ""
                      }`}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-red-500">{errors.startDate}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate || ""}
                    onChange={(e) =>
                      updateFormData("endDate", e.target.value)
                    }
                    className="bg-gray-800 border-gray-700"
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty for recurring indefinitely
                  </p>
                </div>

                {/* Preview upcoming dates */}
                {showPreview && upcomingDates.length > 0 && (
                  <div className="p-4 bg-gray-800/50 rounded-lg space-y-2">
                    <div className="text-sm font-medium text-gray-300">
                      Upcoming Occurrences:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {upcomingDates.map((date, index) => (
                        <div
                          key={index}
                          className="text-xs bg-gray-700 px-2 py-1 rounded"
                        >
                          {new Date(date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: index === 0 ? "numeric" : undefined,
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="border-gray-700"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {showPreview ? "Hide" : "Show"} Preview
                </Button>
              </div>

              {/* Bill Settings */}
              {formData.isBill && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-300">
                    Bill Settings
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="reminderDays">
                      Reminder Days Before Due
                    </Label>
                    <Select
                      value={formData.reminderDaysBefore.toString()}
                      onValueChange={(value) =>
                        updateFormData("reminderDaysBefore", parseInt(value))
                      }
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No reminder</SelectItem>
                        <SelectItem value="1">1 day before</SelectItem>
                        <SelectItem value="3">3 days before</SelectItem>
                        <SelectItem value="7">1 week before</SelectItem>
                        <SelectItem value="14">2 weeks before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoCreate"
                      checked={formData.autoCreateTransaction}
                      onCheckedChange={(checked) =>
                        updateFormData("autoCreateTransaction", checked)
                      }
                    />
                    <Label htmlFor="autoCreate" className="cursor-pointer">
                      Automatically create transaction when paid
                    </Label>
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <div className="border-t border-gray-800 p-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {initialData ? "Update" : "Create"} Recurring Transaction
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
