export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

export const localeFlagEmojis: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
};

// Locale-specific configuration
export const localeConfig: Record<Locale, {
  currency: string;
  dateFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
  };
}> = {
  en: {
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    numberFormat: {
      decimal: '.',
      thousands: ',',
    },
  },
  es: {
    currency: 'EUR',
    dateFormat: 'dd/MM/yyyy',
    numberFormat: {
      decimal: ',',
      thousands: '.',
    },
  },
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}