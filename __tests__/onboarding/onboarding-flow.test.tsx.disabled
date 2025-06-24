/// <reference types="jest" />
/**
 * TDD RED Phase: Onboarding Flow Tests
 *
 * These tests define the behavior for the enhanced user onboarding feature.
 * They will initially FAIL as we haven't implemented the functionality yet.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import OnboardingPage from "@/app/(dashboard)/onboarding/page";

// Mock the hooks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: jest.fn(),
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

describe("TDD RED: Enhanced User Onboarding Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as any);
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: "user_123",
        firstName: "Emma",
        emailAddresses: [{ emailAddress: "emma@example.com" }],
      },
    } as any);
  });

  describe("Welcome Screen", () => {
    it("should display personalized welcome message", () => {
      render(<OnboardingPage />);

      expect(screen.getByText(/Welcome, Emma!/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Let's get you started on your financial journey/i)
      ).toBeInTheDocument();
    });

    it("should show financial education intro", () => {
      render(<OnboardingPage />);

      expect(
        screen.getByText(/Understanding your finances/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Track expenses, set goals, and build wealth/i)
      ).toBeInTheDocument();
    });

    it("should have a start button", () => {
      render(<OnboardingPage />);

      const startButton = screen.getByRole("button", { name: /Get Started/i });
      expect(startButton).toBeInTheDocument();
    });
  });

  describe("Progress Indicators", () => {
    it("should show progress steps", () => {
      render(<OnboardingPage />);

      expect(screen.getByTestId("progress-indicator")).toBeInTheDocument();
      expect(screen.getByText("1. Welcome")).toBeInTheDocument();
      expect(screen.getByText("2. Learn Basics")).toBeInTheDocument();
      expect(screen.getByText("3. Set Goals")).toBeInTheDocument();
      expect(screen.getByText("4. Try It Out")).toBeInTheDocument();
    });

    it("should update progress as user advances", async () => {
      render(<OnboardingPage />);

      const startButton = screen.getByRole("button", { name: /Get Started/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        const progressIndicator = screen.getByTestId("progress-indicator");
        expect(progressIndicator).toHaveAttribute("data-step", "2");
      });
    });
  });

  describe("Interactive Tutorial", () => {
    it("should show financial concepts tutorial", async () => {
      render(<OnboardingPage />);

      const startButton = screen.getByRole("button", { name: /Get Started/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/What is a Budget?/i)).toBeInTheDocument();
        expect(
          screen.getByText(/A budget helps you plan your spending/i)
        ).toBeInTheDocument();
      });
    });

    it("should have interactive elements", async () => {
      render(<OnboardingPage />);

      const startButton = screen.getByRole("button", { name: /Get Started/i });
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(
          screen.getByTestId("interactive-budget-demo")
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Try it yourself/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Goal Setting", () => {
    it("should allow user to set their first financial goal", async () => {
      render(<OnboardingPage />);

      // Navigate to goal setting step
      const startButton = screen.getByRole("button", { name: /Get Started/i });
      fireEvent.click(startButton);

      const nextButton = await screen.findByRole("button", { name: /Next/i });
      fireEvent.click(nextButton);
      fireEvent.click(nextButton); // Navigate through tutorial

      await waitFor(() => {
        expect(screen.getByText(/Set Your First Goal/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Goal Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Target Amount/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Target Date/i)).toBeInTheDocument();
      });
    });

    it("should validate goal inputs", async () => {
      render(<OnboardingPage />);

      // Navigate to goal setting
      const startButton = screen.getByRole("button", { name: /Get Started/i });
      fireEvent.click(startButton);

      const nextButton = await screen.findByRole("button", { name: /Next/i });
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      const saveGoalButton = await screen.findByRole("button", {
        name: /Save Goal/i,
      });
      fireEvent.click(saveGoalButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Please enter a goal name/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Sample Data Demo", () => {
    it("should show sample transactions", async () => {
      render(<OnboardingPage />);

      // Navigate to demo step
      const startButton = screen.getByRole("button", { name: /Get Started/i });
      fireEvent.click(startButton);

      const nextButton = await screen.findByRole("button", { name: /Next/i });
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      
      // On the goal setting step, we need to save a goal first
      const goalName = screen.getByLabelText(/Goal Name/i);
      const targetAmount = screen.getByLabelText(/Target Amount/i);
      const targetDate = screen.getByLabelText(/Target Date/i);
      
      fireEvent.change(goalName, { target: { value: 'Test Goal' } });
      fireEvent.change(targetAmount, { target: { value: '1000' } });
      fireEvent.change(targetDate, { target: { value: '2024-12-31' } });
      
      const saveGoalButton = screen.getByRole("button", { name: /Save Goal/i });
      fireEvent.click(saveGoalButton);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /Try It Out/i })).toBeInTheDocument();
        expect(screen.getByTestId("sample-transactions")).toBeInTheDocument();
        expect(screen.getByText(/Coffee Shop/i)).toBeInTheDocument();
        expect(screen.getByText(/Grocery Store/i)).toBeInTheDocument();
      });
    });

    it("should allow interaction with sample data", async () => {
      render(<OnboardingPage />);

      // Navigate to demo
      const startButton = screen.getByRole("button", { name: /Get Started/i });
      fireEvent.click(startButton);

      const nextButton = await screen.findByRole("button", { name: /Next/i });
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      
      // Fill and save goal
      const goalName = screen.getByLabelText(/Goal Name/i);
      const targetAmount = screen.getByLabelText(/Target Amount/i);
      const targetDate = screen.getByLabelText(/Target Date/i);
      
      fireEvent.change(goalName, { target: { value: 'Test Goal' } });
      fireEvent.change(targetAmount, { target: { value: '1000' } });
      fireEvent.change(targetDate, { target: { value: '2024-12-31' } });
      
      const saveGoalButton = screen.getByRole("button", { name: /Save Goal/i });
      fireEvent.click(saveGoalButton);

      const editButton = await screen.findByRole("button", { name: /Edit/i });
      fireEvent.click(editButton);

      expect(screen.getByTestId("edit-transaction-modal")).toBeInTheDocument();
    });
  });

  describe("Mobile Optimization", () => {
    it("should be touch-friendly on mobile", () => {
      globalThis.resizeWindow(375, 667); // iPhone SE size

      render(<OnboardingPage />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        const minHeight =
          parseInt(styles.minHeight) || parseInt(styles.height) || 0;
        expect(minHeight).toBeGreaterThanOrEqual(44); // iOS touch target
      });
    });

    it("should show mobile-optimized progress indicator", () => {
      globalThis.resizeWindow(375, 667);

      render(<OnboardingPage />);

      expect(screen.getByTestId("mobile-progress-dots")).toBeInTheDocument();
    });
  });

  describe("Completion and Redirect", () => {
    it("should redirect to dashboard after completion", async () => {
      render(<OnboardingPage />);

      // Complete all steps
      const startButton = screen.getByRole("button", { name: /Get Started/i });
      fireEvent.click(startButton);

      // Step 1 -> 2
      const nextButton1 = await screen.findByRole("button", { name: /Next/i });
      fireEvent.click(nextButton1);
      
      // Step 3: Fill and save goal
      const goalName = screen.getByLabelText(/Goal Name/i);
      const targetAmount = screen.getByLabelText(/Target Amount/i);
      const targetDate = screen.getByLabelText(/Target Date/i);
      
      fireEvent.change(goalName, { target: { value: 'Test Goal' } });
      fireEvent.change(targetAmount, { target: { value: '1000' } });
      fireEvent.change(targetDate, { target: { value: '2024-12-31' } });
      
      const saveGoalButton = screen.getByRole("button", { name: /Save Goal/i });
      fireEvent.click(saveGoalButton);

      const completeButton = await screen.findByRole("button", {
        name: /Complete Setup/i,
      });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should save onboarding completion status", async () => {
      render(<OnboardingPage />);

      // Complete onboarding
      const startButton = screen.getByRole("button", { name: /Get Started/i });
      fireEvent.click(startButton);

      // Navigate through steps
      const nextButton = await screen.findByRole("button", { name: /Next/i });
      fireEvent.click(nextButton);
      
      // Fill and save goal
      const goalName = screen.getByLabelText(/Goal Name/i);
      const targetAmount = screen.getByLabelText(/Target Amount/i);
      const targetDate = screen.getByLabelText(/Target Date/i);
      
      fireEvent.change(goalName, { target: { value: 'Test Goal' } });
      fireEvent.change(targetAmount, { target: { value: '1000' } });
      fireEvent.change(targetDate, { target: { value: '2024-12-31' } });
      
      const saveGoalButton = screen.getByRole("button", { name: /Save Goal/i });
      fireEvent.click(saveGoalButton);

      const completeButton = await screen.findByRole("button", {
        name: /Complete Setup/i,
      });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(localStorage.getItem("onboarding_completed")).toBe("true");
      });
    });
  });

  describe("Skip Option", () => {
    it("should allow users to skip onboarding", () => {
      render(<OnboardingPage />);

      const skipButton = screen.getByRole("button", { name: /Skip for now/i });
      expect(skipButton).toBeInTheDocument();

      fireEvent.click(skipButton);

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });
});
