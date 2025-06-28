"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { routing, localeNames, localeFlagEmojis } from "@/i18n/routing";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const switchLanguage = (newLocale: string) => {
    // Remove the current locale from the pathname
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
    
    // Navigate to the new locale path
    router.push(`/${newLocale}${pathWithoutLocale}`);
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 h-8 px-2"
          aria-label="Change language"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {localeFlagEmojis[currentLocale as keyof typeof localeFlagEmojis]}{" "}
            {localeNames[currentLocale as keyof typeof localeNames]}
          </span>
          <span className="sm:hidden">
            {localeFlagEmojis[currentLocale as keyof typeof localeFlagEmojis]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {routing.locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => switchLanguage(locale)}
            className={`flex items-center gap-2 cursor-pointer ${
              locale === currentLocale ? "bg-accent" : ""
            }`}
          >
            <span className="text-base">
              {localeFlagEmojis[locale as keyof typeof localeFlagEmojis]}
            </span>
            <span>{localeNames[locale as keyof typeof localeNames]}</span>
            {locale === currentLocale && (
              <span className="ml-auto text-xs text-emerald-500">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}