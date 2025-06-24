/// <reference types="jest" />
/**
 * TDD RED Phase: Protected Routes Tests
 * 
 * These tests will initially FAIL because we haven't implemented route protection.
 * We're defining the behavior we want before implementing it.
 */

import { render, screen } from '@testing-library/react'
import { useUser } from '@clerk/nextjs'
import DashboardPage from '@/app/(dashboard)/dashboard/page'

const mockUseUser = useUser as any

describe('TDD RED: Protected Routes Tests (Will Fail Initially)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Dashboard Protection', () => {
    it('should show dashboard content to authenticated users', async () => {
      // Mock authenticated user
      mockUseUser.mockReturnValue({
        user: { 
          id: 'user_123', 
          emailAddresses: [{ emailAddress: 'test@example.com' }],
          firstName: 'John',
          lastName: 'Doe'
        },
        isLoaded: true,
        isSignedIn: true,
      } as any)

      render(<DashboardPage />)
      
      // RED: This should pass because dashboard exists, but we need to verify auth integration
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Welcome back! Here\'s an overview of your finances.')).toBeInTheDocument()
    })

    it('should redirect unauthenticated users to sign-in', () => {
      // Mock unauthenticated state
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: true,
        isSignedIn: false,
      } as any)

      // RED: This will fail because we don't have protection middleware yet
      render(<DashboardPage />)
      
      // Should not render dashboard content for unauthenticated users
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
      
      // Should show loading or redirect indicator
      expect(screen.getByTestId('auth-redirect')).toBeInTheDocument()
    })

    it('should show loading state while auth is loading', () => {
      // Mock loading state
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: false,
        isSignedIn: false,
      } as any)

      // RED: This will fail because we don't have loading states yet
      render(<DashboardPage />)
      
      // Should show loading indicator
      expect(screen.getByTestId('auth-loading')).toBeInTheDocument()
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    })
  })

  describe('Mobile Dashboard Protection', () => {
    it('should maintain protection on mobile devices', () => {
      globalThis.resizeWindow(375, 667) // Mobile viewport
      
      // Mock unauthenticated state
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: true,
        isSignedIn: false,
      } as any)

      // RED: Will fail until we implement mobile-aware auth protection
      render(<DashboardPage />)
      
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
      expect(screen.getByTestId('mobile-auth-redirect')).toBeInTheDocument()
    })
  })
})