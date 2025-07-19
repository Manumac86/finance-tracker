"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { CalendarIcon, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DialogFooter } from "@/components/ui/dialog";
import { RecordPaymentSchema, type RecordPayment, type Debt } from "@/lib/db/schemas/debt";
import { cn } from "@/lib/utils";

interface PaymentFormProps {
  debt: Debt;
  onSubmit: (payment: RecordPayment) => Promise<void>;
  onCancel: () => void;
}

export function PaymentForm({ debt, onSubmit, onCancel }: PaymentFormProps) {
  const t = useTranslations("debts");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RecordPayment>({
    resolver: zodResolver(RecordPaymentSchema),
    defaultValues: {
      amount: debt.minimum_payment || 0,
      payment_date: new Date().toISOString().split('T')[0],
      notes: "",
    },
  });

  const handleSubmit = async (data: RecordPayment) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onCancel();
    } catch (error) {
      console.error("Error recording payment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const suggestedAmounts = [
    { label: t("payment.suggestions.minimum"), amount: debt.minimum_payment || 0 },
    { label: t("payment.suggestions.double"), amount: (debt.minimum_payment || 0) * 2 },
    { label: t("payment.suggestions.extra50"), amount: (debt.minimum_payment || 0) + 50 },
    { label: t("payment.suggestions.extra100"), amount: (debt.minimum_payment || 0) + 100 },
  ].filter(item => item.amount > 0);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-4">
          {/* Current Balance Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">{t("payment.currentBalance")}</p>
                <p className="text-2xl font-bold">{formatCurrency(debt.current_balance)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t("payment.minimumPayment")}</p>
                <p className="text-lg font-semibold">
                  {debt.minimum_payment ? formatCurrency(debt.minimum_payment) : t("payment.notSet")}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Amount */}
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("payment.amount")}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      {...field} 
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={debt.current_balance}
                      placeholder="0.00"
                      className="pl-10"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  {t("payment.amountDescription", { max: formatCurrency(debt.current_balance) })}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quick Amount Suggestions */}
          {suggestedAmounts.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("payment.quickAmounts")}</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedAmounts.map((item, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue("amount", item.amount)}
                    className="justify-start"
                  >
                    <div className="text-left">
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="font-semibold">{formatCurrency(item.amount)}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Date */}
          <FormField
            control={form.control}
            name="payment_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("payment.date")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          new Date(field.value).toLocaleDateString()
                        ) : (
                          <span>{t("payment.selectDate")}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString().split('T')[0])}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  {t("payment.dateDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("payment.notes")}</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder={t("payment.notesPlaceholder")}
                    className="resize-none"
                    rows={3}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  {t("payment.notesDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Payment Impact Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">{t("payment.impactPreview")}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t("payment.currentBalance")}:</span>
                <span>{formatCurrency(debt.current_balance)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("payment.paymentAmount")}:</span>
                <span className="text-destructive">
                  -{formatCurrency(form.watch("amount") || 0)}
                </span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>{t("payment.newBalance")}:</span>
                <span className="text-emerald-600">
                  {formatCurrency(Math.max(0, debt.current_balance - (form.watch("amount") || 0)))}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("payment.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("payment.recording") : t("payment.recordPayment")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}