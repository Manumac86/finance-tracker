import '@testing-library/jest-dom'
import { loadEnvConfig } from '@next/env'

// Load environment variables for testing
loadEnvConfig(process.cwd())

// Mock ResizeObserver for JSDOM
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock Clerk for testing
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(),
  ClerkProvider: ({ children }) => children,
  SignInButton: ({ children }) => <button>{children || 'Sign In'}</button>,
  SignUpButton: ({ children }) => <button>{children || 'Sign Up'}</button>,
  UserButton: () => <button>User Menu</button>,
  SignIn: () => <div data-testid="clerk-sign-in">Sign In Component</div>,
  SignUp: () => <div data-testid="clerk-sign-up">Sign Up Component</div>,
  useUser: jest.fn(() => ({
    user: null,
    isLoaded: true,
    isSignedIn: false,
  })),
  useAuth: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: false,
    signOut: jest.fn(),
  })),
  currentUser: jest.fn(() => null),
  redirectToSignIn: jest.fn(),
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(),
}))

// Mock SWR
jest.mock('swr', () => ({
  default: jest.fn(() => ({
    data: null,
    error: null,
    isLoading: false,
    mutate: jest.fn(),
  })),
}))

// Mobile viewport testing helper
global.resizeWindow = (width, height) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
  window.dispatchEvent(new Event('resize'))
}