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

interface LanguageSwitcherProps {
  variant?: "dropdown" | "inline";
}

export function LanguageSwitcher({ variant = "dropdown" }: LanguageSwitcherProps) {
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

  if (variant === "inline") {
    return (
      <div className="w-full space-y-1">
        {routing.locales.map((locale) => (
          <button
            key={locale}
            onClick={() => switchLanguage(locale)}
            className={`w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground ${
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
          </button>
        ))}
      </div>
    );
  }

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