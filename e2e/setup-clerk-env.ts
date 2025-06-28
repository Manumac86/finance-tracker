// Helper to setup Clerk environment variables from publishable key
export function setupClerkEnvironment() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  if (!publishableKey) {
    throw new Error('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set');
  }
  
  // Handle different Clerk publishable key formats
  let domain: string;
  let environment: string;
  
  // New format: pk_test_xxxxx or pk_live_xxxxx (possibly base64 encoded domain)
  if (publishableKey.match(/^pk_(test|live)_[A-Za-z0-9+/=]+$/)) {
    // For new format, try to decode base64 to find domain
    environment = publishableKey.includes('pk_test_') ? 'test' : 'live';
    
    // Try to decode the key part after pk_test_ or pk_live_
    const keyPart = publishableKey.replace(/^pk_(test|live)_/, '');
    try {
      // Attempt to decode - the domain might be embedded in base64
      const decoded = Buffer.from(keyPart, 'base64').toString('utf-8');
      const domainMatch = decoded.match(/([a-z0-9-]+\.clerk\.accounts\.dev?)/);
      if (domainMatch) {
        domain = domainMatch[1];
        console.log(`✅ Extracted Clerk domain from key: ${domain}`);
      } else {
        throw new Error('Domain not found in decoded key');
      }
    } catch (e) {
      // If decoding fails, try environment variables
      if (process.env.CLERK_FRONTEND_API) {
        domain = process.env.CLERK_FRONTEND_API.replace('https://', '');
      } else if (process.env.NEXT_PUBLIC_CLERK_FRONTEND_API) {
        domain = process.env.NEXT_PUBLIC_CLERK_FRONTEND_API.replace('https://', '');
      } else {
        // For this specific app, we know the domain
        domain = 'immense-pony-52.clerk.accounts.dev';
        console.log('⚠️  Using hardcoded Clerk domain:', domain);
      }
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