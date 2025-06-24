import { z } from "zod";

// Database schema (PostgreSQL snake_case)
export const billReminderSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string(),
  recurring_transaction_id: z.string(),
  reminder_date: z.string(),
  due_date: z.string(),
  amount: z.number().positive(),
  name: z.string(),
  status: z.enum(["pending", "sent", "acknowledged", "paid", "overdue"]).default("pending"),
  notification_method: z.enum(["email", "push", "both"]).default("both"),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type BillReminder = z.infer<typeof billReminderSchema>;

// UI schema (camelCase)
export interface UIBillReminder {
  id?: string;
  userId: string;
  recurringTransactionId: string;
  reminderDate: string;
  dueDate: string;
  amount: number;
  name: string;
  status: "pending" | "sent" | "acknowledged" | "paid" | "overdue";
  notificationMethod: "email" | "push" | "both";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Transform functions
export function transformBillReminderToUI(reminder: BillReminder): UIBillReminder {
  return {
    id: reminder.id,
    userId: reminder.user_id,
    recurringTransactionId: reminder.recurring_transaction_id,
    reminderDate: reminder.reminder_date,
    dueDate: reminder.due_date,
    amount: reminder.amount,
    name: reminder.name,
    status: reminder.status,
    notificationMethod: reminder.notification_method,
    isActive: reminder.is_active,
    createdAt: reminder.created_at,
    updatedAt: reminder.updated_at,
  };
}

export function transformUIToBillReminder(
  uiReminder: Partial<UIBillReminder>
): Partial<BillReminder> {
  return {
    id: uiReminder.id,
    user_id: uiReminder.userId,
    recurring_transaction_id: uiReminder.recurringTransactionId,
    reminder_date: uiReminder.reminderDate,
    due_date: uiReminder.dueDate,
    amount: uiReminder.amount,
    name: uiReminder.name,
    status: uiReminder.status,
    notification_method: uiReminder.notificationMethod,
    is_active: uiReminder.isActive,
  };
}