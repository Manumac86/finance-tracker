/**
 * TDD REFACTOR: Cleaner sign-up page using extracted components
 */

import { SignUp } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { AuthLayout } from '@/components/auth/auth-layout'
import { clerkDarkTheme } from '@/lib/auth/clerk-theme'

export default async function SignUpPage() {
  // Check if user is already authenticated
  const user = await currentUser()
  
  if (user) {
    redirect('/dashboard')
  }

  return (
    <AuthLayout>
      <SignUp appearance={clerkDarkTheme} />
    </AuthLayout>
  )
}