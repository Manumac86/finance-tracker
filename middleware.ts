import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { defaultLocale, locales, isValidLocale } from '@/lib/i18n/config'
import { getLocaleFromHeaders } from '@/lib/i18n/request'

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/:locale/dashboard(.*)',
  '/:locale/transactions(.*)',
  '/:locale/categories(.*)',
  '/:locale/settings(.*)',
  '/:locale/goals(.*)',
  '/:locale/budgets(.*)',
  '/:locale/recurring(.*)',
  '/:locale/reports(.*)',
  '/:locale/banking(.*)',
  '/:locale/family(.*)',
  '/:locale/onboarding(.*)',
])

// Define public routes that should always be accessible
const isPublicRoute = createRouteMatcher([
  '/',
  '/:locale',
  '/:locale/signin(.*)',
  '/:locale/signup(.*)',
])

// API routes and static files that should not be localized
const shouldNotLocalize = createRouteMatcher([
  '/api(.*)',
  '/_next(.*)',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const pathname = req.nextUrl.pathname

  // Skip localization for API routes and static files
  if (shouldNotLocalize(req)) {
    return
  }

  // Check if the pathname already includes a valid locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) {
    // Extract locale from pathname
    const locale = pathname.split('/')[1]
    
    // Handle authentication for protected routes
    if (isProtectedRoute(req) && !isPublicRoute(req)) {
      await auth.protect()
    }
    
    return
  }

  // No locale in pathname, need to redirect
  const locale = await getLocaleFromHeaders(req.headers)
  
  // Redirect to the localized URL
  const newUrl = new URL(`/${locale}${pathname}`, req.url)
  
  // Preserve query parameters
  newUrl.search = req.nextUrl.search
  
  const response = NextResponse.redirect(newUrl)
  
  // Set locale cookie
  response.cookies.set('locale', locale, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })
  
  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}