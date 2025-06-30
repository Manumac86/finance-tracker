"use client";

import { type LucideIcon } from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    enabled?: boolean;
  }[];
}) {
  const t = useTranslations("navigation");
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <SidebarMenu className="flex flex-col gap-2">
      {items.map(
        (item) =>
          item.enabled && (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={
                  item.url.split("/").pop() === pathname.split("/").pop()
                }
              >
                <a href={`/${locale}/${item.url}`}>
                  <item.icon />
                  <span>{t(`${item.title.toLowerCase()}`)}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
      )}
    </SidebarMenu>
  );
}
