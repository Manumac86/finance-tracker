"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UIRecurringTransaction } from "@/lib/db/schemas/recurring-transaction";
import { formatCurrency } from "@/lib/utils";

interface BillCalendarProps {
  recurringTransactions: UIRecurringTransaction[];
}

export function BillCalendar({ recurringTransactions }: BillCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const monthEnd = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  // Get day of week for first day of month (0 = Sunday)
  const startDay = monthStart.getDay();

  // Calculate bills for each day of the month
  const billsByDay = useMemo(() => {
    const bills: Record<string, UIRecurringTransaction[]> = {};

    recurringTransactions.forEach((transaction) => {
      if (!transaction.isActive) return;

      // Check if bill occurs this month
      const dueDate = new Date(transaction.nextDueDate);
      if (
        dueDate.getMonth() === currentDate.getMonth() &&
        dueDate.getFullYear() === currentDate.getFullYear()
      ) {
        const dayKey = dueDate.getDate().toString();
        if (!bills[dayKey]) bills[dayKey] = [];
        bills[dayKey].push(transaction);
      }
    });

    return bills;
  }, [recurringTransactions, currentDate]);

  const totalBillsThisMonth = useMemo(() => {
    return Object.values(billsByDay).reduce(
      (sum, bills) =>
        sum + bills.reduce((billSum, bill) => billSum + bill.amount, 0),
      0
    );
  }, [billsByDay]);

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDayClassName = (day: number) => {
    const today = new Date();
    const isToday =
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();

    const hasBills = billsByDay[day.toString()];

    let className =
      "aspect-square px-[4px] border border-border relative cursor-pointer transition-colors rounded-md overflow-hidden ";

    if (isToday) {
      className += "bg-emerald-500/10 border-emerald-600 ";
    } else if (hasBills) {
      className += "bg-muted/50 hover:bg-muted ";
    } else {
      className += "hover:bg-muted/30 ";
    }

    return className;
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Bill Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-xs"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month Header */}
        <div className="text-center">
          <h3 className="text-lg font-medium">{formatMonth(currentDate)}</h3>
          <p className="text-sm text-muted-foreground">
            Total bills: {formatCurrency(totalBillsThisMonth)}
          </p>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Day Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-xs text-center text-muted-foreground font-medium py-2"
            >
              {day}
            </div>
          ))}

          {/* Empty cells before month starts */}
          {Array.from({ length: startDay }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: monthEnd.getDate() }).map((_, index) => {
            const day = index + 1;
            const dayBills = billsByDay[day.toString()] || [];
            const totalAmount = dayBills.reduce(
              (sum, bill) => sum + bill.amount,
              0
            );

            const tooltipText =
              dayBills.length > 0
                ? `Bills on ${new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    day
                  ).toLocaleDateString()}:\n${dayBills
                    .map(
                      (bill) => `• ${bill.name}: ${formatCurrency(bill.amount)}`
                    )
                    .join("\n")}\n\nTotal: ${formatCurrency(totalAmount)}`
                : "";

            return (
              <div
                key={day}
                className={getDayClassName(day)}
                title={tooltipText}
              >
                <div className="flex flex-col h-full">
                  <div className="text-sm font-medium">{day}</div>
                  {dayBills.length > 0 && (
                    <div className="flex items-center gap-0.5 w-full max-w-full justify-center">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                      <div className="text-xs text-muted-foreground w-full max-w-full">
                        <span className="px-0.5 text-center">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-emerald-500/10 border border-emerald-600 rounded" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-muted/50 border border-border rounded" />
            <span>Has bills</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
