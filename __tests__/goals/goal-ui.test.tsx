/// <reference types="jest" />
/**
 * TDD RED Phase: Goal UI Component Tests
 * 
 * These tests define the behavior for goal management UI components.
 * They will initially FAIL as we haven't implemented the components yet.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useUser } from '@clerk/nextjs'
import GoalsPage from '@/app/(dashboard)/goals/page'
import { CreateGoalModal } from '@/components/goals/create-goal-modal'
import { GoalCard } from '@/components/goals/goal-card'

// Mock the hooks and APIs
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}))

jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>
import useSWR from 'swr';
const mockSWR = useSWR as jest.MockedFunction<typeof useSWR>;

describe('TDD RED: Goal UI Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: { id: 'user_123', firstName: 'Alex' },
    } as any)
  })

  describe('Goals Page', () => {
    it('should display user goals', async () => {
      const mockGoals = [
        {
          id: 'goal_1',
          name: 'Emergency Fund',
          type: 'savings',
          targetAmount: 5000,
          currentAmount: 1500,
          progress: 30,
          targetDate: '2024-12-31',
          userId: 'user_123',
          isActive: true,
        },
        {
          id: 'goal_2',
          name: 'Vacation Fund',
          type: 'savings',
          targetAmount: 2000,
          currentAmount: 800,
          progress: 40,
          targetDate: '2024-08-15',
          userId: 'user_123',
          isActive: true,
        },
      ]

      mockSWR.mockReturnValue({
        data: { goals: mockGoals },
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any)

      render(<GoalsPage />)

      expect(screen.getByText('My Goals')).toBeInTheDocument()
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
      expect(screen.getByText('Vacation Fund')).toBeInTheDocument()
      expect(screen.getByText('$1,500 / $5,000')).toBeInTheDocument()
    })

    it('should show create goal button', () => {
      mockSWR.mockReturnValue({
        data: { goals: [] },
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any)

      render(<GoalsPage />)

      const createButton = screen.getByRole('button', { name: /create goal/i })
      expect(createButton).toBeInTheDocument()
    })

    it('should filter goals by type', async () => {
      const mockGoals = [
        { id: 'goal_1', name: 'Emergency Fund', type: 'savings', userId: 'user_123', isActive: true, targetAmount: 5000, currentAmount: 1500, progress: 30, targetDate: '2024-12-31' },
        { id: 'goal_2', name: 'Pay off Credit Card', type: 'debt_payoff', userId: 'user_123', isActive: true, targetAmount: 3000, currentAmount: 1000, progress: 33, targetDate: '2024-10-31' },
        { id: 'goal_3', name: 'Dining Budget', type: 'spending_limit', userId: 'user_123', isActive: true, targetAmount: 500, currentAmount: 200, progress: 40, targetDate: '2024-06-30' },
      ]

      mockSWR.mockReturnValue({
        data: { goals: mockGoals },
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any)

      render(<GoalsPage />)

      const savingsFilter = screen.getByRole('button', { name: /savings/i })
      fireEvent.click(savingsFilter)

      expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
      expect(screen.queryByText('Pay off Credit Card')).not.toBeInTheDocument()
    })

    it('should show empty state when no goals', () => {
      mockSWR.mockReturnValue({
        data: { goals: [] },
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as any)

      render(<GoalsPage />)

      expect(screen.getByText(/no goals yet/i)).toBeInTheDocument()
      expect(screen.getByText(/start by creating your first goal/i)).toBeInTheDocument()
    })
  })

  describe('Goal Card Component', () => {
    const mockGoal = {
      id: 'goal_1',
      name: 'Emergency Fund',
      type: 'savings',
      targetAmount: 5000,
      currentAmount: 1500,
      progress: 30,
      targetDate: '2024-12-31',
      description: 'Build 3-month emergency fund',
      userId: 'user_123',
      isActive: true,
    }

    it('should display goal information', () => {
      render(<GoalCard goal={mockGoal as any} />)

      expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
      expect(screen.getByText('$1,500 / $5,000')).toBeInTheDocument()
      expect(screen.getByText('30%')).toBeInTheDocument()
    })

    it('should show progress bar', () => {
      render(<GoalCard goal={mockGoal as any} />)

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '30')
    })

    it('should display target date', () => {
      render(<GoalCard goal={mockGoal as any} />)

      expect(screen.getByText(/dec 31, 2024/i)).toBeInTheDocument()
    })

    it('should show edit and delete buttons', () => {
      render(<GoalCard goal={mockGoal as any} />)

      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('should show achievement badge for completed goals', () => {
      const completedGoal = {
        ...mockGoal,
        progress: 100,
        achievedAt: '2024-06-15T10:00:00Z',
      }

      render(<GoalCard goal={completedGoal} />)

      expect(screen.getByText(/achieved/i)).toBeInTheDocument()
      expect(screen.getByTestId('achievement-badge')).toBeInTheDocument()
    })

    it('should handle different goal types correctly', () => {
      const debtGoal = {
        ...mockGoal,
        name: 'Credit Card Payoff',
        type: 'debt_payoff',
        targetAmount: 3000,
        currentAmount: 2000, // Remaining debt
        progress: 33.33,
      }

      render(<GoalCard goal={debtGoal as any} />)

      expect(screen.getByText('Credit Card Payoff')).toBeInTheDocument()
      expect(screen.getByText('$2,000 remaining')).toBeInTheDocument()
    })
  })

  describe('Create Goal Modal', () => {
    const mockOnSave = jest.fn()
    const mockOnClose = jest.fn()

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should render goal creation form', () => {
      render(
        <CreateGoalModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
        />
      )

      expect(screen.getByText('Create New Goal')).toBeInTheDocument()
      expect(screen.getByLabelText(/goal name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/goal type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/target amount/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/target date/i)).toBeInTheDocument()
    })

    it('should show different fields based on goal type', async () => {
      render(
        <CreateGoalModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
        />
      )

      const typeSelect = screen.getByLabelText(/goal type/i)
      fireEvent.change(typeSelect, { target: { value: 'spending_limit' } })

      await waitFor(() => {
        expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/period/i)).toBeInTheDocument()
      })
    })

    it('should validate required fields', async () => {
      render(
        <CreateGoalModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
        />
      )

      const saveButton = screen.getByRole('button', { name: /save goal/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText(/goal name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/target amount is required/i)).toBeInTheDocument()
      })

      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should submit valid goal data', async () => {
      render(
        <CreateGoalModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
        />
      )

      fireEvent.change(screen.getByLabelText(/goal name/i), {
        target: { value: 'Emergency Fund' },
      })
      fireEvent.change(screen.getByLabelText(/target amount/i), {
        target: { value: '5000' },
      })
      fireEvent.change(screen.getByLabelText(/target date/i), {
        target: { value: '2024-12-31' },
      })

      const saveButton = screen.getByRole('button', { name: /save goal/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({
          name: 'Emergency Fund',
          type: 'savings',
          targetAmount: 5000,
          targetDate: '2024-12-31',
        })
      })
    })

    it('should provide smart amount recommendations', () => {
      render(
        <CreateGoalModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onSave={mockOnSave} 
        />
      )

      const typeSelect = screen.getByLabelText(/goal type/i)
      fireEvent.change(typeSelect, { target: { value: 'savings' } })

      expect(screen.getByText(/recommended: $1,000/i)).toBeInTheDocument()
      expect(screen.getByText(/3-month emergency fund: $7,500/i)).toBeInTheDocument()
    })
  })

  describe('Goal Achievement Celebration', () => {
    it('should show celebration modal when goal is achieved', async () => {
      const achievedGoal = {
        id: 'goal_1',
        name: 'Emergency Fund',
        type: 'savings',
        targetAmount: 5000,
        currentAmount: 5000,
        progress: 100,
        achievedAt: new Date().toISOString(),
      }

      render(<GoalCard goal={achievedGoal as any} />)

      expect(screen.getByTestId('celebration-modal')).toBeInTheDocument()
      expect(screen.getByText(/congratulations!/i)).toBeInTheDocument()
      expect(screen.getByText(/you achieved your emergency fund goal/i)).toBeInTheDocument()
    })

    it('should suggest next steps after achievement', () => {
      const achievedGoal = {
        id: 'goal_1',
        name: 'Emergency Fund',
        type: 'savings',
        targetAmount: 5000,
        currentAmount: 5000,
        progress: 100,
        achievedAt: new Date().toISOString(),
      }

      render(<GoalCard goal={achievedGoal as any} />)

      expect(screen.getByText(/what's next?/i)).toBeInTheDocument()
      expect(screen.getByText(/create a new savings goal/i)).toBeInTheDocument()
      expect(screen.getByText(/increase your target amount/i)).toBeInTheDocument()
    })
  })

  describe('Goal Deadline Reminders', () => {
    it('should show warning for goals approaching deadline', () => {
      const nearDeadlineGoal = {
        id: 'goal_1',
        name: 'Vacation Fund',
        type: 'savings',
        targetAmount: 2000,
        currentAmount: 500,
        progress: 25,
        targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      }

      render(<GoalCard goal={nearDeadlineGoal as any} />)

      expect(screen.getByText(/deadline approaching/i)).toBeInTheDocument()
      expect(screen.getByText(/7 days remaining/i)).toBeInTheDocument()
    })

    it('should show overdue status for missed deadlines', () => {
      const overdueGoal = {
        id: 'goal_1',
        name: 'Old Goal',
        type: 'savings',
        targetAmount: 1000,
        currentAmount: 300,
        progress: 30,
        targetDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      }

      render(<GoalCard goal={overdueGoal as any} />)

      expect(screen.getByText(/overdue/i)).toBeInTheDocument()
      expect(screen.getByText(/7 days overdue/i)).toBeInTheDocument()
    })
  })
})