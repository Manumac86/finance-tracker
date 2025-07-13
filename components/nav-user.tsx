"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useTheme } from "next-themes";
import { LanguageSwitcher } from "./language-switcher";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const { user: clerkUser, isLoaded } = useUser();
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration errors by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate fallback initials safely
  const getFallbackInitials = () => {
    if (!mounted || !isLoaded || !clerkUser) {
      return "U"; // Safe fallback for server/loading state
    }
    const first = clerkUser.firstName?.charAt(0)?.toUpperCase() || "";
    const last = clerkUser.lastName?.charAt(0)?.toUpperCase() || "";
    return first + last || "U";
  };

  // Get user display name safely
  const getDisplayName = () => {
    if (!mounted || !isLoaded || !clerkUser) {
      return user.name; // Fallback to prop
    }
    return `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || user.name;
  };

  // Get user email safely
  const getDisplayEmail = () => {
    if (!mounted || !isLoaded || !clerkUser) {
      return user.email; // Fallback to prop
    }
    return clerkUser.emailAddresses?.[0]?.emailAddress || user.email;
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={mounted && isLoaded && clerkUser?.imageUrl || user.avatar}
                  alt={getDisplayName()}
                  className="rounded-full"
                />
                <AvatarFallback className="rounded-lg">
                  {getFallbackInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {getDisplayName()}
                </span>
                <span className="truncate text-xs">
                  {getDisplayEmail()}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={mounted && isLoaded && clerkUser?.imageUrl || user.avatar}
                    alt={getDisplayName()}
                    className="rounded-full"
                  />
                  <AvatarFallback className="rounded-lg">
                    {getFallbackInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {getDisplayName()}
                  </span>
                  <span className="truncate text-xs">
                    {getDisplayEmail()}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground px-2">
                Language
              </DropdownMenuLabel>
              <LanguageSwitcher variant="inline" />
            </DropdownMenuGroup>
            {mounted && (
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground px-2">
                  Theme
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuGroup>
            )}
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              <SignOutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
