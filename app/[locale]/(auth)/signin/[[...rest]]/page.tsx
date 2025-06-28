/**
 * TDD REFACTOR: Cleaner sign-in page using extracted components
 * 
 * Functionality remains the same (tests still pass) but code is more maintainable.
 */

import { SignIn } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { AuthLayout } from '@/components/auth/auth-layout'
import { clerkDarkTheme } from '@/lib/auth/clerk-theme'

export default async function SignInPage() {
  // Check if user is already authenticated
  const user = await currentUser()
  
  if (user) {
    redirect('/dashboard')
  }

  return (
    <AuthLayout>
      <SignIn appearance={clerkDarkTheme} />
    </AuthLayout>
  )
}