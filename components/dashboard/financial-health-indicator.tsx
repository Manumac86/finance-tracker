"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";

interface FinancialHealthData {
  totalIncome: number;
  totalExpenses: number;
  totalDebt: number;
  monthlyDebtPayments: number;
  debtToIncomeRatio: number;
  budgetUtilization: number;
  goalProgress: number;
  emergencyFundRatio: number;
  savingsRate: number;
}

interface FinancialHealthIndicatorProps {
  data: FinancialHealthData;
}

type HealthStatus = "excellent" | "good" | "warning" | "critical";

interface HealthScore {
  status: HealthStatus;
  score: number;
  color: string;
  icon: React.ReactNode;
  recommendations: string[];
}

export function FinancialHealthIndicator({
  data,
}: FinancialHealthIndicatorProps) {
  const t = useTranslations("financialHealth");

  // Use the centrally calculated savings rate
  const actualSavingsRate = data.savingsRate;

  const healthScore = useMemo((): HealthScore => {
    const {
      debtToIncomeRatio,
      budgetUtilization,
      goalProgress,
      emergencyFundRatio,
    } = data;

    // Use the centrally calculated savings rate
    const savingsRateForCalculation = data.savingsRate;
    
    // Calculate individual scores (0-100)
    // Savings rate score: 20% = 100 points, scales down
    const savingsScore = Math.max(0, Math.min(100, 
      savingsRateForCalculation <= 0 ? 0 :
      savingsRateForCalculation >= 20 ? 100 :
      (savingsRateForCalculation / 20) * 100
    ));
    
    // Budget score: 80% usage is optimal, penalize over/under usage
    const budgetScore = budgetUtilization === 0 ? 50 : // No budget = neutral
      Math.max(0, Math.min(100, 
        budgetUtilization <= 80 ? 100 - (80 - budgetUtilization) * 0.5 :
        100 - (budgetUtilization - 80) * 2
      ));
    
    // Goal score: direct percentage
    const goalScore = Math.max(0, Math.min(100, goalProgress));
    
    // Emergency fund score: 3-6 months is optimal
    const emergencyScore = Math.max(0, Math.min(100, 
      emergencyFundRatio >= 3 ? 100 :
      (emergencyFundRatio / 3) * 100
    ));
    
    // Debt-to-income ratio score (lower is better)
    const debtScore = debtToIncomeRatio === 0 ? 100 : 
                      debtToIncomeRatio <= 10 ? 90 :
                      debtToIncomeRatio <= 20 ? 70 :
                      debtToIncomeRatio <= 35 ? 40 :
                      debtToIncomeRatio <= 50 ? 20 : 0;

    // Weighted average including debt metrics - ensure max 100
    const overallScore = Math.max(0, Math.min(100, Math.round(
      savingsScore * 0.25 +
        budgetScore * 0.2 +
        goalScore * 0.2 +
        emergencyScore * 0.15 +
        debtScore * 0.2
    )));

    let status: HealthStatus;
    let color: string;
    let icon: React.ReactNode;
    const recommendations: string[] = [];

    if (overallScore >= 80) {
      status = "excellent";
      color = "text-emerald-500 bg-emerald-500/10";
      icon = <CheckCircle className="w-4 h-4" />;
      recommendations.push(t("recommendations.excellent"));
    } else if (overallScore >= 65) {
      status = "good";
      color = "text-green-500 bg-green-500/10";
      icon = <TrendingUp className="w-4 h-4" />;
      if (savingsRateForCalculation < 20)
        recommendations.push(t("recommendations.increaseSavings"));
      if (emergencyScore < 60)
        recommendations.push(t("recommendations.buildEmergencyFund"));
      if (debtToIncomeRatio > 20)
        recommendations.push(t("recommendations.reduceDebt"));
    } else if (overallScore >= 40) {
      status = "warning";
      color = "text-yellow-500 bg-yellow-500/10";
      icon = <AlertTriangle className="w-4 h-4" />;
      if (budgetUtilization > 90)
        recommendations.push(t("recommendations.overspending"));
      if (savingsRateForCalculation < 10)
        recommendations.push(t("recommendations.reduceFocus"));
      if (goalProgress < 50)
        recommendations.push(t("recommendations.reviewGoals"));
      if (debtToIncomeRatio > 35)
        recommendations.push(t("recommendations.highDebtRatio"));
    } else {
      status = "critical";
      color = "text-red-500 bg-red-500/10";
      icon = <TrendingDown className="w-4 h-4" />;
      if (debtToIncomeRatio > 50)
        recommendations.push(t("recommendations.highDebtRatio"));
      if (savingsRateForCalculation <= 0)
        recommendations.push(t("recommendations.immediateAction"));
      recommendations.push(t("recommendations.additionalIncome"));
      recommendations.push(t("recommendations.eliminateExpenses"));
    }

    return {
      status,
      score: overallScore,
      color,
      icon,
      recommendations,
    };
  }, [data, t]);

  const getStatusLabel = (status: HealthStatus) => {
    return t(`status.${status}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("title")}
          <Badge className={healthScore.color}>
            {healthScore.icon}
            {getStatusLabel(healthScore.status)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-w-full">
        {/* Overall Score */}
        <div className="text-center">
          <div className="text-3xl font-bold mb-2">{healthScore.score}/100</div>
          <Progress value={healthScore.score} className="h-3" />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">
              {t("metrics.savingsRate")}
            </div>
            <div className={`font-medium ${
              actualSavingsRate >= 20 ? 'text-green-500' :
              actualSavingsRate >= 10 ? 'text-yellow-500' :
              actualSavingsRate >= 0 ? 'text-orange-500' : 'text-red-500'
            }`}>
              {actualSavingsRate.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">
              {t("metrics.debtToIncomeRatio")}
            </div>
            <div className={`font-medium ${
              data.debtToIncomeRatio <= 20 ? 'text-green-500' :
              data.debtToIncomeRatio <= 35 ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {data.debtToIncomeRatio.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">
              {t("metrics.budgetUsage")}
            </div>
            <div className="font-medium">
              {Math.round(data.budgetUtilization)}%
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">
              {t("metrics.goalProgress")}
            </div>
            <div className="font-medium">{Math.round(data.goalProgress)}%</div>
          </div>
        </div>

        {/* Recommendations */}
        {healthScore.recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">
              {t("recommendations.title")}
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              {healthScore.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
