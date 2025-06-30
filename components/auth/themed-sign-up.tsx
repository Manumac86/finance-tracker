"use client";

import { SignUp } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { clerkLightTheme, clerkDarkTheme, clerkSystemTheme } from "@/lib/auth/clerk-theme-adaptive";

export function ThemedSignUp() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR or initial load, use system theme
  if (!mounted) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <SignUp appearance={clerkSystemTheme} />
      </div>
    );
  }

  // Use resolved theme for system preference
  const currentTheme = theme === "system" ? resolvedTheme : theme;
  const appearance = currentTheme === "dark" ? clerkDarkTheme : clerkLightTheme;

  return (
    <div className="min-h-[600px] flex items-center justify-center">
      <SignUp appearance={appearance} />
    </div>
  );
}