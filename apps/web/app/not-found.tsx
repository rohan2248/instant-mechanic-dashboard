import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { NAV_ITEMS } from "@/lib/navigation"

export const metadata: Metadata = {
  title: "Page not found",
}

/**
 * Root 404. This renders outside the `(dashboard)` group, so there is no
 * sidebar to navigate from — which is exactly why it lists the four routes
 * itself rather than leaving the reader with a back button and a shrug.
 */
export default function NotFound() {
  return (
    <main
      id="main-content"
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-24"
    >
      <div className="flex flex-col gap-3">
        <p className="metric text-sm text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold">
          That page isn&rsquo;t part of the dashboard
        </h1>
        <p className="measure text-sm text-muted-foreground">
          The link may be out of date, or a booking reference may have been
          mistyped. Everything the dashboard covers is below.
        </p>
      </div>

      <nav aria-label="Dashboard sections">
        <ul className="flex flex-col divide-y divide-border">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center gap-4 rounded-md px-2 py-3.5 transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <item.icon
                  className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                  aria-hidden
                />
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                {/* Slides in on hover rather than sitting there permanently —
                    four static arrows would read as decoration. */}
                <ArrowRightIcon
                  className="ml-auto size-4 shrink-0 -translate-x-1 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  )
}
