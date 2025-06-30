"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { navItems } from "./app-sidebar";

export function TopBar() {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const navItem = navItems.find(
    (item) => item.url.split("/").pop() === pathname.split("/").pop()
  );

  return (
    <header className="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2 p-4 border-border">
      <SidebarTrigger className="-ml-1 h-8 w-8" />
      <h1 className="text-2xl font-bold">
        {t(`${navItem?.title.toLowerCase()}`)}
      </h1>
      <div className="flex flex-1 items-center gap-2">
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
            className="pl-8 md:w-[200px] lg:w-[336px]"
          />
        </div>
      </div>
    </header>
  );
}
