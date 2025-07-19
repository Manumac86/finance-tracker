"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { 
  Target,
  Calendar,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  CheckCircle
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDebts } from "@/contexts/debts";
import { type Debt } from "@/lib/db/schemas/debt";

const DebtPayoffGoalSchema = z.object({
  name: z.string().min(1, "Goal name is required"),
  description: z.string().optional(),
  debt_id: z.string().uuid("Please select a debt"),
  target_date: z.string().optional(),
  extra_payment_amount: z.number().min(0, "Extra payment must be positive").optional(),
  strategy: z.enum(["current_payment", "accelerated", "custom"]).default("current_payment"),
});

type DebtPayoffGoalForm = z.infer<typeof DebtPayoffGoalSchema>;

interface DebtPayoffGoalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (goalData: {
    name: string;
    description?: string;
    target_amount: number;
    target_date?: string;
    metadata?: {
      debt_id: string;
      strategy: string;
      extra_payment_amount?: number;
    };
  }) => Promise<void>;
}

export function DebtPayoffGoalModal({ open, onClose, onSubmit }: DebtPayoffGoalModalProps) {
  const t = useTranslations("goals");
  const { debts, isLoading } = useDebts();
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DebtPayoffGoalForm>({
    resolver: zodResolver(DebtPayoffGoalSchema),
    defaultValues: {
      name: "",
      description: "",
      debt_id: "",
      strategy: "current_payment",
      extra_payment_amount: 0,
    },
  });

  const watchedDebtId = form.watch("debt_id");
  const watchedStrategy = form.watch("strategy");
  const watchedExtraPayment = form.watch("extra_payment_amount") || 0;

  useEffect(() => {
    if (watchedDebtId && debts) {
      const debt = debts.find(d => d.id === watchedDebtId);
      setSelectedDebt(debt || null);
      
      if (debt) {
        // Auto-generate goal name
        form.setValue("name", `Pay off ${debt.name}`);
      }
    }
  }, [watchedDebtId, debts, form]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const calculatePayoffProjection = () => {
    if (!selectedDebt || !selectedDebt.interest_rate || !selectedDebt.minimum_payment) {
      return null;
    }

    const balance = selectedDebt.current_balance;
    const monthlyRate = selectedDebt.interest_rate / 100 / 12;
    let monthlyPayment = selectedDebt.minimum_payment;

    if (watchedStrategy === "accelerated" && watchedExtraPayment > 0) {
      monthlyPayment += watchedExtraPayment;
    }

    if (monthlyPayment <= balance * monthlyRate) {
      return null; // Payment too low
    }

    const months = Math.ceil(
      -Math.log(1 - (balance * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate)
    );

    const totalPaid = monthlyPayment * months;
    const totalInterest = totalPaid - balance;
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + months);

    // Calculate savings compared to minimum payment
    const minimumMonths = selectedDebt.minimum_payment <= balance * monthlyRate ? null : Math.ceil(
      -Math.log(1 - (balance * monthlyRate) / selectedDebt.minimum_payment) / Math.log(1 + monthlyRate)
    );
    
    const minimumTotalInterest = minimumMonths ? 
      (selectedDebt.minimum_payment * minimumMonths) - balance : 0;
    const interestSaved = minimumTotalInterest - totalInterest;
    const monthsSaved = minimumMonths ? minimumMonths - months : 0;

    return {
      months,
      totalPaid,
      totalInterest,
      payoffDate,
      monthlyPayment,
      interestSaved: Math.max(0, interestSaved),
      monthsSaved: Math.max(0, monthsSaved),
    };
  };

  const projection = calculatePayoffProjection();

  const handleSubmit = async (data: DebtPayoffGoalForm) => {
    if (!selectedDebt || !projection) return;

    setIsSubmitting(true);
    try {
      const goalData = {
        name: data.name,
        description: data.description || `Goal to pay off ${selectedDebt.name}`,
        type: "debt_payoff",
        target_amount: selectedDebt.current_balance,
        current_amount: selectedDebt.original_amount - selectedDebt.current_balance,
        target_date: data.target_date || projection.payoffDate.toISOString().split('T')[0],
        metadata: {
          debt_id: selectedDebt.id,
          debt_name: selectedDebt.name,
          strategy: data.strategy,
          extra_payment_amount: data.extra_payment_amount || 0,
          projected_months: projection.months,
          projected_total_interest: projection.totalInterest,
          monthly_payment: projection.monthlyPayment,
          interest_saved: projection.interestSaved,
          months_saved: projection.monthsSaved,
        },
      };

      await onSubmit(goalData);
      onClose();
      form.reset();
    } catch (error) {
      console.error("Error creating debt payoff goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentProgress = () => {
    if (!selectedDebt) return 0;
    const paid = selectedDebt.original_amount - selectedDebt.current_balance;
    return (paid / selectedDebt.original_amount) * 100;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t("debtPayoff.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("debtPayoff.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Debt Selection */}
            <FormField
              control={form.control}
              name="debt_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("debtPayoff.selectDebt")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("debtPayoff.selectDebtPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading ? (
                        <SelectItem value="" disabled>Loading debts...</SelectItem>
                      ) : debts?.filter(debt => debt.is_active).map((debt) => (
                        <SelectItem key={debt.id} value={debt.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{debt.name}</span>
                            <span className="text-muted-foreground ml-2">
                              {formatCurrency(debt.current_balance)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Debt Info */}
            {selectedDebt && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{selectedDebt.name}</h4>
                      <Badge variant="outline">
                        {t(`debtTypes.${selectedDebt.debt_type}`)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t("debtPayoff.currentBalance")}</p>
                        <p className="font-semibold text-lg text-destructive">
                          {formatCurrency(selectedDebt.current_balance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("debtPayoff.minimumPayment")}</p>
                        <p className="font-semibold">
                          {selectedDebt.minimum_payment ? 
                            formatCurrency(selectedDebt.minimum_payment) : 
                            t("common.notSet")
                          }
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{t("debtPayoff.progress")}</span>
                        <span>{getCurrentProgress().toFixed(1)}%</span>
                      </div>
                      <Progress value={getCurrentProgress()} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Goal Details */}
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.goalName")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("debtPayoff.goalNamePlaceholder")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.description")}</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder={t("debtPayoff.descriptionPlaceholder")}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Payment Strategy */}
            <FormField
              control={form.control}
              name="strategy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("debtPayoff.paymentStrategy")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="current_payment">
                        {t("debtPayoff.strategies.currentPayment")}
                      </SelectItem>
                      <SelectItem value="accelerated">
                        {t("debtPayoff.strategies.accelerated")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("debtPayoff.strategyDescription")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Extra Payment Amount */}
            {watchedStrategy === "accelerated" && (
              <FormField
                control={form.control}
                name="extra_payment_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("debtPayoff.extraPaymentAmount")}</FormLabel>
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
                    <FormDescription>
                      {t("debtPayoff.extraPaymentDescription")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Target Date */}
            <FormField
              control={form.control}
              name="target_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("debtPayoff.targetDate")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        {...field} 
                        type="date"
                        className="pl-10"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {projection ? 
                      t("debtPayoff.projectedDate", { date: projection.payoffDate.toLocaleDateString() }) :
                      t("debtPayoff.targetDateDescription")
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Projection Results */}
            {projection && selectedDebt && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-emerald-600" />
                      <h4 className="font-semibold">{t("debtPayoff.payoffProjection")}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t("debtPayoff.monthlyPayment")}</p>
                        <p className="font-semibold">{formatCurrency(projection.monthlyPayment)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("debtPayoff.timeToPayoff")}</p>
                        <p className="font-semibold">
                          {Math.floor(projection.months / 12)}y {projection.months % 12}m
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("debtPayoff.totalInterest")}</p>
                        <p className="font-semibold text-destructive">
                          {formatCurrency(projection.totalInterest)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("debtPayoff.payoffDate")}</p>
                        <p className="font-semibold">
                          {projection.payoffDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {projection.interestSaved > 0 && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            {t("debtPayoff.potentialSavings")}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-emerald-600">{t("debtPayoff.interestSaved")}</p>
                            <p className="font-semibold text-emerald-700">
                              {formatCurrency(projection.interestSaved)}
                            </p>
                          </div>
                          <div>
                            <p className="text-emerald-600">{t("debtPayoff.timeSaved")}</p>
                            <p className="font-semibold text-emerald-700">
                              {projection.monthsSaved} {t("common.months")}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {!projection && selectedDebt && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-sm">
                      {t("debtPayoff.missingInfoWarning")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedDebt || !projection}
              >
                {isSubmitting ? t("common.creating") : t("debtPayoff.createGoal")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}