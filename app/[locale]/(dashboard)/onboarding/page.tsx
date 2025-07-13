"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ChevronRight, DollarSign, Check, PiggyBank, CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 1, title: "Welcome", description: "Get to know FinTrack" },
  { id: 2, title: "Account Setup", description: "Configure your accounts" },
  { id: 3, title: "Set Goals", description: "Define your targets" },
  { id: 4, title: "First Budget", description: "Create your budget" },
  { id: 5, title: "Complete", description: "You're all set!" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Account setup data
  const [accountData, setAccountData] = useState({
    name: "",
    type: "checking",
    initialBalance: "",
    includeInTotals: true,
  });

  // Goal setup data
  const [goalData, setGoalData] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
    type: "savings",
  });

  // Budget setup data
  const [budgetData, setBudgetData] = useState({
    name: "",
    amount: "",
    period: "monthly",
    categoryIds: [] as string[],
  });

  const [availableCategories, setAvailableCategories] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    // Check if user has already completed onboarding
    const completed = localStorage.getItem("onboarding_completed");
    if (completed === "true") {
      router.push("/dashboard");
    }
  }, [router]);

  // Load categories when we reach the budget step
  useEffect(() => {
    if (currentStep === 4) {
      loadCategories();
    }
  }, [currentStep]);

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setAvailableCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

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

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Mark onboarding as complete
      localStorage.setItem("onboarding_completed", "true");
      
      // Create sample transaction if account was created
      await createSampleTransaction();
      
      toast.success("Welcome to FinTrack! Your setup is complete.");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Setup completed with some issues. You can continue using the app.");
      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  const createSampleTransaction = async () => {
    try {
      // Create a welcome transaction
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Welcome to FinTrack!",
          amount: 0,
          transactionType: "income",
          description: "Getting started with your financial journey",
          categoryId: availableCategories[0]?.id,
          transactionDate: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Failed to create sample transaction:", error);
    }
  };

  const validateAccount = () => {
    const newErrors: Record<string, string> = {};
    
    if (!accountData.name.trim()) {
      newErrors.name = "Please enter an account name";
    }
    if (!accountData.initialBalance) {
      newErrors.initialBalance = "Please enter an initial balance";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAccount = async () => {
    if (!validateAccount()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: accountData.name,
          account_type: accountData.type,
          initial_balance: parseFloat(accountData.initialBalance),
          currency_code: "USD",
          is_active: true,
          include_in_totals: accountData.includeInTotals,
          user_id: user?.id,
        }),
      });

      if (response.ok) {
        toast.success("Account created successfully!");
        handleNext();
      } else {
        throw new Error("Failed to create account");
      }
    } catch (error) {
      console.error("Error creating account:", error);
      toast.error("Failed to create account. You can add it later.");
      handleNext(); // Continue anyway
    } finally {
      setIsSubmitting(false);
    }
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

  const handleSaveGoal = async () => {
    if (!validateGoal()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: goalData.name,
          target_amount: parseFloat(goalData.targetAmount),
          current_amount: 0,
          target_date: goalData.targetDate,
          type: goalData.type,
          description: "Created during onboarding",
          user_id: user?.id,
        }),
      });

      if (response.ok) {
        toast.success("Goal created successfully!");
        handleNext();
      } else {
        throw new Error("Failed to create goal");
      }
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("Failed to create goal. You can add it later.");
      handleNext(); // Continue anyway
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateBudget = () => {
    const newErrors: Record<string, string> = {};
    
    if (!budgetData.name.trim()) {
      newErrors.name = "Please enter a budget name";
    }
    if (!budgetData.amount) {
      newErrors.amount = "Please enter a budget amount";
    }
    if (budgetData.categoryIds.length === 0) {
      newErrors.categories = "Please select at least one category";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveBudget = async () => {
    if (!validateBudget()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: budgetData.name,
          amount: parseFloat(budgetData.amount),
          period: budgetData.period,
          budget_type: "category",
          categoryIds: budgetData.categoryIds,
          start_date: new Date().toISOString(),
          description: "Created during onboarding",
          user_id: user?.id,
        }),
      });

      if (response.ok) {
        toast.success("Budget created successfully!");
        handleNext();
      } else {
        throw new Error("Failed to create budget");
      }
    } catch (error) {
      console.error("Error creating budget:", error);
      toast.error("Failed to create budget. You can add it later.");
      handleNext(); // Continue anyway
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (currentStep / ONBOARDING_STEPS.length) * 100;

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Skip button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Getting Started</h1>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground min-h-[44px]"
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
                  step.id <= currentStep ? "text-emerald-500" : "text-muted-foreground"
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
                  step.id <= currentStep ? "bg-emerald-500" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content based on current step */}
        <Card>
          {currentStep === 1 && (
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <DollarSign className="w-16 h-16 text-emerald-500 mx-auto" />
                <h2 className="text-3xl font-bold">
                  Welcome, {user?.firstName || "there"}!
                </h2>
                <p className="text-xl text-muted-foreground">
                  Let&apos;s get you started on your financial journey
                </p>
                
                <div className="mt-8 space-y-4">
                  <h3 className="text-2xl font-semibold">
                    Understanding your finances
                  </h3>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
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
              <h2 className="text-2xl font-bold mb-6">Set Up Your First Account</h2>
              <p className="text-muted-foreground mb-8">
                Let&apos;s start by adding your main account. This could be your checking account, 
                savings account, or cash wallet.
              </p>
              
              <div className="space-y-6 max-w-md mx-auto">
                <div>
                  <Label htmlFor="account-name">Account Name</Label>
                  <Input
                    id="account-name"
                    type="text"
                    placeholder="e.g., Main Checking"
                    value={accountData.name}
                    onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                    className="bg-background border-border"
                  />
                  {errors.name && (
                    <p className="text-rose-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="account-type">Account Type</Label>
                  <Select value={accountData.type} onValueChange={(value) => setAccountData({ ...accountData, type: value })}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">
                        <div className="flex items-center">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Checking
                        </div>
                      </SelectItem>
                      <SelectItem value="savings">
                        <div className="flex items-center">
                          <PiggyBank className="w-4 h-4 mr-2" />
                          Savings
                        </div>
                      </SelectItem>
                      <SelectItem value="cash">
                        <div className="flex items-center">
                          <Wallet className="w-4 h-4 mr-2" />
                          Cash
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="initial-balance">Current Balance</Label>
                  <Input
                    id="initial-balance"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 1500.00"
                    value={accountData.initialBalance}
                    onChange={(e) => setAccountData({ ...accountData, initialBalance: e.target.value })}
                    className="bg-background border-border"
                  />
                  {errors.initialBalance && (
                    <p className="text-rose-500 text-sm mt-1">{errors.initialBalance}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-totals"
                    checked={accountData.includeInTotals}
                    onCheckedChange={(checked) => setAccountData({ ...accountData, includeInTotals: checked as boolean })}
                  />
                  <Label htmlFor="include-totals" className="text-sm">
                    Include in dashboard totals
                  </Label>
                </div>
              </div>
              
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="min-h-[44px]"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSaveAccount}
                  disabled={isSubmitting}
                  className="min-h-[44px]"
                >
                  {isSubmitting ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </CardContent>
          )}

          {currentStep === 3 && (
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Set Your First Goal</h2>
              <p className="text-muted-foreground mb-8">
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
                    className="bg-background border-border"
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
                    className="bg-background border-border"
                  />
                  {errors.targetAmount && (
                    <p className="text-rose-500 text-sm mt-1">{errors.targetAmount}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="goal-type">Goal Type</Label>
                  <Select value={goalData.type} onValueChange={(value) => setGoalData({ ...goalData, type: value })}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Savings Goal</SelectItem>
                      <SelectItem value="debt_payoff">Debt Payoff</SelectItem>
                      <SelectItem value="expense">Large Purchase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="target-date">Target Date</Label>
                  <Input
                    id="target-date"
                    type="date"
                    value={goalData.targetDate}
                    onChange={(e) => setGoalData({ ...goalData, targetDate: e.target.value })}
                    className="bg-background border-border"
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
                  disabled={isSubmitting}
                  className="min-h-[44px]"
                  style={{ minHeight: '44px' }}
                >
                  {isSubmitting ? "Creating..." : "Create Goal"}
                </Button>
              </div>
            </CardContent>
          )}

          {currentStep === 4 && (
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Create Your First Budget</h2>
              <p className="text-muted-foreground mb-8">
                Budgets help you control spending by setting limits for different 
                categories. Let&apos;s create a simple budget to get started.
              </p>
              
              <div className="space-y-6 max-w-md mx-auto">
                <div>
                  <Label htmlFor="budget-name">Budget Name</Label>
                  <Input
                    id="budget-name"
                    type="text"
                    placeholder="e.g., Monthly Spending"
                    value={budgetData.name}
                    onChange={(e) => setBudgetData({ ...budgetData, name: e.target.value })}
                    className="bg-background border-border"
                  />
                  {errors.name && (
                    <p className="text-rose-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="budget-amount">Budget Amount</Label>
                  <Input
                    id="budget-amount"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 500.00"
                    value={budgetData.amount}
                    onChange={(e) => setBudgetData({ ...budgetData, amount: e.target.value })}
                    className="bg-background border-border"
                  />
                  {errors.amount && (
                    <p className="text-rose-500 text-sm mt-1">{errors.amount}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="budget-period">Budget Period</Label>
                  <Select value={budgetData.period} onValueChange={(value) => setBudgetData({ ...budgetData, period: value })}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Categories to Include</Label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {availableCategories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={budgetData.categoryIds.includes(category.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setBudgetData({
                                ...budgetData,
                                categoryIds: [...budgetData.categoryIds, category.id]
                              });
                            } else {
                              setBudgetData({
                                ...budgetData,
                                categoryIds: budgetData.categoryIds.filter(id => id !== category.id)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`category-${category.id}`} className="text-sm">
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {errors.categories && (
                    <p className="text-rose-500 text-sm mt-1">{errors.categories}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="min-h-[44px]"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSaveBudget}
                  disabled={isSubmitting}
                  className="min-h-[44px]"
                >
                  {isSubmitting ? "Creating..." : "Create Budget"}
                </Button>
              </div>
            </CardContent>
          )}

          {currentStep === 5 && (
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <Check className="w-16 h-16 text-emerald-500 mx-auto" />
                <h2 className="text-3xl font-bold">
                  You&apos;re All Set!
                </h2>
                <p className="text-xl text-muted-foreground">
                  Your FinTrack account is ready to help you manage your finances
                </p>
                
                <div className="mt-8 space-y-4">
                  <h3 className="text-xl font-semibold">
                    What&apos;s Next?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <DollarSign className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <h4 className="font-semibold mb-1">Add Transactions</h4>
                      <p className="text-sm text-muted-foreground">
                        Start tracking your spending and income
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <PiggyBank className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <h4 className="font-semibold mb-1">Track Goals</h4>
                      <p className="text-sm text-muted-foreground">
                        Monitor your progress toward financial goals
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <CreditCard className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                      <h4 className="font-semibold mb-1">Manage Budgets</h4>
                      <p className="text-sm text-muted-foreground">
                        Stay on top of your spending limits
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  size="lg"
                  className="mt-8 min-h-[44px] px-8"
                >
                  {isSubmitting ? "Setting up..." : "Go to Dashboard"}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}