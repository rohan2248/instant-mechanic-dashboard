"use client"

import { CalendarIcon } from "lucide-react"

import { useTableParams } from "@/components/data-table/use-table-params"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toApiDate } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Date presets rather than a two-ended calendar.
 *
 * Ops work in relative windows ("today", "this week"), and presets keep the
 * URL to two clean `YYYY-MM-DD` values that map straight onto the API's
 * inclusive `from`/`to` filter on `scheduledOn`.
 *
 * Dates are computed in IST via `toApiDate` because that is the zone the API
 * buckets `scheduledOn` in — using the browser's zone would shift the
 * boundary for anyone outside India.
 */
const PRESETS = [
  { label: "Today", days: 0 },
  { label: "Last 7 days", days: 6 },
  { label: "Last 30 days", days: 29 },
  { label: "Last 90 days", days: 89 },
] as const

function rangeFor(days: number) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - days)
  return { from: toApiDate(from), to: toApiDate(to) }
}

export function DateRangeFilter() {
  const { searchParams, setParams } = useTableParams()

  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const active = Boolean(from || to)

  const activeLabel =
    PRESETS.find((preset) => {
      const range = rangeFor(preset.days)
      return range.from === from && range.to === to
    })?.label ?? (active ? `${from ?? "…"} → ${to ?? "…"}` : "Date")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(!active && "border-dashed")}
          >
            <CalendarIcon data-icon="inline-start" />
            {activeLabel}
          </Button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          {PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.label}
              onClick={() => setParams(rangeFor(preset.days))}
            >
              {preset.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {active ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => setParams({ from: null, to: null })}
              >
                Clear dates
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
