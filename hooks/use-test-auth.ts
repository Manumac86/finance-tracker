import { useUser as useClerkUser } from "@clerk/nextjs";

/**
 * Custom hook that wraps Clerk's useUser to support E2E test mode
 * In test mode, it returns a mock user instead of requiring Clerk authentication
 */
export function useUser() {
  const clerkUser = useClerkUser();
  
  // In production, always use Clerk
  if (process.env.NODE_ENV === 'production') {
    return clerkUser;
  }

  // Check if we're in E2E test mode
  if (typeof window !== 'undefined' && (window as any).__E2E_TEST_MODE__) {
    const testUser = (window as any).__E2E_TEST_USER__;
    
    return {
      isLoaded: true,
      isSignedIn: true,
      user: {
        id: testUser.id || 'test_user_id',
        primaryEmailAddress: {
          emailAddress: testUser.email || 'test@example.com',
        },
        firstName: testUser.firstName || 'Test',
        lastName: testUser.lastName || 'User',
        fullName: testUser.name || 'Test User',
        imageUrl: testUser.imageUrl || '',
      },
    };
  }

  // Otherwise, use Clerk normally
  return clerkUser;
}