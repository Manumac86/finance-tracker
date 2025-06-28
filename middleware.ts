import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
import { defaultLocale, locales } from '@/lib/i18n/config'

// Create patterns dynamically based on available locales
const localePattern = `(${locales.join('|')})`

// Use createRouteMatcher with dynamic patterns that work with any locale
const isProtectedRoute = createRouteMatcher([
  `/${localePattern}/dashboard(.*)`,
  `/${localePattern}/transactions(.*)`,
  `/${localePattern}/categories(.*)`,
  `/${localePattern}/settings(.*)`,
  `/${localePattern}/goals(.*)`,
  `/${localePattern}/budgets(.*)`,
  `/${localePattern}/recurring(.*)`,
  `/${localePattern}/reports(.*)`,
  `/${localePattern}/banking(.*)`,
  `/${localePattern}/family(.*)`,
  `/${localePattern}/onboarding(.*)`,
])

const isPublicRoute = createRouteMatcher([
  '/',
  `/${localePattern}`,
  `/${localePattern}/signin(.*)`,
  `/${localePattern}/signup(.*)`,
])

function getLocale(request: NextRequest): string {
  // Check if there's a locale cookie
  const localeCookie = request.cookies.get('locale')
  if (localeCookie && locales.includes(localeCookie.value as typeof locales[number])) {
    return localeCookie.value
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') || ''
  const languages = new Negotiator({ headers: { 'accept-language': acceptLanguage } }).languages()
  
  try {
    return match(languages, [...locales], defaultLocale)
  } catch {
    return defaultLocale
  }
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const pathname = req.nextUrl.pathname

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/manifest.json') ||
    pathname.includes('.')
  ) {
    return
  }

  // Handle API routes - apply auth but skip localization
  if (pathname.startsWith('/api/')) {
    // Protect API routes that need authentication
    if (pathname.startsWith('/api/transactions') || 
        pathname.startsWith('/api/categories') ||
        pathname.startsWith('/api/budgets') ||
        pathname.startsWith('/api/goals') ||
        pathname.startsWith('/api/family') ||
        pathname.startsWith('/api/banking') ||
        pathname.startsWith('/api/projects') ||
        pathname.startsWith('/api/recurring-transactions') ||
        pathname.startsWith('/api/budget-alerts') ||
        pathname.startsWith('/api/bill-reminders') ||
        pathname.startsWith('/api/export')) {
      await auth.protect()
    }
    return
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // If pathname has locale, handle authentication and continue
  if (pathnameHasLocale) {
    // Handle authentication for protected routes
    if (isProtectedRoute(req) && !isPublicRoute(req)) {
      await auth.protect()
    }
    return
  }

  // If no locale in pathname, redirect to localized version
  const locale = getLocale(req)
  const newPathname = `/${locale}${pathname === '/' ? '' : pathname}`
  
  const response = NextResponse.redirect(new URL(newPathname, req.url))
  
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
    // Match all pathnames except for
    // - api routes
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - any file with an extension
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}