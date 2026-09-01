"use client"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { INTERVAL_OPTIONS, useLiveRefresh } from "@/lib/hooks/use-live-refresh"

/**
 * Refresh cadence. Base UI's Select needs an `items` prop on the root, and
 * carries string values — hence the parse on the way out.
 */
export function LiveIntervalSelect() {
  const { enabled, intervalMs, setEnabled, setIntervalMs } = useLiveRefresh()

  const value = enabled ? String(intervalMs) : "0"

  return (
    <Select
      items={INTERVAL_OPTIONS as unknown as { label: string; value: string }[]}
      value={value}
      onValueChange={(next) => {
        const ms = Number(next)
        // "Off" and "paused" are the same state, so the select drives both.
        setEnabled(ms > 0)
        if (ms > 0) setIntervalMs(ms)
      }}
    >
      <SelectTrigger size="sm" aria-label="Auto-refresh interval">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {INTERVAL_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
