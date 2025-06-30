"use client";

import { SignIn } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  clerkLightTheme,
  clerkDarkTheme,
  clerkSystemTheme,
} from "@/lib/auth/clerk-theme-adaptive";

export function ThemedSignIn() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR or initial load, use system theme
  if (!mounted) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <SignIn appearance={clerkSystemTheme} />
      </div>
    );
  }

  // Use resolved theme for system preference
  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const appearance = currentTheme === "dark" ? clerkDarkTheme : clerkLightTheme;

  return (
    <div className="min-h-[600px] flex items-center justify-center">
      <SignIn appearance={appearance} />
    </div>
  );
}
