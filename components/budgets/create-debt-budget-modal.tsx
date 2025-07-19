"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { 
  CreditCard,
  DollarSign,
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useDebts } from "@/contexts/debts";

const DebtBudgetSchema = z.object({
  name: z.string().min(1, "Budget name is required"),
  description: z.string().optional(),
  budget_type: z.enum(["minimum_payments", "accelerated", "custom"]).default("minimum_payments"),
  amount: z.number().positive("Budget amount must be positive"),
  period: z.enum(["monthly", "weekly", "quarterly"]).default("monthly"),
  include_extra_payments: z.boolean().default(false),
  extra_payment_percentage: z.number().min(0).max(200).default(20),
  target_debts: z.array(z.string()).optional(),
  alert_threshold_percentage: z.number().min(1).max(100).default(80),
  rollover_enabled: z.boolean().default(false),
});

type DebtBudgetForm = z.infer<typeof DebtBudgetSchema>;

interface BudgetData {
  name: string;
  description?: string;
  budget_type: string;
  amount: number;
  period: string;
  start_date: string;
  alert_threshold_percentage: number;
  alert_enabled: boolean;
  overspend_alert_enabled: boolean;
  rollover_enabled: boolean;
  rollover_type: string;
  metadata: Record<string, unknown>;
}

interface CreateDebtBudgetModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (budgetData: BudgetData) => Promise<void>;
}

