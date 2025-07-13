import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // Check for test bypass header for E2E tests
  const testBypass = req.headers.get('x-e2e-test-bypass') === 'true' || 
                     process.env.E2E_TEST_BYPASS === 'true';

  // Handle API routes - protect them but skip i18n
  if (pathname.startsWith("/api/")) {
    // Protect API routes that need authentication (unless test bypass is enabled)
    if (
      !testBypass && (
        pathname.startsWith("/api/transactions") ||
        pathname.startsWith("/api/categories") ||
        pathname.startsWith("/api/budgets") ||
        pathname.startsWith("/api/goals") ||
        pathname.startsWith("/api/family") ||
        pathname.startsWith("/api/banking") ||
        pathname.startsWith("/api/projects") ||
        pathname.startsWith("/api/recurring-transactions") ||
        pathname.startsWith("/api/budget-alerts") ||
        pathname.startsWith("/api/bill-reminders") ||
        pathname.startsWith("/api/export")
      )
    ) {
      await auth.protect();
    }
    return;
  }

  // Define protected routes patterns
  const protectedPatterns = [
    "/dashboard",
    "/transactions",
    "/categories",
    "/settings",
    "/goals",
    "/budgets",
    "/recurring",
    "/reports",
    "/banking",
    "/family",
    "/onboarding",
  ];

  // Check if the current route is protected
  const locale = pathname.split("/")[1];
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

  const isProtectedRoute = protectedPatterns.some(
    (pattern) =>
      pathWithoutLocale === pattern ||
      pathWithoutLocale.startsWith(pattern + "/")
  );

  // If it's a protected route and has a valid locale, protect it (unless test bypass is enabled)
  if (
    !testBypass &&
    isProtectedRoute &&
    routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    await auth.protect();
  }

  // Let next-intl handle the i18n routing
  return intlMiddleware(req);
});

export const config = {
  // Match all pathnames except for
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  // - public assets (images, etc)
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|bmp)$).*)",
    "/api/(.*)",
  ],
};
