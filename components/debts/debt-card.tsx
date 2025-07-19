"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { 
  CreditCard, 
  Home, 
  GraduationCap, 
  DollarSign, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Percent
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type Debt } from "@/lib/db/schemas/debt";
import { useDebts } from "@/contexts/debts";

interface DebtCardProps {
  debt: Debt;
  onEdit: (debt: Debt) => void;
  onView: (debt: Debt) => void;
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

export function DebtCard({ debt, onEdit, onView }: DebtCardProps) {
  const t = useTranslations("debts");
  const { deleteDebt } = useDebts();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const Icon = debtTypeIcons[debt.debt_type];
  const colorClass = debtTypeColors[debt.debt_type];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDebt(debt.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting debt:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const paymentStatus = getPaymentStatus();
  const payoffProgress = calculatePayoffProgress();

  return (
    <>
      <Card className={`transition-all duration-200 hover:shadow-md ${
        !debt.is_active ? "opacity-60" : ""
      }`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{debt.name}</h3>
              <p className="text-xs text-muted-foreground">
                {t(`types.${debt.debt_type}`)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!debt.is_active && (
              <Badge variant="secondary" className="text-xs">
                {t("status.inactive")}
              </Badge>
            )}
            
            {paymentStatus && (
              <Badge 
                variant={paymentStatus.status === "overdue" ? "destructive" : 
                        paymentStatus.status === "due_soon" ? "secondary" : "outline"}
                className="text-xs"
              >
                {paymentStatus.status === "overdue" ? 
                  t("status.overdue", { days: paymentStatus.days }) :
                  paymentStatus.status === "due_soon" ?
                  t("status.dueSoon", { days: paymentStatus.days }) :
                  t("status.ok")
                }
              </Badge>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(debt)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t("actions.view")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(debt)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t("actions.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("actions.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {/* Balance Information */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(debt.current_balance)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("card.currentBalance")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {formatCurrency(debt.original_amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("card.originalAmount")}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{t("card.payoffProgress")}</span>
                <span>{payoffProgress.toFixed(1)}%</span>
              </div>
              <Progress value={payoffProgress} className="h-2" />
            </div>

            {/* Payment Information */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  <span>{t("card.minPayment")}</span>
                </div>
                <p className="font-medium">
                  {debt.minimum_payment ? formatCurrency(debt.minimum_payment) : t("card.notSet")}
                </p>
              </div>
              
              <div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Percent className="h-3 w-3" />
                  <span>{t("card.interestRate")}</span>
                </div>
                <p className="font-medium">
                  {debt.interest_rate ? `${debt.interest_rate}%` : t("card.notSet")}
                </p>
              </div>
            </div>

            {/* Due Date */}
            {debt.due_date && (
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{t("card.dueDate")}:</span>
                <span className="font-medium">{formatDate(debt.due_date)}</span>
              </div>
            )}

            {/* Lender */}
            {debt.lender_name && (
              <div className="text-sm">
                <span className="text-muted-foreground">{t("card.lender")}:</span>
                <span className="font-medium ml-1">{debt.lender_name}</span>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onView(debt)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" />
                {t("actions.viewDetails")}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(debt)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-1" />
                {t("actions.edit")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.description", { name: debt.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("delete.deleting") : t("delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}