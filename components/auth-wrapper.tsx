'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/signin')
    }
  }, [isLoaded, isSignedIn, router])

  // TDD GREEN: Show loading state while auth is loading
  if (!isLoaded) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gray-950"
        data-testid="auth-loading"
      >
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // TDD GREEN: Show redirect message for unauthenticated users
  if (!isSignedIn) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center bg-gray-950"
        data-testid="auth-redirect"
      >
        <div className="text-white">Redirecting to sign in...</div>
      </div>
    )
  }

  // TDD GREEN: Render protected content for authenticated users
  return <>{children}</>
}