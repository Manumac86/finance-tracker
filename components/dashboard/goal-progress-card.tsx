"use client";

import { Target, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UIGoal } from "@/lib/db/schemas/goal";
import Link from "next/link";

interface GoalProgressCardProps {
  goals: UIGoal[];
}

export function GoalProgressCard({ goals }: GoalProgressCardProps) {
  const activeGoals = goals.filter(goal => !goal.isAchieved);
  const achievedGoals = goals.filter(goal => goal.isAchieved);
  
  // Get the most important goals to display
  const priorityGoals = activeGoals
    .sort((a, b) => {
      // Sort by urgency (closest target date) and progress
      const aUrgency = a.targetDate ? new Date(a.targetDate).getTime() : Infinity;
      const bUrgency = b.targetDate ? new Date(b.targetDate).getTime() : Infinity;
      const aProgress = a.progress ?? 0;
      const bProgress = b.progress ?? 0;
      
      // Prioritize goals that are close to deadline or have high progress
      return (aUrgency - bUrgency) + ((bProgress - aProgress) * 1000);
    })
    .slice(0, 3);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getDaysUntilTarget = (targetDate?: string) => {
    if (!targetDate) return null;
    const days = Math.ceil((new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'savings':
        return <Target className="w-4 h-4 text-emerald-500" />;
      case 'debt_payoff':
        return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'spending_limit':
        return <Calendar className="w-4 h-4 text-yellow-500" />;
      default:
        return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  if (goals.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Goal Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <div className="text-gray-400 mb-4">No goals set yet</div>
          <Link href="/goals">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              Create Your First Goal
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Goal Progress
          </CardTitle>
          <Badge variant="secondary" className="bg-gray-800">
            {achievedGoals.length}/{goals.length} complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-emerald-500">{achievedGoals.length}</div>
            <div className="text-xs text-gray-400">Achieved</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-500">{activeGoals.length}</div>
            <div className="text-xs text-gray-400">In Progress</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-500">
              {activeGoals.filter(g => g.deadlineStatus?.status === 'approaching').length}
            </div>
            <div className="text-xs text-gray-400">Due Soon</div>
          </div>
        </div>

        {/* Priority Goals */}
        {priorityGoals.length > 0 && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-300">Priority Goals</div>
            {priorityGoals.map((goal) => {
              const progress = goal.progress ?? 0;
              const daysUntil = getDaysUntilTarget(goal.targetDate);
              
              return (
                <div key={goal.id} className="space-y-2 p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getGoalTypeIcon(goal.type)}
                      <span className="font-medium text-sm">{goal.name}</span>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      {goal.targetDate && (
                        <div className={daysUntil !== null && daysUntil < 30 ? 'text-yellow-500' : ''}>
                          {formatDate(goal.targetDate)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">
                        {formatCurrency(goal.currentAmount ?? 0)} / {formatCurrency(goal.targetAmount)}
                      </span>
                      <span className="text-emerald-500">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  
                  {daysUntil !== null && daysUntil < 30 && (
                    <div className="text-xs text-yellow-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {daysUntil > 0 ? `${daysUntil} days left` : 'Overdue'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Button */}
        <Link href="/goals">
          <Button 
            variant="outline" 
            className="w-full border-gray-700 hover:bg-gray-800"
          >
            Manage All Goals
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}