"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { 
  Plus, 
  Edit, 
  CreditCard, 
  Home, 
  GraduationCap, 
  DollarSign,
  Calendar,
  Building,
  Hash,
  Percent
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CreateDebtSchema, 
  UpdateDebtSchema,
  type CreateDebt,
  type UpdateDebt,
  type Debt
} from "@/lib/db/schemas/debt";
import { useDebts } from "@/contexts/debts";
import { useAccounts } from "@/contexts/accounts";

interface DebtModalProps {
  open: boolean;
  onClose: () => void;
  debt?: Debt | null;
  mode: "create" | "edit";
}

const debtTypeOptions = [
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
  { value: "loan", label: "Personal Loan", icon: DollarSign },
  { value: "mortgage", label: "Mortgage", icon: Home },
  { value: "student_loan", label: "Student Loan", icon: GraduationCap },
  { value: "other", label: "Other Debt", icon: DollarSign },
] as const;

export function DebtModal({ open, onClose, debt, mode }: DebtModalProps) {
  const t = useTranslations("debts");
  const { createDebt, updateDebt } = useDebts();
  const { accounts } = useAccounts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateDebt>({
    resolver: zodResolver(CreateDebtSchema),
    defaultValues: {
      name: "",
      debt_type: "credit_card",
      original_amount: 0,
      current_balance: 0,
      interest_rate: null,
      minimum_payment: null,
      payment_day: null,
      due_date: null,
      account_id: null,
      lender_name: null,
      account_number: null,
      notes: null,
      is_active: true,
    },
  });

  // const selectedDebtType = form.watch("debt_type");

  // Reset form when debt changes
  useEffect(() => {
    if (debt && mode === "edit") {
      form.reset({
        name: debt.name,
        debt_type: debt.debt_type,
        original_amount: debt.original_amount,
        current_balance: debt.current_balance,
        interest_rate: debt.interest_rate,
        minimum_payment: debt.minimum_payment,
        payment_day: debt.payment_day,
        due_date: debt.due_date?.split('T')[0] || null,
        account_id: debt.account_id,
        lender_name: debt.lender_name,
        account_number: debt.account_number,
        notes: debt.notes,
        is_active: debt.is_active,
      });
    } else if (mode === "create") {
      form.reset({
        name: "",
        debt_type: "credit_card",
        original_amount: 0,
        current_balance: 0,
        interest_rate: null,
        minimum_payment: null,
        payment_day: null,
        due_date: null,
        account_id: null,
        lender_name: null,
        account_number: null,
        notes: null,
        is_active: true,
      });
    }
  }, [debt, mode, form]);

  const onSubmit = async (data: CreateDebt) => {
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createDebt(data);
      } else if (debt) {
        await updateDebt(debt.id, data);
      }
      onClose();
    } catch (error) {
      console.error("Error saving debt:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // const getDebtTypeIcon = (type: DebtType) => {
  //   const option = debtTypeOptions.find(opt => opt.value === type);
  //   return option?.icon || DollarSign;
  // };

  // const getDebtTypeLabel = (type: DebtType) => {
  //   const option = debtTypeOptions.find(opt => opt.value === type);
  //   return option?.label || type;
  // };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "create" ? (
              <>
                <Plus className="h-5 w-5" />
                {t("modal.create.title")}
              </>
            ) : (
              <>
                <Edit className="h-5 w-5" />
                {t("modal.edit.title")}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" ? t("modal.create.description") : t("modal.edit.description")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground">
                {t("modal.sections.basic")}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("modal.fields.name")}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder={t("modal.placeholders.name")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="debt_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("modal.fields.debtType")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("modal.placeholders.debtType")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {debtTypeOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {t(`types.${option.value}`)}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="lender_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("modal.fields.lender")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          value={field.value || ""}
                          placeholder={t("modal.placeholders.lender")}
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground">
                {t("modal.sections.financial")}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="original_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("modal.fields.originalAmount")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-10"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="current_balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("modal.fields.currentBalance")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-10"
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interest_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("modal.fields.interestRate")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0.00"
                            className="pl-10"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        {t("modal.descriptions.interestRate")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minimum_payment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("modal.fields.minimumPayment")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="pl-10"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground">
                {t("modal.sections.payment")}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="payment_day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("modal.fields.paymentDay")}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          min="1"
                          max="31"
                          placeholder="15"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || null)}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("modal.descriptions.paymentDay")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("modal.fields.dueDate")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            type="date"
                            className="pl-10"
                            value={field.value || ""}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("modal.fields.linkedAccount")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("modal.placeholders.linkedAccount")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">{t("modal.options.noAccount")}</SelectItem>
                        {accounts?.map((account) => (
                          <SelectItem key={account.id} value={account.id || ""}>
                            {account.name} ({account.accountType})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t("modal.descriptions.linkedAccount")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground">
                {t("modal.sections.additional")}
              </h4>
              
              <FormField
                control={form.control}
                name="account_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("modal.fields.accountNumber")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          type="password"
                          placeholder={t("modal.placeholders.accountNumber")}
                          className="pl-10"
                          value={field.value || ""}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      {t("modal.descriptions.accountNumber")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("modal.fields.notes")}</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder={t("modal.placeholders.notes")}
                        className="resize-none"
                        rows={3}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t("modal.fields.isActive")}
                      </FormLabel>
                      <FormDescription>
                        {t("modal.descriptions.isActive")}
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                {t("modal.actions.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("modal.actions.saving") : 
                 mode === "create" ? t("modal.actions.create") : t("modal.actions.update")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}