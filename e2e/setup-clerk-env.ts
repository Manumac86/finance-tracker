// Helper to setup Clerk environment variables from publishable key
export function setupClerkEnvironment() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    throw new Error('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set');
  }
  
  // Handle different Clerk publishable key formats
  let domain: string;
  let environment: string;
  
  // New format: pk_test_xxxxx or pk_live_xxxxx (no domain in key)
  if (publishableKey.match(/^pk_(test|live)_[A-Za-z0-9]+$/)) {
    // For new format, we need to get the domain from other env vars or use default
    environment = publishableKey.includes('pk_test_') ? 'test' : 'live';
    
    // Try to get domain from other environment variables
    if (process.env.CLERK_FRONTEND_API) {
      domain = process.env.CLERK_FRONTEND_API.replace('https://', '');
    } else if (process.env.NEXT_PUBLIC_CLERK_FRONTEND_API) {
      domain = process.env.NEXT_PUBLIC_CLERK_FRONTEND_API.replace('https://', '');
    } else {
      // Use a fallback - this might need to be adjusted based on your Clerk instance
      console.warn('⚠️  Could not determine Clerk domain from environment. Using default.');
      domain = 'clerk.local'; // This will need to be updated with your actual Clerk domain
    }
  } 
  // Old format: pk_test_[subdomain].clerk.accounts.dev
  else if (publishableKey.match(/pk_(test|live)_(.+?)\.clerk\.accounts/)) {
    const match = publishableKey.match(/pk_(test|live)_(.+?)\.clerk\.accounts/);
    if (match) {
      environment = match[1];
      domain = `${match[2]}.clerk.accounts.dev`;
    } else {
      throw new Error('Could not parse Clerk domain from publishable key');
    }
  } else {
    throw new Error(`Unsupported Clerk publishable key format: ${publishableKey}`);
  }
  
  // Set required environment variables
  const frontendApi = domain.startsWith('http') ? domain : `https://${domain}`;
  process.env.CLERK_FRONTEND_API = frontendApi;
  
  // Also set sign in/up URLs if not already set
  if (!process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL) {
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL = '/signin';
  }
  if (!process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL) {
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL = '/signup';
  }
  if (!process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL) {
    process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = '/dashboard';
  }
  if (!process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL) {
    process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = '/onboarding';
  }
  
  return {
    frontendApi,
    environment,
    domain,
  };
}