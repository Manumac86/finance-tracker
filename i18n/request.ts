import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing, type Locale } from "./routing";

const LOCALE_COOKIE_NAME = "locale";

export async function getLocaleFromCookie(): Promise<Locale | undefined> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME);

  if (localeCookie && hasLocale(routing.locales, localeCookie.value)) {
    return localeCookie.value as Locale;
  }

  return undefined;
}

export async function setLocaleCookie(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  });
}

export default getRequestConfig(async ({ requestLocale }) => {
  // Validate that the incoming locale is valid
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
