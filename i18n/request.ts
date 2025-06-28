import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { defaultLocale, locales, type Locale } from "./config";
import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

const LOCALE_COOKIE_NAME = "locale";

export async function getLocaleFromCookie(): Promise<Locale | undefined> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME);

  if (localeCookie && locales.includes(localeCookie.value as Locale)) {
    return localeCookie.value as Locale;
  }

  return undefined;
}

export async function getLocaleFromHeaders(headers: Headers): Promise<Locale> {
  // Try to get locale from cookie first
  const cookieLocale = await getLocaleFromCookie();
  if (cookieLocale) {
    return cookieLocale;
  }

  // Fall back to Accept-Language header
  const acceptLanguage = headers.get("accept-language") || "";
  const languages = new Negotiator({
    headers: { "accept-language": acceptLanguage },
  }).languages();

  try {
    return match(languages, [...locales], defaultLocale) as Locale;
  } catch {
    return defaultLocale;
  }
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
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  console.log("requested", requested);
  console.log("locale", locale);
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
