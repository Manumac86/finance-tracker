"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { 
  ArrowLeft,
  CreditCard,
  DollarSign,
  Edit,
  Home,
  GraduationCap,
  Plus,
  TrendingDown,
  TrendingUp,
  Target,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  BarChart3,
  Calculator
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { type Debt } from "@/lib/db/schemas/debt";
import { useDebt } from "@/contexts/debts";
import { PaymentHistoryChart } from "./payment-history-chart";
import { PaymentForm } from "./payment-form";
import { PaymentScheduleCalculator } from "./payment-schedule-calculator";

interface DebtDetailViewProps {
  debtId: string;
  onBack: () => void;
  onEdit: (debt: Debt) => void;
}

const debtTypeIcons = {
  credit_card: CreditCard,
  loan: DollarSign,
  mortgage: Home,
  student_loan: GraduationCap,
  other: DollarSign,
};

const debtTypeColors = {
  credit_card: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  loan: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", 
  mortgage: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  student_loan: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export function DebtDetailView({ debtId, onBack, onEdit }: DebtDetailViewProps) {
  const t = useTranslations("debts");
  const { debt, payments, isLoading, error, recordPayment } = useDebt(debtId);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  if (isLoading) {
    return <DebtDetailSkeleton />;
  }

  if (error || !debt) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("error.loadingDebt")}</h3>
            <p className="text-muted-foreground mb-4">{t("error.debtNotFound")}</p>
            <Button onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("actions.goBack")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const Icon = debtTypeIcons[debt.debt_type];
  const colorClass = debtTypeColors[debt.debt_type];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPaymentStatus = () => {
    if (!debt.due_date) return null;
    
    const dueDate = new Date(debt.due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: "overdue", days: Math.abs(diffDays) };
    } else if (diffDays <= 7) {
      return { status: "due_soon", days: diffDays };
    }
    return { status: "ok", days: diffDays };
  };

  const calculatePayoffProgress = () => {
    if (debt.original_amount === 0) return 0;
    const paidAmount = debt.original_amount - debt.current_balance;
    return Math.max(0, Math.min(100, (paidAmount / debt.original_amount) * 100));
  };

  const calculateMonthsToPayoff = () => {
    if (!debt.minimum_payment || debt.minimum_payment <= 0 || !debt.interest_rate) {
      return null;
    }
    
    const monthlyRate = debt.interest_rate / 100 / 12;
    const payment = debt.minimum_payment;
    const balance = debt.current_balance;
    
    if (payment <= balance * monthlyRate) {
      return null; // Never pays off
    }
    
    const months = Math.ceil(
      -Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate)
    );
    
    return months;
  };

  const paymentStatus = getPaymentStatus();
  const payoffProgress = calculatePayoffProgress();
  const monthsToPayoff = calculateMonthsToPayoff();
  const totalPaid = debt.original_amount - debt.current_balance;
  const totalPayments = payments?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("actions.back")}
          </Button>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{debt.name}</h1>
              <p className="text-muted-foreground">{t(`types.${debt.debt_type}`)}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!debt.is_active && (
            <Badge variant="secondary">{t("status.inactive")}</Badge>
          )}
          {paymentStatus && (
            <Badge 
              variant={paymentStatus.status === "overdue" ? "destructive" : 
                      paymentStatus.status === "due_soon" ? "secondary" : "outline"}
            >
              {paymentStatus.status === "overdue" ? 
                t("status.overdue", { days: paymentStatus.days }) :
                paymentStatus.status === "due_soon" ?
                t("status.dueSoon", { days: paymentStatus.days }) :
                t("status.ok")
              }
            </Badge>
          )}
          <Button onClick={() => onEdit(debt)}>
            <Edit className="h-4 w-4 mr-2" />
            {t("actions.edit")}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("detail.currentBalance")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(debt.current_balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("detail.of")} {formatCurrency(debt.original_amount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("detail.totalPaid")}</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalPayments} {t("detail.payments")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("detail.interestRate")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {debt.interest_rate ? `${debt.interest_rate}%` : t("detail.notSet")}
            </div>
            <p className="text-xs text-muted-foreground">
              {debt.interest_rate ? 
                `${formatCurrency((debt.current_balance * debt.interest_rate / 100) / 12)}/mo` : 
                t("detail.noInterest")
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("detail.timeToPayoff")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthsToPayoff ? 
                `${Math.floor(monthsToPayoff / 12)}y ${monthsToPayoff % 12}m` : 
                t("detail.unknown")
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {debt.minimum_payment ? 
                `${formatCurrency(debt.minimum_payment)}/mo` : 
                t("detail.noMinPayment")
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t("detail.payoffProgress")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t("detail.progress")}</span>
              <span className="font-medium">{payoffProgress.toFixed(1)}%</span>
            </div>
            <Progress value={payoffProgress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(0)}</span>
              <span>{formatCurrency(debt.original_amount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debt Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("detail.debtDetails")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("detail.lender")}
                </label>
                <p className="text-sm">{debt.lender_name || t("detail.notSpecified")}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("detail.minimumPayment")}
                </label>
                <p className="text-sm">
                  {debt.minimum_payment ? formatCurrency(debt.minimum_payment) : t("detail.notSet")}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("detail.paymentDay")}
                </label>
                <p className="text-sm">
                  {debt.payment_day ? 
                    t("detail.dayOfMonth", { day: debt.payment_day }) : 
                    t("detail.notSet")
                  }
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("detail.dueDate")}
                </label>
                <p className="text-sm">
                  {debt.due_date ? formatDate(debt.due_date) : t("detail.notSet")}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("detail.createdDate")}
                </label>
                <p className="text-sm">{formatDate(debt.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("detail.status")}
                </label>
                <p className="text-sm flex items-center gap-2">
                  {debt.is_active ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      {t("detail.active")}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      {t("detail.inactive")}
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
          {debt.notes && (
            <div className="mt-4 pt-4 border-t">
              <label className="text-sm font-medium text-muted-foreground">
                {t("detail.notes")}
              </label>
              <p className="text-sm mt-1">{debt.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payments">{t("detail.tabs.payments")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("detail.tabs.analytics")}</TabsTrigger>
          <TabsTrigger value="calculator">{t("detail.tabs.calculator")}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t("detail.paymentHistory")}</h3>
            <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("detail.recordPayment")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("detail.recordPayment")}</DialogTitle>
                  <DialogDescription>
                    {t("detail.recordPaymentDescription")}
                  </DialogDescription>
                </DialogHeader>
                <PaymentForm 
                  debt={debt} 
                  onSubmit={recordPayment} 
                  onCancel={() => setShowPaymentForm(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          {payments && payments.length > 0 ? (
            <div className="space-y-4">
              {payments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(payment.payment_date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {t("detail.balanceAfter")}: {formatCurrency(payment.balance_after || 0)}
                        </p>
                        {payment.notes && (
                          <p className="text-xs text-muted-foreground">{payment.notes}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t("detail.noPayments")}</h3>
                <p className="text-muted-foreground mb-4">
                  {t("detail.noPaymentsDescription")}
                </p>
                <Button onClick={() => setShowPaymentForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("detail.recordFirstPayment")}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{t("detail.paymentAnalytics")}</h3>
          </div>
          <PaymentHistoryChart payments={payments} debt={debt} />
        </TabsContent>
        
        <TabsContent value="calculator" className="space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{t("detail.paymentCalculator")}</h3>
          </div>
          <PaymentScheduleCalculator debt={debt} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DebtDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-16" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}