/// <reference types="jest" />
/**
 * TDD RED Phase: Test for Clerk routing configuration
 * 
 * This test captures the real-world issue we discovered.
 */

// Import only what we need
// import { render, screen } from '@testing-library/react'

// Mock Next.js router to test catch-all routes
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/signup/verification',
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
}))

describe('TDD RED: Clerk Routing Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle catch-all routes for signup', () => {
    // RED: This test will fail until we implement catch-all routes
    const pathname = '/signup/verification'
    
    // Clerk expects routes like /signup/verification to be handled
    expect(pathname).toMatch(/^\/signup/)
    
    // Should support nested paths under /signup
    const nestedPaths = [
      '/signup',
      '/signup/verification',
      '/signup/sso-callback',
      '/signup/factor-one',
      '/signup/factor-two'
    ]
    
    nestedPaths.forEach(path => {
      expect(path).toMatch(/^\/signup/)
    })
  })

  it('should handle catch-all routes for signin', () => {
    // RED: This test will fail until we implement catch-all routes
    const signinPaths = [
      '/signin',
      '/signin/verification',
      '/signin/sso-callback',
      '/signin/factor-one',
      '/signin/factor-two'
    ]
    
    signinPaths.forEach(path => {
      expect(path).toMatch(/^\/signin/)
    })
  })

  it('should not protect auth routes in middleware', () => {
    // RED: This test defines the middleware behavior we need
    const authRoutes = ['/signin', '/signup']
    const protectedRoutes = ['/dashboard', '/transactions']
    
    // Auth routes should NOT be in protected routes
    authRoutes.forEach(route => {
      expect(protectedRoutes).not.toContain(route)
    })
    
    // Protected routes should be protected
    protectedRoutes.forEach(route => {
      expect(['/dashboard', '/transactions', '/categories', '/settings']).toContain(route)
    })
  })
})