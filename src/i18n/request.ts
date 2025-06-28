import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from '@/lib/i18n/config';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    locale: locale as Locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});