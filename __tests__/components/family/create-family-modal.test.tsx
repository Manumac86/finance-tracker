/**
 * Tests for CreateFamilyModal component
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateFamilyModal } from "@/components/family/create-family-modal";
import { UIFamilyGroup } from "@/lib/db/schemas/family-clerk";
import { useFamilyGroup } from "@/hooks/use-family-group";

// Mock the hook
jest.mock("@/hooks/use-family-group", () => ({
  useFamilyGroup: jest.fn(),
}));

const mockUseFamilyGroup = useFamilyGroup as jest.Mock;

const mockFamilyGroup: UIFamilyGroup = {
  organizationId: "org_123",
  name: "Test Family",
  slug: "test-family",
  imageUrl: undefined,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  memberCount: 1,
  adminCount: 1,
  settings: {
    id: "settings_123",
    organizationId: "org_123",
    sharedCurrency: "USD",
    monthlyFamilyBudget: 5000,
    permissions: {
      membersCanViewAllTransactions: true,
      membersCanEditSharedBudgets: false,
      membersCanCreateSharedGoals: true,
      requireAdminApprovalForLargeExpenses: false,
      largeExpenseThreshold: 100,
      allowIndividualBudgets: true,
      spendingNotificationsEnabled: true,
    },
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  totalMonthlySpending: 0,
  totalMonthlyIncome: 0,
  budgetUtilization: 0,
  sharedGoalsCount: 0,
  sharedBudgetsCount: 0,
  currentUserRole: "org:admin",
};

describe("CreateFamilyModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockCreateFamily = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFamilyGroup.mockReturnValue({
      createFamily: mockCreateFamily,
      isCreating: false,
    });
  });

  test("should render step 1 (basic information) initially", () => {
    render(
      <CreateFamilyModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText("Create Family Group")).toBeInTheDocument();
    expect(screen.getByText("Basic Information")).toBeInTheDocument();
    expect(screen.getByLabelText("Family Group Name")).toBeInTheDocument();
    expect(
      screen.getByLabelText("URL Identifier (optional)")
    ).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  test("should not render when closed", () => {
    render(
      <CreateFamilyModal
        open={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText("Create Family Group")).not.toBeInTheDocument();
  });

  test("should disable next button when name is empty", () => {
    render(
      <CreateFamilyModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const nextButton = screen.getByText("Next");
    expect(nextButton).toBeDisabled();
  });

  test("should enable next button when name is provided", async () => {
    const user = userEvent.setup();

    render(
      <CreateFamilyModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText("Family Group Name");
    await user.type(nameInput, "Test Family");

    const nextButton = screen.getByText("Next");
    expect(nextButton).toBeEnabled();
  });

  test("should navigate to step 2 (financial settings) when next is clicked", async () => {
    const user = userEvent.setup();

    render(
      <CreateFamilyModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText("Family Group Name");
    await user.type(nameInput, "Test Family");

    const nextButton = screen.getByText("Next");
    await user.click(nextButton);

    expect(screen.getByText("Financial Settings")).toBeInTheDocument();
    expect(screen.getByLabelText("Shared Currency")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Monthly Family Budget (optional)")
    ).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  test("should navigate to step 3 (permissions) from step 2", async () => {
    const user = userEvent.setup();

    render(
      <CreateFamilyModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill step 1
    const nameInput = screen.getByLabelText("Family Group Name");
    await user.type(nameInput, "Test Family");
    await user.click(screen.getByText("Next"));

    // Navigate from step 2 to step 3
    await user.click(screen.getByText("Next"));

    expect(screen.getByText("Permissions & Preferences")).toBeInTheDocument();
    expect(
      screen.getByText("Members can view all transactions")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Members can edit shared budgets")
    ).toBeInTheDocument();

    // Check for submit button specifically
    const submitButtons = screen.getAllByText("Create Family Group");
    const submitButton = submitButtons.find(
      (button) => button.tagName === "BUTTON"
    );
    expect(submitButton).toBeInTheDocument();
  });

  test("should navigate back to previous steps", async () => {
    const user = userEvent.setup();

    render(
      <CreateFamilyModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Go to step 3
    const nameInput = screen.getByLabelText("Family Group Name");
    await user.type(nameInput, "Test Family");
    await user.click(screen.getByText("Next"));
    await user.click(screen.getByText("Next"));

    // Go back to step 2
    await user.click(screen.getByText("Back"));
    expect(screen.getByText("Financial Settings")).toBeInTheDocument();

    // Go back to step 1
    await user.click(screen.getByText("Back"));
    expect(screen.getByText("Basic Information")).toBeInTheDocument();
  });

  test("should update currency selection", async () => {
    const user = userEvent.setup();

    render(
      <CreateFamilyModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Navigate to step 2
    const nameInput = screen.getByLabelText("Family Group Name");
    await user.type(nameInput, "Test Family");
    await user.click(screen.getByText("Next"));

    // Change currency
    const currencySelect = screen.getByLabelText("Shared Currency");
    await user.selectOptions(currencySelect, "EUR");

    expect(currencySelect).toHaveValue("EUR");
  });

  test("should update budget input", async () => {
    const user = userEvent.setup();

    render(
      <CreateFamilyModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Navigate to step 2
    const nameInput = screen.getByLabelText("Family Group Name");
    await user.type(nameInput, "Test Family");
    await user.click(screen.getByText("Next"));

    // Update budget
    const budgetInput = screen.getByLabelText(
      "Monthly Family Budget (optional)"
    );
    await user.type(budgetInput, "5000");

    expect(budgetInput).toHaveValue(5000);
  });

  test("should toggle permission switches", async () => {
    const user = userEvent.setup();

    render(
      <CreateFamilyModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Navigate to step 3
    const nameInput = screen.getByLabelText("Family Group Name");
    await user.type(nameInput, "Test Family");
    await user.click(screen.getByText("Next"));
    await user.click(screen.getByText("Next"));

    // Find and toggle a switch
    const switches = screen.getAllByRole("switch");
    const firstSwitch = switches[0]; // "Members can view all transactions"

    // Should be enabled by default
    expect(firstSwitch).toBeChecked();

    // Toggle it off
    await user.click(firstSwitch);
    expect(firstSwitch).not.toBeChecked();
  });

  test("should call createFamily and onSuccess when form is submitted", async () => {
    const user = userEvent.setup();
    mockCreateFamily.mockResolvedValue(mockFamilyGroup);

    render(
      <CreateFamilyModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill out the form
    const nameInput = screen.getByLabelText("Family Group Name");
    await user.type(nameInput, "Test Family");

    const slugInput = screen.getByLabelText("URL Identifier (optional)");
    await user.type(slugInput, "test-family");

    // Navigate through steps
    await user.click(screen.getByText("Next"));
    await user.click(screen.getByText("Next"));

    // Submit (get the button, not the dialog title)
    const submitButtons = screen.getAllByText("Create Family Group");
    const submitButton = submitButtons.find(
      (button) => button.tagName === "BUTTON"
    );
    await user.click(submitButton!);

    await waitFor(() => {
      expect(mockCreateFamily).toHaveBeenCalledWith({
        name: "Test Family",
        slug: "test-family",
        familySettings: {
          shared_currency: "USD",
          monthly_family_budget: undefined,
          permissions: {
            members_can_view_all_transactions: true,
            members_can_edit_shared_budgets: false,
            members_can_create_shared_goals: true,
            require_admin_approval_for_large_expenses: false,
            large_expense_threshold: 100,
            allow_individual_budgets: true,
            spending_notifications_enabled: true,
          },
        },
      });
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockFamilyGroup);
    });
  });

  test("should disable buttons and show loading state when creating", () => {
    mockUseFamilyGroup.mockReturnValue({
      createFamily: mockCreateFamily,
      isCreating: true,
    });

    render(
      <CreateFamilyModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByLabelText("Family Group Name");
    fireEvent.change(nameInput, { target: { value: "Test Family" } });

    // When isCreating is true, the button should show "Creating..." and be disabled
    const creatingButton = screen.getByText("Creating...");
    expect(creatingButton).toBeDisabled();

    const cancelButton = screen.getByText("Cancel");
    expect(cancelButton).toBeDisabled();
  });

  test("should call onClose when cancel is clicked", async () => {
    const user = userEvent.setup();

    render(
      <CreateFamilyModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    await user.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  test("should reset form when closed and reopened", async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <CreateFamilyModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Fill out some data
    const nameInput = screen.getByLabelText("Family Group Name");
    await user.type(nameInput, "Test Family");
    await user.click(screen.getByText("Next"));

    // Close modal
    rerender(
      <CreateFamilyModal
        open={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Reopen modal
    rerender(
      <CreateFamilyModal
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Should be back to step 1 with empty form
    expect(screen.getByText("Basic Information")).toBeInTheDocument();
    expect(screen.getByLabelText("Family Group Name")).toHaveValue("");
  });
});