export function CreateDebtBudgetModal({ open, onClose, onSubmit }: CreateDebtBudgetModalProps) {
  const t = useTranslations("budgets");
  const { debts, summary, isLoading } = useDebts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DebtBudgetForm>({
    resolver: zodResolver(DebtBudgetSchema),
    defaultValues: {
      name: "Debt Payments",
      description: "",
      budget_type: "minimum_payments",
      amount: 0,
      period: "monthly",
      include_extra_payments: false,
      extra_payment_percentage: 20,
      target_debts: [],
      alert_threshold_percentage: 80,
      rollover_enabled: false,
    },
  });

  const watchedBudgetType = form.watch("budget_type");
  const watchedIncludeExtra = form.watch("include_extra_payments");
  const watchedExtraPercentage = form.watch("extra_payment_percentage");

  useEffect(() => {
    if (summary && debts) {
      const activeDebts = debts.filter(d => d.is_active);
      
      // Calculate recommended amounts based on budget type
      let recommendedAmount = 0;
      
      switch (watchedBudgetType) {
        case "minimum_payments":
          recommendedAmount = summary.total_minimum_payments;
          break;
        case "accelerated":
          recommendedAmount = summary.total_minimum_payments * 1.5; // 50% extra
          break;
        case "custom":
          recommendedAmount = summary.total_minimum_payments;
          break;
      }

      if (watchedIncludeExtra) {
        recommendedAmount += (summary.total_minimum_payments * watchedExtraPercentage / 100);
      }

      form.setValue("amount", Math.round(recommendedAmount));
      form.setValue("target_debts", activeDebts.map(d => d.id));
    }
  }, [summary, debts, watchedBudgetType, watchedIncludeExtra, watchedExtraPercentage, form]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const calculateBudgetImpact = () => {
    if (!summary) return null;

    const budgetAmount = form.watch("amount") || 0;
    const minimumRequired = summary.total_minimum_payments;
    const extraAmount = budgetAmount - minimumRequired;
    const extraPercentage = minimumRequired > 0 ? (extraAmount / minimumRequired) * 100 : 0;

    // Calculate potential savings
    let estimatedMonthlySavings = 0;
    if (extraAmount > 0 && debts) {
      const activeDebts = debts.filter(d => d.is_active && d.interest_rate);
      const averageInterestRate = activeDebts.length > 0 ? 
        activeDebts.reduce((sum, d) => sum + (d.interest_rate || 0), 0) / activeDebts.length : 0;
      
      estimatedMonthlySavings = (extraAmount * (averageInterestRate / 100 / 12));
    }

    return {
      minimumRequired,
      extraAmount,
      extraPercentage,
      estimatedMonthlySavings,
      payoffAcceleration: extraPercentage > 0 ? Math.round(extraPercentage / 10) : 0, // Rough estimate
    };
  };

  const getBudgetRecommendations = () => {
    if (!summary || !debts) return [];

    const recommendations = [];
    const activeDebts = debts.filter(d => d.is_active);
    
    // High interest debt focus
    const highInterestDebts = activeDebts.filter(d => (d.interest_rate || 0) > 15);
    if (highInterestDebts.length > 0) {
      recommendations.push({
        type: "high_interest",
        title: t("debtBudget.recommendations.highInterest"),
        description: t("debtBudget.recommendations.highInterestDesc"),
        suggestedAmount: summary.total_minimum_payments * 1.3,
        priority: "high",
      });
    }

    // Debt consolidation opportunity
    if (activeDebts.length > 3) {
      recommendations.push({
        type: "consolidation",
        title: t("debtBudget.recommendations.consolidation"),
        description: t("debtBudget.recommendations.consolidationDesc"),
        suggestedAmount: summary.total_minimum_payments * 0.8,
        priority: "medium",
      });
    }

    // Aggressive payoff strategy
    if (summary.debt_to_income_ratio && summary.debt_to_income_ratio < 30) {
      recommendations.push({
        type: "aggressive",
        title: t("debtBudget.recommendations.aggressive"),
        description: t("debtBudget.recommendations.aggressiveDesc"),
        suggestedAmount: summary.total_minimum_payments * 2,
        priority: "low",
      });
    }

    return recommendations;
  };

  const impact = calculateBudgetImpact();
  const recommendations = getBudgetRecommendations();

  const handleSubmit = async (data: DebtBudgetForm) => {
    setIsSubmitting(true);
    try {
      const budgetData = {
        name: data.name,
        description: data.description || `Budget for debt payments with ${data.budget_type} strategy`,
        budget_type: "custom", // Map to existing budget schema
        amount: data.amount,
        period: data.period,
        start_date: new Date().toISOString().split('T')[0],
        alert_threshold_percentage: data.alert_threshold_percentage,
        alert_enabled: true,
        overspend_alert_enabled: true,
        rollover_enabled: data.rollover_enabled,
        rollover_type: data.rollover_enabled ? "surplus" : "none",
        metadata: {
          debt_budget: true,
          debt_strategy: data.budget_type,
          include_extra_payments: data.include_extra_payments,
          extra_payment_percentage: data.extra_payment_percentage,
          target_debts: data.target_debts,
          minimum_required: summary?.total_minimum_payments || 0,
          extra_amount: impact?.extraAmount || 0,
        },
      };

      await onSubmit(budgetData);
      onClose();
      form.reset();
    } catch (error) {
      console.error("Error creating debt budget:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("debtBudget.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("debtBudget.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Current Debt Overview */}
            {summary && (
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("debtBudget.totalDebt")}</p>
                      <p className="font-semibold text-destructive">
                        {formatCurrency(summary.total_debt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("debtBudget.minimumPayments")}</p>
                      <p className="font-semibold">
                        {formatCurrency(summary.total_minimum_payments)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("debtBudget.activeDebts")}</p>
                      <p className="font-semibold">{summary.active_debts_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("debtBudget.avgInterest")}</p>
                      <p className="font-semibold">{summary.total_interest_rate.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Budget Strategy */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="budget_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("debtBudget.strategy")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="minimum_payments">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            {t("debtBudget.strategies.minimum")}
                          </div>
                        </SelectItem>
                        <SelectItem value="accelerated">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            {t("debtBudget.strategies.accelerated")}
                          </div>
                        </SelectItem>
                        <SelectItem value="custom">
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            {t("debtBudget.strategies.custom")}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {watchedBudgetType === "minimum_payments" && t("debtBudget.strategies.minimumDesc")}
                      {watchedBudgetType === "accelerated" && t("debtBudget.strategies.acceleratedDesc")}
                      {watchedBudgetType === "custom" && t("debtBudget.strategies.customDesc")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Include Extra Payments */}
              <FormField
                control={form.control}
                name="include_extra_payments"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t("debtBudget.includeExtra")}
                      </FormLabel>
                      <FormDescription>
                        {t("debtBudget.includeExtraDesc")}
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

              {/* Extra Payment Percentage */}
              {watchedIncludeExtra && (
                <FormField
                  control={form.control}
                  name="extra_payment_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("debtBudget.extraPercentage")}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          min="0"
                          max="200"
                          placeholder="20"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("debtBudget.extraPercentageDesc")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Budget Details */}
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.budgetName")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("debtBudget.namePlaceholder")} />
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
                        placeholder={t("debtBudget.descriptionPlaceholder")}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("debtBudget.monthlyAmount")}</FormLabel>
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
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.period")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">{t("periods.weekly")}</SelectItem>
                          <SelectItem value="monthly">{t("periods.monthly")}</SelectItem>
                          <SelectItem value="quarterly">{t("periods.quarterly")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Budget Impact Analysis */}
            {impact && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-blue-600" />
                      <h4 className="font-semibold">{t("debtBudget.budgetImpact")}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">{t("debtBudget.minimumRequired")}</p>
                        <p className="font-semibold">{formatCurrency(impact.minimumRequired)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("debtBudget.budgetedAmount")}</p>
                        <p className="font-semibold">{formatCurrency(form.watch("amount") || 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("debtBudget.extraAmount")}</p>
                        <p className={`font-semibold ${
                          impact.extraAmount >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}>
                          {impact.extraAmount >= 0 ? "+" : ""}{formatCurrency(impact.extraAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("debtBudget.payoffAcceleration")}</p>
                        <p className="font-semibold text-purple-600">
                          {impact.payoffAcceleration > 0 ? 
                            `${impact.payoffAcceleration} ${t("common.monthsEarlier")}` : 
                            t("debtBudget.noAcceleration")
                          }
                        </p>
                      </div>
                    </div>

                    {impact.extraAmount > 0 && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            {t("debtBudget.positiveImpact")}
                          </p>
                        </div>
                        <p className="text-sm text-emerald-600">
                          {t("debtBudget.estimatedSavings", { 
                            amount: formatCurrency(impact.estimatedMonthlySavings)
                          })}
                        </p>
                      </div>
                    )}

                    {impact.extraAmount < 0 && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <p className="text-sm font-medium text-red-700 dark:text-red-300">
                            {t("debtBudget.insufficientBudget")}
                          </p>
                        </div>
                        <p className="text-sm text-red-600">
                          {t("debtBudget.increaseRecommendation")}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {t("debtBudget.recommendations.title")}
                </h4>
                <div className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={
                              rec.priority === "high" ? "destructive" :
                              rec.priority === "medium" ? "secondary" : "outline"
                            }>
                              {rec.priority}
                            </Badge>
                            <p className="font-medium">{rec.title}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => form.setValue("amount", rec.suggestedAmount)}
                        >
                          {formatCurrency(rec.suggestedAmount)}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Alert Settings */}
            <FormField
              control={form.control}
              name="alert_threshold_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.alertThreshold")}</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      min="1"
                      max="100"
                      placeholder="80"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 80)}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("debtBudget.alertThresholdDesc")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !summary}
              >
                {isSubmitting ? t("common.creating") : t("debtBudget.createBudget")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}