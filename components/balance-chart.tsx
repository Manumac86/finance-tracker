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

// Sample data for the chart
const yearData = [
  { name: "Jan", balance: 4000 },
  { name: "Feb", balance: 4200 },
  { name: "Mar", balance: 5800 },
  { name: "Apr", balance: 5200 },
  { name: "May", balance: 6000 },
  { name: "Jun", balance: 5500 },
  { name: "Jul", balance: 6500 },
  { name: "Aug", balance: 7000 },
  { name: "Sep", balance: 7200 },
  { name: "Oct", balance: 7800 },
  { name: "Nov", balance: 8100 },
  { name: "Dec", balance: 8250 },
];

const monthData = [
  { name: "Week 1", balance: 7200 },
  { name: "Week 2", balance: 7400 },
  { name: "Week 3", balance: 7900 },
  { name: "Week 4", balance: 8250 },
];

const tenDaysData = [
  { name: "Day 1", balance: 8000 },
  { name: "Day 2", balance: 8050 },
  { name: "Day 3", balance: 8100 },
  { name: "Day 4", balance: 8000 },
  { name: "Day 5", balance: 8150 },
  { name: "Day 6", balance: 8200 },
  { name: "Day 7", balance: 8180 },
  { name: "Day 8", balance: 8220 },
  { name: "Day 9", balance: 8240 },
  { name: "Day 10", balance: 8250 },
];

export function BalanceChart() {
  const [period, setPeriod] = useState("year");
  const t = useTranslations("dates");

  const data =
    period === "year" ? yearData : period === "month" ? monthData : tenDaysData;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="year" onValueChange={setPeriod} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="year">
            {t("lastYear")}
          </TabsTrigger>
          <TabsTrigger
            value="month"
          >
            {t("lastMonth")}
          </TabsTrigger>
          <TabsTrigger
            value="tenDays"
          >
            {t("last10Days")}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
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
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" stroke="currentColor" />
            <XAxis dataKey="name" className="stroke-muted-foreground" stroke="currentColor" />
            <YAxis className="stroke-muted-foreground" stroke="currentColor" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                color: "hsl(var(--foreground))",
              }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value) => [`$${value}`, "Balance"]}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorBalance)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
