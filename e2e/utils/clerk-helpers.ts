import { createClerkClient } from '@clerk/backend';

/**
 * Creates a fresh testing token for each test session
 */
export async function createClerkTestingToken() {
  try {
    // Check if we have a secret key
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new Error('CLERK_SECRET_KEY environment variable is not set');
    }

    // Initialize Clerk client with secret key
    const clerkClient = createClerkClient({
      secretKey: secretKey,
    });

    // Create a testing token
    const testingToken = await clerkClient.testingTokens.createTestingToken();
    
    return testingToken.token;
  } catch (error: any) {
    console.error('Failed to create Clerk testing token:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('401')) {
      throw new Error('Invalid CLERK_SECRET_KEY. Please check your Clerk secret key.');
    } else if (error.message?.includes('testingTokens')) {
      throw new Error('Testing tokens may not be available in your Clerk plan or environment.');
    }
    
    throw new Error(`Could not create testing token: ${error.message || error}`);
  }
}