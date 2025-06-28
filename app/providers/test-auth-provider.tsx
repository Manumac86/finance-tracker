"use client";

import { useEffect } from "react";

// Define proper types for test mode
interface TestUser {
  id: string;
  email: string;
  name?: string;
}

interface WindowWithTestMode extends Window {
  __E2E_TEST_MODE__?: boolean;
  __E2E_TEST_USER__?: TestUser;
}

/**
 * Test Authentication Provider
 * This component checks for E2E test mode and bypasses Clerk authentication
 * Only active in development/test environments
 */
export function TestAuthProvider({ children }: { children: React.ReactNode }) {

  useEffect(() => {
    // Only run in development or test environments
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    // Check if we're in E2E test mode
    const isTestMode = window.localStorage.getItem('e2e_test_mode') === 'true';
    const testUser = window.localStorage.getItem('e2e_test_user');

    if (isTestMode && testUser) {
      try {
        const user = JSON.parse(testUser);
        
        // Set a global flag that components can check
        const testWindow = window as WindowWithTestMode;
        testWindow.__E2E_TEST_MODE__ = true;
        testWindow.__E2E_TEST_USER__ = user;

        console.log('🧪 E2E Test Mode Active - User:', user.email);
      } catch (error) {
        console.error('Failed to parse test user:', error);
      }
    }
  }, []);

  return <>{children}</>;
}