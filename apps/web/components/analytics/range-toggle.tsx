"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RANGE_OPTIONS, withParams } from "@/lib/api/search-params"
import { cn } from "@/lib/utils"

/**
 * 7 / 30 / 90 day range.
 *
 * Writes `?days=` and lets the server refetch, so this is a real range change
 * against the API rather than slicing an already-fetched series client-side —
 * which matters because /dashboard/timeseries only returns the window it was
 * asked for.
 *
 * Base UI's ToggleGroup is always array-valued, hence the wrap/unwrap.
 */
export function RangeToggle({ days }: { days: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  return (
    <ToggleGroup
      size="sm"
      variant="outline"
      value={[String(days)]}
      onValueChange={(value) => {
        const next = (value as string[])[0]
        // Base UI clears the array when the active item is re-pressed; keep
        // the current range instead of falling back to the default.
        if (!next) return
        startTransition(() => {
          router.push(`?${withParams(searchParams, { days: next })}`, {
            scroll: false,
          })
        })
      }}
      className={cn(isPending && "opacity-60")}
      aria-label="Time range"
    >
      {RANGE_OPTIONS.map((option) => (
        <ToggleGroupItem key={option} value={String(option)}>
          {option}d
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
