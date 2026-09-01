"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NAV_ITEMS, activeNavItem } from "@/lib/navigation"

export function NavMain() {
  const pathname = usePathname()
  const active = activeNavItem(pathname)

  return (
    <SidebarMenu>
      {NAV_ITEMS.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            isActive={active?.href === item.href}
            tooltip={item.title}
            render={
              <Link href={item.href}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            }
          />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
