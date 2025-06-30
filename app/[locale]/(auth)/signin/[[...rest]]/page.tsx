/**
 * TDD REFACTOR: Cleaner sign-in page using extracted components
 * 
 * Functionality remains the same (tests still pass) but code is more maintainable.
 */

import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { AuthLayout } from '@/components/auth/auth-layout'
import { ThemedSignIn } from '@/components/auth/themed-sign-in'

export default async function SignInPage() {
  // Check if user is already authenticated
  const user = await currentUser()
  
  if (user) {
    redirect('/dashboard')
  }

  return (
    <AuthLayout>
      <ThemedSignIn />
    </AuthLayout>
  )
}