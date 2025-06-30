/**
 * TDD REFACTOR: Cleaner sign-up page using extracted components
 */

import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { AuthLayout } from '@/components/auth/auth-layout'
import { ThemedSignUp } from '@/components/auth/themed-sign-up'

export default async function SignUpPage() {
  // Check if user is already authenticated
  const user = await currentUser()
  
  if (user) {
    redirect('/dashboard')
  }

  return (
    <AuthLayout>
      <ThemedSignUp />
    </AuthLayout>
  )
}