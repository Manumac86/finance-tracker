"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";

interface BalanceDataPoint {
  date: string;
  balance: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch balance history");
  }
  const data = await res.json();
  return data.data;
};

export function BalanceChart() {
  const [period, setPeriod] = useState<"year" | "month" | "week">("year");
  const t = useTranslations("dates");

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

  // Transform data for the chart
  const chartData =
    balanceData?.map((point) => ({
      name: point.date,
      balance: point.balance,
    })) || [];

  return (
    <div className="space-y-4">
      <Tabs
        defaultValue="year"
        onValueChange={(value) => setPeriod(value as "year" | "month" | "week")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="year">{t("lastYear")}</TabsTrigger>
          <TabsTrigger value="month">{t("thisMonth")}</TabsTrigger>
          <TabsTrigger value="week">{t("lastWeek")}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="h-[300px] w-full">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>Unable to load balance history</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>No balance data available for {period}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
                stroke="currentColor"
              />
              <XAxis
                dataKey="name"
                className="stroke-muted-foreground"
                stroke="currentColor"
              />
              <YAxis
                className="stroke-muted-foreground"
                stroke="currentColor"
                domain={["auto", "auto"]}
                allowDecimals={true}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value) => [
                  `$${Number(value).toFixed(2)}`,
                  "Balance",
                ]}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={0.6}
                fill="url(#colorBalance)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
