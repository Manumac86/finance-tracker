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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import useSWR from "swr";
import { TrendingUp } from "lucide-react";

interface BalanceDataPoint {
  date: string;
  balance: number;
}

const chartConfig = {
  balance: {
    label: "Balance",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch balance history");
  }
  const data = await res.json();
  return data.data;
};

interface BalanceChartProps {
  timeFilter?: string;
}

export function BalanceChart({ timeFilter = "week" }: BalanceChartProps) {
  const [period, setPeriod] = useState<"year" | "month" | "week">(
    timeFilter === "week" ? "week" : timeFilter === "month" ? "month" : "week"
  );
  const t = useTranslations("dates");
  const tDashboard = useTranslations("dashboard");

  // Sync period with timeFilter changes from dashboard
  useEffect(() => {
    const newPeriod =
      timeFilter === "week"
        ? "week"
        : timeFilter === "month"
        ? "month"
        : "week";
    setPeriod(newPeriod);
  }, [timeFilter]);

  const {
    data: balanceData,
    error,
    isLoading,
  } = useSWR<BalanceDataPoint[]>(
    `/api/balance-history?period=${period}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  // Use the balance data directly since we've fixed the API to exclude future transactions
  const adjustedBalanceData = balanceData;

  // Transform data for the chart using adjusted data
  const chartData =
    adjustedBalanceData?.map((point) => ({
      date: point.date,
      balance: point.balance,
    })) || [];

  // Calculate dynamic Y-axis domain
  const balanceValues = chartData.map((d) => d.balance);
  const minBalance = Math.min(...balanceValues, 0);
  const maxBalance = Math.max(...balanceValues, 0);
  const padding = Math.max(Math.abs(minBalance), Math.abs(maxBalance)) * 0.1;
  const yAxisDomain = [minBalance - padding, maxBalance + padding];

  // Format x-axis labels based on period
  const formatXAxis = (value: string) => {
    if (period === "month") {
      // For monthly view, show day numbers
      const date = new Date(value);
      return date.getDate().toString();
    } else if (period === "week") {
      // For weekly view, show abbreviated day names
      const date = new Date(value);
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      // For yearly view, show abbreviated month names
      return value.slice(0, 3);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          {tDashboard("currentBalance")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          value={period}
          onValueChange={(value) =>
            setPeriod(value as "year" | "month" | "week")
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="year">{t("lastYear")}</TabsTrigger>
            <TabsTrigger value="month">{t("thisMonth")}</TabsTrigger>
            <TabsTrigger value="week">{t("lastWeek")}</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-full">
          {isLoading ? (
            <div className="h-[300px]">
              <ChartSkeleton />
            </div>
          ) : error ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              <p>Unable to load balance history</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              <p>No balance data available for {period}</p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="w-full max-w-full">
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: 12,
                  right: 12,
                  top: 12,
                  bottom: 12,
                }}
              >
                <defs>
                  <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatXAxis}
                />
                <YAxis
                  domain={yAxisDomain}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
                />
                {/* Zero reference line */}
                <ReferenceLine
                  y={0}
                  stroke="hsl(var(--border))"
                  strokeDasharray="2 2"
                  strokeOpacity={0.5}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                  formatter={(value) => [
                    `$${Number(value).toFixed(2)}`,
                    "Balance",
                  ]}
                />
                <Area
                  dataKey="balance"
                  type="natural"
                  fill="url(#fillBalance)"
                  fillOpacity={0.4}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
