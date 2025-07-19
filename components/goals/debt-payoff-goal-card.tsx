"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { 
  Target,
  CreditCard,
  TrendingDown,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Clock
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
import { useDebts } from "@/contexts/debts";

interface DebtPayoffGoalCardProps {
  goal: {
    id: string;
    name: string;
    description?: string;
    type: string;
    target_amount: number;
    current_amount: number;
    target_date?: string;
    progress?: number;
    is_active: boolean;
    metadata?: {
      debt_id?: string;
      debt_name?: string;
      strategy?: string;
      extra_payment_amount?: number;
      projected_months?: number;
      projected_total_interest?: number;
      monthly_payment?: number;
      interest_saved?: number;
      months_saved?: number;
    };
    created_at: string;
    achieved_at?: string;
  };
  onEdit?: (goal: DebtPayoffGoalCardProps['goal']) => void;
  onDelete?: (goalId: string) => void;
  onClick?: () => void;
}

export function DebtPayoffGoalCard({ goal, onEdit, onDelete, onClick }: DebtPayoffGoalCardProps) {
  const t = useTranslations("goals");
  const { debts } = useDebts();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getLinkedDebt = () => {
    if (!goal.metadata?.debt_id || !debts) return null;
    return debts.find(debt => debt.id === goal.metadata?.debt_id);
  };

  const calculateActualProgress = () => {
    const linkedDebt = getLinkedDebt();
    if (!linkedDebt) return goal.progress || 0;

    // Calculate actual progress based on debt balance
    const paidAmount = linkedDebt.original_amount - linkedDebt.current_balance;
    return (paidAmount / linkedDebt.original_amount) * 100;
  };

  const getGoalStatus = () => {
    if (goal.achieved_at) return "achieved";
    if (!goal.is_active) return "paused";
    
    const actualProgress = calculateActualProgress();
    const linkedDebt = getLinkedDebt();
    
    if (linkedDebt && linkedDebt.current_balance === 0) return "achieved";
    if (goal.target_date) {
      const targetDate = new Date(goal.target_date);
      const today = new Date();
      const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining < 0) return "overdue";
      if (daysRemaining <= 30 && actualProgress < 80) return "at_risk";
    }
    
    return "on_track";
  };

  const getStatusBadge = () => {
    const status = getGoalStatus();
    
    switch (status) {
      case "achieved":
        return <Badge className="bg-emerald-500 text-white">{t("status.achieved")}</Badge>;
      case "paused":
        return <Badge variant="secondary">{t("status.paused")}</Badge>;
      case "overdue":
        return <Badge variant="destructive">{t("status.overdue")}</Badge>;
      case "at_risk":
        return <Badge className="bg-yellow-500 text-white">{t("status.atRisk")}</Badge>;
      default:
        return <Badge variant="outline">{t("status.onTrack")}</Badge>;
    }
  };

  const getTimeRemaining = () => {
    if (!goal.target_date) return null;
    
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.ceil(diffDays / 30);
    
    if (diffDays < 0) return { type: "overdue", value: Math.abs(diffDays), unit: "days" };
    if (diffDays <= 60) return { type: "days", value: diffDays, unit: "days" };
    return { type: "months", value: diffMonths, unit: "months" };
  };

  const getProjectedSavings = () => {
    const metadata = goal.metadata;
    if (!metadata?.interest_saved || !metadata?.months_saved) return null;
    
    return {
      interestSaved: metadata.interest_saved,
      monthsSaved: metadata.months_saved,
      monthlyPayment: metadata.monthly_payment || 0,
    };
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(goal.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting goal:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const actualProgress = calculateActualProgress();
  const timeRemaining = getTimeRemaining();
  const projectedSavings = getProjectedSavings();
  const linkedDebt = getLinkedDebt();
  const status = getGoalStatus();

  return (
    <>
      <Card 
        className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
          !goal.is_active ? "opacity-60" : ""
        } ${status === "achieved" ? "ring-2 ring-emerald-200" : ""}`}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              status === "achieved" ? "bg-emerald-100 text-emerald-600" :
              status === "at_risk" ? "bg-yellow-100 text-yellow-600" :
              status === "overdue" ? "bg-red-100 text-red-600" :
              "bg-blue-100 text-blue-600"
            }`}>
              {status === "achieved" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Target className="h-4 w-4" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{goal.name}</h3>
              <p className="text-xs text-muted-foreground">
                {goal.metadata?.debt_name || t("debtPayoff.goal")}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEdit(goal);
                  }}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t("actions.edit")}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("actions.delete")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Progress Section */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{t("debtPayoff.payoffProgress")}</span>
                <span className="font-medium">{actualProgress.toFixed(1)}%</span>
              </div>
              <Progress value={actualProgress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatCurrency(goal.current_amount)}</span>
                <span>{formatCurrency(goal.target_amount)}</span>
              </div>
            </div>

            {/* Current Debt Info */}
            {linkedDebt && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{linkedDebt.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">{t("debtPayoff.currentBalance")}</p>
                    <p className="font-semibold text-destructive">
                      {formatCurrency(linkedDebt.current_balance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("debtPayoff.interestRate")}</p>
                    <p className="font-semibold">
                      {linkedDebt.interest_rate ? `${linkedDebt.interest_rate}%` : t("common.notSet")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {goal.target_date && (
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{t("debtPayoff.targetDate")}</span>
                  </div>
                  <p className="font-medium">{formatDate(goal.target_date)}</p>
                </div>
              )}
              
              {timeRemaining && (
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{t("debtPayoff.timeRemaining")}</span>
                  </div>
                  <p className={`font-medium ${
                    timeRemaining.type === "overdue" ? "text-red-600" :
                    timeRemaining.value <= 30 ? "text-yellow-600" :
                    "text-green-600"
                  }`}>
                    {timeRemaining.type === "overdue" ? 
                      t("debtPayoff.overdue", { days: timeRemaining.value }) :
                      `${timeRemaining.value} ${t(`common.${timeRemaining.unit}`)}`
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Strategy Info */}
            {goal.metadata?.strategy && (
              <div className="text-sm">
                <div className="flex items-center gap-1 text-muted-foreground mb-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>{t("debtPayoff.strategy")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="capitalize">
                    {t(`debtPayoff.strategies.${goal.metadata.strategy}`)}
                  </span>
                  {goal.metadata.monthly_payment && (
                    <span className="font-medium">
                      {formatCurrency(goal.metadata.monthly_payment)}/mo
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Projected Savings */}
            {projectedSavings && projectedSavings.interestSaved > 0 && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {t("debtPayoff.projectedSavings")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-emerald-600">{t("debtPayoff.interestSaved")}</p>
                    <p className="font-semibold text-emerald-700">
                      {formatCurrency(projectedSavings.interestSaved)}
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-600">{t("debtPayoff.timeSaved")}</p>
                    <p className="font-semibold text-emerald-700">
                      {projectedSavings.monthsSaved} {t("common.months")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning for at-risk goals */}
            {status === "at_risk" && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      {t("debtPayoff.atRiskWarning")}
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      {t("debtPayoff.atRiskAdvice")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Achievement celebration */}
            {status === "achieved" && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {t("debtPayoff.congratulations")}
                  </span>
                </div>
                {goal.achieved_at && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {t("debtPayoff.achievedOn", { date: formatDate(goal.achieved_at) })}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete.description", { name: goal.name })}
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