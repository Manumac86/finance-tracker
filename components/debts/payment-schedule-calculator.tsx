"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Calculator, DollarSign, Target, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { type Debt } from "@/lib/db/schemas/debt";

interface PaymentScheduleCalculatorProps {
  debt: Debt;
}

interface PayoffScenario {
  monthlyPayment: number;
  totalMonths: number;
  totalInterest: number;
  totalAmount: number;
  payoffDate: Date;
}

export function PaymentScheduleCalculator({ debt }: PaymentScheduleCalculatorProps) {
  const t = useTranslations("debts");
  const [customPayment, setCustomPayment] = useState(debt.minimum_payment || 0);
  const [targetMonths, setTargetMonths] = useState(24);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const calculatePayoff = (monthlyPayment: number): PayoffScenario | null => {
    if (!debt.interest_rate || monthlyPayment <= 0) return null;
    
    const monthlyRate = debt.interest_rate / 100 / 12;
    const balance = debt.current_balance;
    
    // Check if payment is sufficient
    if (monthlyPayment <= balance * monthlyRate) {
      return null; // Payment too low, will never pay off
    }
    
    const totalMonths = Math.ceil(
      -Math.log(1 - (balance * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate)
    );
    
    const totalAmount = monthlyPayment * totalMonths;
    const totalInterest = totalAmount - balance;
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + totalMonths);
    
    return {
      monthlyPayment,
      totalMonths,
      totalInterest,
      totalAmount,
      payoffDate,
    };
  };

  const calculatePaymentForTarget = (months: number): number => {
    if (!debt.interest_rate || months <= 0) return 0;
    
    const monthlyRate = debt.interest_rate / 100 / 12;
    const balance = debt.current_balance;
    
    if (monthlyRate === 0) {
      return balance / months;
    }
    
    const payment = (balance * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
    return payment;
  };

  const scenarios = [
    {
      name: t("calculator.scenarios.minimum"),
      payment: debt.minimum_payment || 0,
      description: t("calculator.scenarios.minimumDesc"),
    },
    {
      name: t("calculator.scenarios.double"),
      payment: (debt.minimum_payment || 0) * 2,
      description: t("calculator.scenarios.doubleDesc"),
    },
    {
      name: t("calculator.scenarios.extra50"),
      payment: (debt.minimum_payment || 0) + 50,
      description: t("calculator.scenarios.extra50Desc"),
    },
    {
      name: t("calculator.scenarios.extra100"),
      payment: (debt.minimum_payment || 0) + 100,
      description: t("calculator.scenarios.extra100Desc"),
    },
  ].filter(scenario => scenario.payment > 0);

  const customScenario = calculatePayoff(customPayment);
  const targetPayment = calculatePaymentForTarget(targetMonths);
  const targetScenario = calculatePayoff(targetPayment);

  if (!debt.interest_rate) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t("calculator.noInterestRate")}</h3>
          <p className="text-muted-foreground">
            {t("calculator.noInterestRateDescription")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Scenarios */}
      <div className="grid gap-4 md:grid-cols-2">
        {scenarios.map((scenario, index) => {
          const result = calculatePayoff(scenario.payment);
          return (
            <Card key={index} className={!result ? "opacity-50" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  {scenario.name}
                  <Badge variant="outline">{formatCurrency(scenario.payment)}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{scenario.description}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {result ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>{t("calculator.payoffTime")}:</span>
                      <span className="font-medium">
                        {Math.floor(result.totalMonths / 12)}y {result.totalMonths % 12}m
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t("calculator.totalInterest")}:</span>
                      <span className="font-medium text-destructive">
                        {formatCurrency(result.totalInterest)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t("calculator.payoffDate")}:</span>
                      <span className="font-medium">
                        {result.payoffDate.toLocaleDateString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("calculator.paymentTooLow")}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Custom Payment Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t("calculator.customPayment")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-payment">{t("calculator.monthlyPayment")}</Label>
            <Input
              id="custom-payment"
              type="number"
              step="0.01"
              min="0"
              value={customPayment}
              onChange={(e) => setCustomPayment(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          
          {customScenario && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("calculator.payoffTime")}</p>
                  <p className="text-xl font-bold">
                    {Math.floor(customScenario.totalMonths / 12)}y {customScenario.totalMonths % 12}m
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("calculator.totalInterest")}</p>
                  <p className="text-xl font-bold text-destructive">
                    {formatCurrency(customScenario.totalInterest)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("calculator.totalAmount")}</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(customScenario.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("calculator.payoffDate")}</p>
                  <p className="text-lg font-semibold">
                    {customScenario.payoffDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {!customScenario && customPayment > 0 && (
            <div className="p-4 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive">
                {t("calculator.paymentTooLowDescription")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Timeline Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t("calculator.targetTimeline")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target-months">
              {t("calculator.payoffIn")} {targetMonths} {t("calculator.months")}
            </Label>
            <Slider
              id="target-months"
              min={6}
              max={120}
              step={6}
              value={[targetMonths]}
              onValueChange={(value) => setTargetMonths(value[0])}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>6 {t("calculator.months")}</span>
              <span>10 {t("calculator.years")}</span>
            </div>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("calculator.requiredPayment")}</p>
                <p className="text-xl font-bold">
                  {formatCurrency(targetPayment)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("calculator.extraNeeded")}</p>
                <p className="text-xl font-bold text-blue-600">
                  +{formatCurrency(Math.max(0, targetPayment - (debt.minimum_payment || 0)))}
                </p>
              </div>
              {targetScenario && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("calculator.totalInterest")}</p>
                    <p className="text-lg font-semibold text-destructive">
                      {formatCurrency(targetScenario.totalInterest)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("calculator.payoffDate")}</p>
                    <p className="text-lg font-semibold">
                      {targetScenario.payoffDate.toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interest Savings Comparison */}
      {scenarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              {t("calculator.interestSavings")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scenarios.map((scenario, index) => {
                const result = calculatePayoff(scenario.payment);
                const baseResult = calculatePayoff(debt.minimum_payment || 0);
                
                if (!result || !baseResult) return null;
                
                const interestSaved = baseResult.totalInterest - result.totalInterest;
                const timeSaved = baseResult.totalMonths - result.totalMonths;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{scenario.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(scenario.payment)}/mo
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-600">
                        {t("calculator.save")} {formatCurrency(interestSaved)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeSaved} {t("calculator.monthsEarlier")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}