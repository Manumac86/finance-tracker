"use client";

import { useState } from "react";
import { Plus, Calendar, DollarSign, Bell, Repeat } from "lucide-react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RecurringTransactionModal, RecurringTransactionFormData } from "@/components/recurring/recurring-transaction-modal";
import { BillCalendar } from "@/components/recurring/bill-calendar";
import { UIRecurringTransaction } from "@/lib/db/schemas/recurring-transaction";
import { UIBillReminder } from "@/lib/db/schemas/bill-reminder";
import { formatCurrency } from "@/lib/utils";
import { formatDueDate, getDaysUntilDue, getFrequencyLabel } from "@/lib/utils/recurring-dates";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function RecurringTransactionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<UIRecurringTransaction | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { data: recurringData, error: recurringError, mutate: mutateRecurring } = useSWR<{
    recurringTransactions: UIRecurringTransaction[];
  }>("/api/recurring-transactions", fetcher);

  const { data: remindersData, error: remindersError, mutate: mutateReminders } = useSWR<{
    billReminders: UIBillReminder[];
  }>("/api/bill-reminders?upcoming=true", fetcher);

  const recurringTransactions = recurringData?.recurringTransactions || [];
  const billReminders = remindersData?.billReminders || [];

  const bills = recurringTransactions.filter((t) => t.isBill);
  const subscriptions = recurringTransactions.filter((t) => !t.isBill);

  const handleCreateTransaction = async (formData: RecurringTransactionFormData) => {
    try {
      const response = await fetch("/api/recurring-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        mutateRecurring();
        mutateReminders();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error creating recurring transaction:", error);
    }
  };

  const handleUpdateTransaction = async (formData: RecurringTransactionFormData) => {
    if (!selectedTransaction?.id) return;

    try {
      const response = await fetch(`/api/recurring-transactions/${selectedTransaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        mutateRecurring();
        mutateReminders();
        setIsModalOpen(false);
        setSelectedTransaction(null);
      }
    } catch (error) {
      console.error("Error updating recurring transaction:", error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recurring transaction?")) return;

    try {
      const response = await fetch(`/api/recurring-transactions/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        mutateRecurring();
        mutateReminders();
      }
    } catch (error) {
      console.error("Error deleting recurring transaction:", error);
    }
  };

  const handleUpdateReminder = async (reminderId: string, status: string) => {
    try {
      const response = await fetch("/api/bill-reminders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderId, status }),
      });

      if (response.ok) {
        mutateReminders();
        if (status === "paid") {
          // Refresh transactions if a bill was marked as paid
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Error updating reminder:", error);
    }
  };

  const upcomingBills = billReminders.filter((r) => r.status === "pending").slice(0, 5);

  const totalMonthlyBills = bills.reduce((sum, bill) => {
    if (bill.frequency === "monthly") return sum + bill.amount;
    if (bill.frequency === "weekly") return sum + bill.amount * 4.33;
    if (bill.frequency === "biweekly") return sum + bill.amount * 2.17;
    if (bill.frequency === "quarterly") return sum + bill.amount / 3;
    if (bill.frequency === "yearly") return sum + bill.amount / 12;
    return sum;
  }, 0);

  if (recurringError || remindersError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error loading data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring Transactions</h1>
          <p className="text-gray-400">Manage your bills and recurring payments</p>
        </div>
        <Button
          onClick={() => {
            setSelectedTransaction(null);
            setIsModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Recurring
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Monthly Bills</p>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyBills)}</div>
            <p className="text-xs text-gray-400 mt-1">{bills.length} active bills</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Upcoming</p>
              <Bell className="w-4 h-4 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingBills.length}</div>
            <p className="text-xs text-gray-400 mt-1">bills due soon</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Subscriptions</p>
              <Repeat className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
            <p className="text-xs text-gray-400 mt-1">active subscriptions</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Total Active</p>
              <Calendar className="w-4 h-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recurringTransactions.length}</div>
            <p className="text-xs text-gray-400 mt-1">recurring items</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transactions List */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="bills">Bills</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {recurringTransactions.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="text-center py-12">
                    <Repeat className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No recurring transactions</h3>
                    <p className="text-gray-400 mb-6">
                      Add bills and subscriptions to track them automatically
                    </p>
                    <Button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Recurring Transaction
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                recurringTransactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={() => {
                      setSelectedTransaction(transaction);
                      setIsModalOpen(true);
                    }}
                    onDelete={() => handleDeleteTransaction(transaction.id!)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="bills" className="space-y-4">
              {bills.length === 0 ? (
                <EmptyState type="bills" onAdd={() => setIsModalOpen(true)} />
              ) : (
                bills.map((bill) => (
                  <TransactionCard
                    key={bill.id}
                    transaction={bill}
                    onEdit={() => {
                      setSelectedTransaction(bill);
                      setIsModalOpen(true);
                    }}
                    onDelete={() => handleDeleteTransaction(bill.id!)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-4">
              {subscriptions.length === 0 ? (
                <EmptyState type="subscriptions" onAdd={() => setIsModalOpen(true)} />
              ) : (
                subscriptions.map((sub) => (
                  <TransactionCard
                    key={sub.id}
                    transaction={sub}
                    onEdit={() => {
                      setSelectedTransaction(sub);
                      setIsModalOpen(true);
                    }}
                    onDelete={() => handleDeleteTransaction(sub.id!)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Calendar and Reminders */}
        <div className="space-y-6">
          <BillCalendar recurringTransactions={recurringTransactions} />

          {/* Upcoming Reminders */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Upcoming Bills
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBills.length === 0 ? (
                <p className="text-gray-400 text-sm">No upcoming bills</p>
              ) : (
                <div className="space-y-3">
                  {upcomingBills.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">{reminder.name}</div>
                        <div className="text-xs text-gray-400">
                          {formatDueDate(reminder.dueDate)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">
                          {formatCurrency(reminder.amount)}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateReminder(reminder.id!, "paid")}
                          className="h-7 text-xs"
                        >
                          Mark Paid
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal */}
      <RecurringTransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTransaction(null);
        }}
        onSave={selectedTransaction ? handleUpdateTransaction : handleCreateTransaction}
        initialData={selectedTransaction ? {
          name: selectedTransaction.name,
          description: selectedTransaction.description || "",
          amount: selectedTransaction.amount.toString(),
          transactionType: selectedTransaction.transactionType,
          categoryId: selectedTransaction.categoryId,
          frequency: selectedTransaction.frequency,
          startDate: selectedTransaction.startDate || "",
          endDate: selectedTransaction.endDate || "",
          isBill: selectedTransaction.isBill,
          reminderDaysBefore: selectedTransaction.reminderDaysBefore,
          autoCreateTransaction: selectedTransaction.autoCreateTransaction,
        } : undefined}
      />
    </div>
  );
}

// Transaction Card Component
function TransactionCard({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: UIRecurringTransaction;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const daysUntil = getDaysUntilDue(transaction.nextDueDate);
  const isOverdue = daysUntil < 0;
  const isDueSoon = daysUntil >= 0 && daysUntil <= 3;

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{transaction.name}</h4>
              {transaction.isBill && (
                <Badge variant="secondary" className="text-xs">
                  Bill
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}
              {isDueSoon && !isOverdue && (
                <Badge variant="secondary" className="text-xs bg-yellow-900/20 text-yellow-300">
                  Due Soon
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{formatCurrency(transaction.amount)}</span>
              <span>{getFrequencyLabel(transaction.frequency)}</span>
              <span>Next: {formatDueDate(transaction.nextDueDate)}</span>
            </div>
            {transaction.description && (
              <p className="text-sm text-gray-500 mt-1">{transaction.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Edit</span>
              ✏️
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-400"
            >
              <span className="sr-only">Delete</span>
              🗑️
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState({ type, onAdd }: { type: string; onAdd: () => void }) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="text-center py-12">
        <div className="text-gray-400 mb-4">
          {type === "bills" ? "No bills added yet" : "No subscriptions added yet"}
        </div>
        <Button onClick={onAdd} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Add {type === "bills" ? "Bill" : "Subscription"}
        </Button>
      </CardContent>
    </Card>
  );
}