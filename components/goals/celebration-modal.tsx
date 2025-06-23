"use client";

import { Trophy, Star, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UIGoal } from "@/lib/db/schemas/goal";

interface CelebrationModalProps {
  goal: UIGoal;
  isOpen: boolean;
  onClose: () => void;
}

export function CelebrationModal({ goal, isOpen, onClose }: CelebrationModalProps) {
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getNextSteps = () => {
    switch (goal.type) {
      case "savings":
        return [
          "Create a new savings goal",
          "Increase your target amount",
          "Start an investment goal",
        ];
      case "debt_payoff":
        return [
          "Celebrate being debt-free!",
          "Build an emergency fund",
          "Start saving for your next goal",
        ];
      case "spending_limit":
        return [
          "Set a new spending target",
          "Try a different category",
          "Focus on another financial goal",
        ];
      default:
        return ["Set your next financial goal"];
    }
  };

  return (
    <div 
      data-testid="celebration-modal"
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <Card className="w-full max-w-md bg-gradient-to-br from-emerald-900 to-green-900 border-emerald-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 relative">
            <div className="absolute inset-0 animate-ping">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto" />
            </div>
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto relative z-10" />
          </div>
          <CardTitle className="text-2xl text-white">
            Congratulations!
          </CardTitle>
          <p className="text-emerald-200">
            You achieved your {goal.name.toLowerCase()} goal!
          </p>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          {/* Achievement Details */}
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-3xl font-bold text-white mb-2">
              {formatCurrency(goal.targetAmount)}
            </div>
            <div className="text-emerald-200">
              {goal.type === "debt_payoff" ? "Debt Paid Off" : "Goal Achieved"}
            </div>
          </div>

          {/* Celebration Animation */}
          <div className="flex justify-center space-x-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-6 h-6 text-yellow-400 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>

          {/* Next Steps */}
          <div className="text-left">
            <h4 className="font-semibold text-white mb-3 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              What's next?
            </h4>
            <ul className="space-y-2">
              {getNextSteps().map((step, index) => (
                <li key={index} className="text-emerald-200 text-sm flex items-center">
                  <TrendingUp className="w-3 h-3 mr-2 text-emerald-400" />
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-emerald-900"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                onClose();
                // Could trigger create new goal modal here
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              Create New Goal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}