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
  budgetUtilization: number;
  goalProgress: number;
  emergencyFundRatio: number;
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

  const healthScore = useMemo((): HealthScore => {
    const {
      totalIncome,
      totalExpenses,
      budgetUtilization,
      goalProgress,
      emergencyFundRatio,
    } = data;

    // Calculate individual scores (0-100)
    const savingsRate =
      totalIncome > 0 ? ((totalIncome + totalExpenses) / totalIncome) * 100 : 0;
    const budgetScore = Math.max(0, 100 - (budgetUtilization - 80)); // Optimal around 80%
    const goalScore = goalProgress;
    const emergencyScore = Math.min(100, emergencyFundRatio * 20); // 5 months = 100%

    // Weighted average
    const overallScore = Math.round(
      savingsRate * 0.3 +
        budgetScore * 0.25 +
        goalScore * 0.25 +
        emergencyScore * 0.2
    );

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
      if (savingsRate < 20)
        recommendations.push(t("recommendations.increaseSavings"));
      if (emergencyScore < 60)
        recommendations.push(t("recommendations.buildEmergencyFund"));
    } else if (overallScore >= 40) {
      status = "warning";
      color = "text-yellow-500 bg-yellow-500/10";
      icon = <AlertTriangle className="w-4 h-4" />;
      if (budgetUtilization > 90)
        recommendations.push(t("recommendations.overspending"));
      if (savingsRate < 10)
        recommendations.push(t("recommendations.reduceFocus"));
      if (goalProgress < 50)
        recommendations.push(t("recommendations.reviewGoals"));
    } else {
      status = "critical";
      color = "text-red-500 bg-red-500/10";
      icon = <TrendingDown className="w-4 h-4" />;
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
            <div className="font-medium">
              {data.totalIncome > 0
                ? Math.round(
                    ((data.totalIncome + data.totalExpenses) /
                      data.totalIncome) *
                      100
                  )
                : 0}
              %
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
          <div>
            <div className="text-muted-foreground">
              {t("metrics.emergencyFund")}
            </div>
            <div className="font-medium">
              {data.emergencyFundRatio.toFixed(1)}mo
            </div>
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
