import {
  CalendarClock,
  ChartNoAxesCombined,
  LayoutDashboard,
  Wrench,
} from "lucide-react"

/** Sidebar nav. Icons are passed as objects, never as string keys. */
export const NAV_ITEMS = [
  {
    title: "Overview",
    href: "/",
    icon: LayoutDashboard,
    description: "Live operations at a glance",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: ChartNoAxesCombined,
    description: "Bookings, revenue and service mix",
  },
  {
    title: "Bookings",
    href: "/bookings",
    icon: CalendarClock,
    description: "Search, filter and update jobs",
  },
  {
    title: "Mechanics",
    href: "/mechanics",
    icon: Wrench,
    description: "Availability and workload",
  },
] as const

export type NavItem = (typeof NAV_ITEMS)[number]

/**
 * Longest-prefix match, so `/bookings/anything` still highlights Bookings
 * while `/` only matches exactly.
 */
export function activeNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.filter(
    (item) => item.href === pathname || (item.href !== "/" && pathname.startsWith(item.href))
  ).sort((a, b) => b.href.length - a.href.length)[0]
}
