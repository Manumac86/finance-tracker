"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "next-intl";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { useDebts } from "@/contexts/debts";
import { TrendingDown, CreditCard } from "lucide-react";
import { localeConfig } from "@/i18n/routing";

interface DebtDataPoint {
  date: string;
  totalDebt: number;
  activeDebts: number;
  minimumPayments: number;
}

const chartConfig = {
  totalDebt: {
    label: "Total Debt",
    color: "hsl(var(--destructive))",
  },
  minimumPayments: {
    label: "Monthly Payments",
    color: "hsl(var(--warning))",
  },
} satisfies ChartConfig;

interface DebtProgressChartProps {
  timeFilter?: string;
}

export function DebtProgressChart({ timeFilter = "month" }: DebtProgressChartProps) {
  const locale = useLocale();
  const { debts, summary, isLoading, error } = useDebts();
  const [chartData, setChartData] = useState<DebtDataPoint[]>([]);

  const formatCurrency = (amount: number) => {
    const currentLocaleConfig = localeConfig[locale as keyof typeof localeConfig];
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currentLocaleConfig.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    if (!debts || !summary) return;

    // Generate mock historical data for demonstration
    // In a real app, this would come from an API with historical debt data
    const generateMockData = () => {
      const data: DebtDataPoint[] = [];
      const currentDate = new Date();
      const months = timeFilter === "year" ? 12 : timeFilter === "quarter" ? 3 : 1;
      
      for (let i = months; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setMonth(date.getMonth() - i);
        
        // Simulate debt reduction over time
        const progressFactor = i / months;
        const totalDebt = summary.total_debt * (0.8 + progressFactor * 0.2);
        
        data.push({
          date: date.toISOString().split('T')[0],
          totalDebt: Math.round(totalDebt),
          activeDebts: summary.active_debts_count,
          minimumPayments: summary.total_minimum_payments,
        });
      }
      
      return data;
    };

    setChartData(generateMockData());
  }, [debts, summary, timeFilter]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Debt Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (error || !debts || debts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Debt Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Debts Found</h3>
            <p className="text-sm text-muted-foreground">
              Start tracking your debt progress by adding your first debt.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentTotal = summary?.total_debt || 0;
  const previousTotal = chartData.length > 1 ? chartData[chartData.length - 2].totalDebt : currentTotal;
  const reduction = previousTotal - currentTotal;
  const reductionPercent = previousTotal > 0 ? (reduction / previousTotal) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Debt Progress
        </CardTitle>
        {reduction > 0 && (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <TrendingDown className="w-4 h-4" />
            <span>
              {formatCurrency(reduction)} reduction ({reductionPercent.toFixed(1)}%)
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString(locale, { 
                  month: 'short',
                  day: 'numeric'
                });
              }}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  formatter={(value, name) => [
                    formatCurrency(Number(value)),
                    name === 'totalDebt' ? 'Total Debt' : 'Monthly Payments'
                  ]}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                  }}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="totalDebt"
              stroke="hsl(var(--destructive))"
              fill="hsl(var(--destructive))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            {currentTotal > 0 && (
              <ReferenceLine 
                y={0} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="2 2"
                label="Debt-Free Goal"
              />
            )}
          </AreaChart>
        </ChartContainer>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Current Debt</div>
            <div className="font-semibold text-orange-600">
              {formatCurrency(currentTotal)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Active Debts</div>
            <div className="font-semibold">
              {summary?.active_debts_count || 0}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Monthly Min.</div>
            <div className="font-semibold">
              {formatCurrency(summary?.total_minimum_payments || 0)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}