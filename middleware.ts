import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// TDD GREEN: Define protected routes that require authentication
// NOTE: Auth routes (/signin, /signup) are NOT included here
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/transactions(.*)',
  '/categories(.*)',
  '/settings(.*)',
])

// Define public routes that should always be accessible
const isPublicRoute = createRouteMatcher([
  '/',
  '/signin(.*)',  // Allow all signin paths
  '/signup(.*)',  // Allow all signup paths
])

export default clerkMiddleware(async (auth, req) => {
  // Don't protect public routes
  if (isPublicRoute(req)) {
    return
  }
  
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}