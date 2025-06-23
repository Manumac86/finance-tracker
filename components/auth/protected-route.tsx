"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  redirectTo = "/signin" 
}: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(redirectTo);
    }
  }, [isLoaded, isSignedIn, router, redirectTo]);

  // Show loading state while auth is loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div data-testid="auth-loading" className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show redirect indicator for unauthenticated users
  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div 
          data-testid="auth-redirect" 
          className="text-center"
        >
          <p className="text-gray-400">Redirecting to sign in...</p>
        </div>
        {/* Mobile-specific redirect indicator */}
        <div 
          data-testid="mobile-auth-redirect" 
          className="text-center hidden"
        >
          <p className="text-gray-400">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}