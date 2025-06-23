"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ChevronRight, DollarSign, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 1, title: "Welcome", description: "Get to know FinTrack" },
  { id: 2, title: "Learn Basics", description: "Understand key concepts" },
  { id: 3, title: "Set Goals", description: "Define your targets" },
  { id: 4, title: "Try It Out", description: "Explore with sample data" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [goalData, setGoalData] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Check if user has already completed onboarding
    const completed = localStorage.getItem("onboarding_completed");
    if (completed === "true") {
      router.push("/dashboard");
    }
  }, [router]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true");
    router.push("/dashboard");
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    router.push("/dashboard");
  };

  const validateGoal = () => {
    const newErrors: Record<string, string> = {};
    
    if (!goalData.name.trim()) {
      newErrors.name = "Please enter a goal name";
    }
    if (!goalData.targetAmount) {
      newErrors.targetAmount = "Please enter a target amount";
    }
    if (!goalData.targetDate) {
      newErrors.targetDate = "Please select a target date";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveGoal = () => {
    if (validateGoal()) {
      // Save goal (in a real app, this would be an API call)
      console.log("Goal saved:", goalData);
      handleNext();
    }
  };

  const progressPercentage = (currentStep / ONBOARDING_STEPS.length) * 100;

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Skip button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Getting Started</h1>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-200 min-h-[44px]"
            style={{ minHeight: '44px' }}
          >
            Skip for now
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <Progress value={progressPercentage} className="h-2 mb-4" />
          <div 
            data-testid="progress-indicator" 
            data-step={currentStep}
            className="hidden md:flex justify-between text-sm"
          >
            {ONBOARDING_STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  step.id <= currentStep ? "text-emerald-500" : "text-gray-500"
                }`}
              >
                {step.id < currentStep ? (
                  <span className="flex items-center">
                    <Check className="w-5 h-5 mr-1" />
                    {step.title}
                  </span>
                ) : (
                  <span>{step.id}. {step.title}</span>
                )}
              </div>
            ))}
          </div>
          
          {/* Mobile progress dots */}
          <div 
            data-testid="mobile-progress-dots" 
            className="flex md:hidden justify-center space-x-2"
          >
            {ONBOARDING_STEPS.map((step) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full ${
                  step.id <= currentStep ? "bg-emerald-500" : "bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content based on current step */}
        <Card className="bg-gray-900 border-gray-800">
          {currentStep === 1 && (
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <DollarSign className="w-16 h-16 text-emerald-500 mx-auto" />
                <h2 className="text-3xl font-bold">
                  Welcome, {user?.firstName || "there"}!
                </h2>
                <p className="text-xl text-gray-400">
                  Let&apos;s get you started on your financial journey
                </p>
                
                <div className="mt-8 space-y-4">
                  <h3 className="text-2xl font-semibold">
                    Understanding your finances
                  </h3>
                  <p className="text-gray-400 max-w-2xl mx-auto">
                    Track expenses, set goals, and build wealth - all in one place.
                    We&apos;ll help you understand key financial concepts and get you 
                    started with smart money management.
                  </p>
                </div>
                
                <Button
                  size="lg"
                  onClick={handleNext}
                  className="mt-8 min-h-[44px] px-8"
                  style={{ minHeight: '44px' }}
                >
                  Get Started
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          )}

          {currentStep === 2 && (
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">What is a Budget?</h2>
              <p className="text-gray-400 mb-8">
                A budget helps you plan your spending and saving. It&apos;s like a 
                roadmap for your money, showing you where it comes from and 
                where it goes.
              </p>
              
              <div 
                data-testid="interactive-budget-demo"
                className="bg-gray-800 rounded-lg p-6 mb-8"
              >
                <h3 className="font-semibold mb-4">Simple Budget Example</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Monthly Income</span>
                    <span className="text-emerald-500">$3,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rent</span>
                    <span className="text-rose-500">-$1,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Food</span>
                    <span className="text-rose-500">-$500</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transportation</span>
                    <span className="text-rose-500">-$300</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3 flex justify-between font-semibold">
                    <span>Left to Save</span>
                    <span className="text-emerald-500">$1,200</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="min-h-[44px]"
                >
                  Back
                </Button>
                <div className="space-x-4">
                  <Button
                    variant="outline"
                    className="min-h-[44px]"
                  >
                    Try it yourself
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="min-h-[44px]"
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          )}

          {currentStep === 3 && (
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Set Your First Goal</h2>
              <p className="text-gray-400 mb-8">
                Goals help you stay motivated and track your progress. Let&apos;s 
                create your first financial goal!
              </p>
              
              <div className="space-y-6 max-w-md mx-auto">
                <div>
                  <Label htmlFor="goal-name">Goal Name</Label>
                  <Input
                    id="goal-name"
                    type="text"
                    placeholder="e.g., Emergency Fund"
                    value={goalData.name}
                    onChange={(e) => setGoalData({ ...goalData, name: e.target.value })}
                    className="bg-gray-800 border-gray-700"
                  />
                  {errors.name && (
                    <p className="text-rose-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="target-amount">Target Amount</Label>
                  <Input
                    id="target-amount"
                    type="number"
                    placeholder="e.g., 5000"
                    value={goalData.targetAmount}
                    onChange={(e) => setGoalData({ ...goalData, targetAmount: e.target.value })}
                    className="bg-gray-800 border-gray-700"
                  />
                  {errors.targetAmount && (
                    <p className="text-rose-500 text-sm mt-1">{errors.targetAmount}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="target-date">Target Date</Label>
                  <Input
                    id="target-date"
                    type="date"
                    value={goalData.targetDate}
                    onChange={(e) => setGoalData({ ...goalData, targetDate: e.target.value })}
                    className="bg-gray-800 border-gray-700"
                  />
                  {errors.targetDate && (
                    <p className="text-rose-500 text-sm mt-1">{errors.targetDate}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="min-h-[44px]"
                  style={{ minHeight: '44px' }}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSaveGoal}
                  className="min-h-[44px]"
                  style={{ minHeight: '44px' }}
                >
                  Save Goal
                </Button>
              </div>
            </CardContent>
          )}

          {currentStep === 4 && (
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Try It Out</h2>
              <p className="text-gray-400 mb-8">
                Here are some sample transactions to help you understand how 
                FinTrack works. Feel free to explore!
              </p>
              
              <div data-testid="sample-transactions" className="space-y-4 mb-8">
                <div className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Coffee Shop</p>
                    <p className="text-sm text-gray-400">Food & Dining</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-rose-500">-$4.50</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowEditModal(true)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Grocery Store</p>
                    <p className="text-sm text-gray-400">Groceries</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-rose-500">-$85.20</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowEditModal(true)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Salary Deposit</p>
                    <p className="text-sm text-gray-400">Income</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-emerald-500">+$3,000.00</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowEditModal(true)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Edit transaction modal placeholder */}
              {showEditModal && (
                <div data-testid="edit-transaction-modal" className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
                  <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-lg font-semibold mb-4">Edit Transaction</h3>
                    <Button onClick={() => setShowEditModal(false)}>Close</Button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="min-h-[44px]"
                >
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  size="lg"
                  className="min-h-[44px] px-8"
                >
                  Complete Setup
                  <Check className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}