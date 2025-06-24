"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UIRecurringTransaction } from "@/lib/db/schemas/recurring-transaction";
import { formatCurrency } from "@/lib/utils";

interface BillCalendarProps {
  recurringTransactions: UIRecurringTransaction[];
  onDayClick?: (date: Date, bills: UIRecurringTransaction[]) => void;
}

export function BillCalendar({ recurringTransactions, onDayClick }: BillCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Get day of week for first day of month (0 = Sunday)
  const startDay = monthStart.getDay();
  
  // Calculate bills for each day of the month
  const billsByDay = useMemo(() => {
    const bills: Record<string, UIRecurringTransaction[]> = {};
    
    recurringTransactions.forEach((transaction) => {
      if (!transaction.isActive || !transaction.isBill) return;
      
      // Check if bill occurs this month
      const dueDate = new Date(transaction.nextDueDate);
      if (dueDate.getMonth() === currentDate.getMonth() && 
          dueDate.getFullYear() === currentDate.getFullYear()) {
        const dayKey = dueDate.getDate().toString();
        if (!bills[dayKey]) bills[dayKey] = [];
        bills[dayKey].push(transaction);
      }
    });
    
    return bills;
  }, [recurringTransactions, currentDate]);

  const totalBillsThisMonth = useMemo(() => {
    return Object.values(billsByDay).reduce((sum, bills) => 
      sum + bills.reduce((billSum, bill) => billSum + bill.amount, 0), 0
    );
  }, [billsByDay]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
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
    
    let className = "aspect-square p-2 border border-gray-800 relative cursor-pointer transition-colors ";
    
    if (isToday) {
      className += "bg-emerald-900/20 border-emerald-600 ";
    } else if (hasBills) {
      className += "bg-gray-800/50 hover:bg-gray-800 ";
    } else {
      className += "hover:bg-gray-800/30 ";
    }
    
    return className;
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const handleDayClick = (day: number) => {
    if (onDayClick) {
      const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const bills = billsByDay[day.toString()] || [];
      onDayClick(clickedDate, bills);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
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
          <p className="text-sm text-gray-400">
            Total bills: {formatCurrency(totalBillsThisMonth)}
          </p>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-xs text-center text-gray-500 font-medium py-2"
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
            const totalAmount = dayBills.reduce((sum, bill) => sum + bill.amount, 0);

            return (
              <div
                key={day}
                className={getDayClassName(day)}
                onClick={() => handleDayClick(day)}
              >
                <div className="text-sm">{day}</div>
                {dayBills.length > 0 && (
                  <div className="absolute bottom-1 left-1 right-1">
                    <div className="text-xs text-emerald-500 font-medium">
                      {dayBills.length} bill{dayBills.length > 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-400">
                      ${totalAmount.toFixed(0)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-emerald-900/20 border border-emerald-600 rounded" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-800/50 border border-gray-800 rounded" />
            <span>Has bills</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}