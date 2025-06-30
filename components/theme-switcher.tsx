"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-full justify-start">
        <Sun className="mr-2 h-4 w-4" />
        <span>Theme</span>
      </Button>
    );
  }

  const handleThemeChange = (newTheme: string) => {
    // Add class to suppress transitions
    document.documentElement.classList.add('theme-changing');
    
    startTransition(() => {
      setTheme(newTheme);
      
      // Remove the class after theme change is complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove('theme-changing');
        });
      });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start"
          disabled={isPending}
        >
          {theme === "light" ? (
            <Sun className="mr-2 h-4 w-4 text-yellow-500" />
          ) : theme === "dark" ? (
            <Moon className="mr-2 h-4 w-4" />
          ) : (
            <Monitor className="mr-2 h-4 w-4" />
          )}
          <span className="text-sm">
            {theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => handleThemeChange("light")}
          className="cursor-pointer"
          disabled={theme === "light"}
        >
          <Sun className="mr-2 h-4 w-4 text-yellow-500" />
          <span className="text-foreground">Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("dark")}
          className="cursor-pointer"
          disabled={theme === "dark"}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span className="text-foreground">Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("system")}
          className="cursor-pointer"
          disabled={theme === "system"}
        >
          <Monitor className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
