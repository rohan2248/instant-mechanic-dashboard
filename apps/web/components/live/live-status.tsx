"use client"

import * as React from "react"
import { RefreshCwIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatRelativeTime } from "@/lib/format"
import { useHydrated } from "@/lib/hooks/use-hydrated"
import { useLiveRefresh } from "@/lib/hooks/use-live-refresh"
import { cn } from "@/lib/utils"

/**
 * "● Live · updated 8s ago" plus a manual refresh.
 *
 * The theme is monochrome, so live/paused is a filled vs hollow dot — never
 * colour alone — and the pill is `aria-live` so the state reaches screen
 * readers that can't see either.
 */
export function LiveStatus() {
  const { enabled, intervalMs, lastRefreshedAt, isRefreshing, refreshNow } =
    useLiveRefresh()

  const active = enabled && intervalMs > 0

  // Re-render once a second so the relative time actually ticks.
  const [, forceTick] = React.useState(0)
  React.useEffect(() => {
    const id = window.setInterval(() => forceTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  // The server has no idea what "8s ago" means, so the relative label only
  // appears once hydrated.
  const hydrated = useHydrated()

  const label = !hydrated
    ? active
      ? "Live"
      : "Paused"
    : isRefreshing
      ? "Updating…"
      : active
        ? `Live · ${formatRelativeTime(lastRefreshedAt)}`
        : `Paused · ${formatRelativeTime(lastRefreshedAt)}`

  return (
    <div className="flex items-center gap-1">
      <Badge
        variant={active ? "secondary" : "outline"}
        aria-live="polite"
        className="gap-1.5 font-normal tabular"
      >
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            active
              ? "bg-current"
              : "border border-current bg-transparent",
            active && !isRefreshing && "animate-pulse"
          )}
        />
        {/* Below `sm` the dot alone carries the state visually — this is the
            widest thing in the header and the first to go. `sr-only` rather
            than `hidden` so the aria-live announcement survives at every
            width; a bare dot would tell a screen-reader user nothing. */}
        <span
          className={cn(
            "sr-only sm:not-sr-only",
            isRefreshing && "shimmer"
          )}
        >
          {label}
        </span>
      </Badge>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={refreshNow}
              disabled={isRefreshing}
              aria-label="Refresh now"
            >
              <RefreshCwIcon className={cn(isRefreshing && "animate-spin")} />
            </Button>
          }
        />
        <TooltipContent>Refresh now</TooltipContent>
      </Tooltip>
    </div>
  )
}
