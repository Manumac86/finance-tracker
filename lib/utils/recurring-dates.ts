export type Frequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export function calculateNextDueDate(
  startDate: string | Date,
  frequency: Frequency,
  fromDate?: string | Date
): string {
  const start = new Date(startDate);
  const from = fromDate ? new Date(fromDate) : new Date();

  // If start date is in the future, return it as the next due date
  if (start > from) {
    return start.toISOString().split("T")[0];
  }

  const next = new Date(start);

  // Calculate the next occurrence after 'from' date
  while (next <= from) {
    switch (frequency) {
      case "daily":
        next.setDate(next.getDate() + 1);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "biweekly":
        next.setDate(next.getDate() + 14);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "quarterly":
        next.setMonth(next.getMonth() + 3);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
  }

  return next.toISOString().split("T")[0];
}

export function getFrequencyLabel(frequency: Frequency): string {
  const labels: Record<Frequency, string> = {
    daily: "Daily",
    weekly: "Weekly",
    biweekly: "Every 2 weeks",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
  };
  return labels[frequency];
}

export function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

export function formatDueDate(dueDate: string): string {
  const days = getDaysUntilDue(dueDate);

  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days === -1) return "Due yesterday";
  if (days < -1) return `${Math.abs(days)} days overdue`;
  if (days < 7) return `Due in ${days} days`;

  const date = new Date(dueDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

export function getUpcomingDates(
  startDate: string,
  frequency: Frequency,
  count: number = 5
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const today = new Date();

  // If start date is in the future, use it as the first occurrence
  const currentDate =
    start > today
      ? new Date(start)
      : new Date(calculateNextDueDate(startDate, frequency));

  for (let i = 0; i < count; i++) {
    dates.push(currentDate.toISOString().split("T")[0]);

    // Calculate next occurrence
    switch (frequency) {
      case "daily":
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case "weekly":
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case "biweekly":
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case "quarterly":
        currentDate.setMonth(currentDate.getMonth() + 3);
        break;
      case "yearly":
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
    }
  }

  return dates;
}
