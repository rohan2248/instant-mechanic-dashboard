"use client"

import { usePathname } from "next/navigation"

import { LiveIntervalSelect } from "@/components/live/live-interval-select"
import { LiveStatus } from "@/components/live/live-status"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { activeNavItem } from "@/lib/navigation"

export function SiteHeader() {
  const pathname = usePathname()
  const active = activeNavItem(pathname)

  return (
    <header className="sticky top-0 z-(--z-index-sticky) flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/70">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />

      {/* min-w-0 + truncate so a long section name yields space to the
          controls instead of pushing the page into a sideways scroll. */}
      <h1 className="min-w-0 truncate text-sm font-medium">
        {active?.title ?? "Dashboard"}
      </h1>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <LiveStatus />
        {/* The cadence picker is the least essential control and the widest;
            below `sm` the live pill and manual refresh carry the function. */}
        <div className="hidden sm:block">
          <LiveIntervalSelect />
        </div>
        <Separator orientation="vertical" className="hidden h-4 sm:block" />
        <ThemeToggle />
      </div>
    </header>
  )
}
