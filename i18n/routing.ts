import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "es"],

  // Used when no locale matches
  defaultLocale: "en",
});

// Export type for TypeScript
export type Locale = (typeof routing.locales)[number];

// Locale metadata
export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

export const localeFlagEmojis: Record<Locale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
};

// Locale-specific configuration
export const localeConfig: Record<
  Locale,
  {
    currency: string;
    dateFormat: string;
    numberFormat: {
      decimal: string;
      thousands: string;
    };
  }
> = {
  en: {
    currency: "USD",
    dateFormat: "MM/dd/yyyy",
    numberFormat: {
      decimal: ".",
      thousands: ",",
    },
  },
  es: {
    currency: "EUR",
    dateFormat: "dd/MM/yyyy",
    numberFormat: {
      decimal: ",",
      thousands: ".",
    },
  },
};

export function isValidLocale(locale: string): locale is Locale {
  return routing.locales.includes(locale as Locale);
}
