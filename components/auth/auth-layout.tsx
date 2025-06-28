/**
 * TDD REFACTOR: Extract reusable auth layout component
 * 
 * This refactor improves code reusability without changing functionality.
 * Our tests still pass, but code is cleaner and more maintainable.
 */

import { DollarSign } from 'lucide-react'
import Link from 'next/link'

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
}

export function AuthLayout({ children, title = "FinTrack" }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      {/* Mobile-optimized header - extracted for reusability */}
      <header className="flex h-16 items-center gap-4 border-b bg-background/95 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <DollarSign className="h-6 w-6 text-emerald-500" />
          <span>{title}</span>
        </Link>
      </header>
      
      {/* Mobile-responsive content container */}
      <main 
        className="flex flex-1 items-center justify-center p-4 sm:p-6"
        data-testid="auth-container"
      >
        <div className="responsive-auth-layout mx-auto max-w-md w-full">
          {children}
        </div>
      </main>
    </div>
  )
}