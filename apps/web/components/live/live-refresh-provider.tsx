"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import {
  DEFAULT_INTERVAL_MS,
  LIVE_REFRESH_STORAGE_KEY,
  LiveRefreshContext,
} from "@/lib/hooks/use-live-refresh"

/**
 * Automatic API polling.
 *
 * Every figure on the dashboard comes from a Server Component fetch, so the
 * refresh primitive is `router.refresh()`: it re-runs the current route's
 * server render against the *current URL params* and streams the new HTML in.
 * Unlike a reload it keeps client state, scroll position, open sheets and
 * focus — which is what makes a 10-second cadence tolerable to sit in front of.
 *
 * Mounted once in the dashboard layout: one timer for all four routes.
 */
export function LiveRefreshProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isRefreshing, startTransition] = React.useTransition()

  const [enabled, setEnabled] = React.useState(true)
  const [intervalMs, setIntervalMs] = React.useState(DEFAULT_INTERVAL_MS)
  const [lastRefreshedAt, setLastRefreshedAt] = React.useState(() => Date.now())

  // Preferences are restored after mount, not during render. localStorage
  // does not exist on the server, and reading it in the hydration render
  // would produce markup that disagrees with the server's — so the one-off
  // catch-up render this costs is the price of correct hydration.
  /* eslint-disable react-hooks/set-state-in-effect -- restoring persisted
     browser state; it cannot be read during SSR or hydration. */
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LIVE_REFRESH_STORAGE_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored) as Partial<{
        enabled: boolean
        intervalMs: number
      }>
      if (typeof parsed.enabled === "boolean") setEnabled(parsed.enabled)
      if (typeof parsed.intervalMs === "number") setIntervalMs(parsed.intervalMs)
    } catch {
      // Private mode, blocked storage, corrupted value — defaults are fine.
    }
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const hydrated = React.useRef(false)
  React.useEffect(() => {
    // Skip the first pass so we never write the defaults back over a stored
    // preference before the effect above has had a chance to read it.
    if (!hydrated.current) {
      hydrated.current = true
      return
    }
    try {
      window.localStorage.setItem(
        LIVE_REFRESH_STORAGE_KEY,
        JSON.stringify({ enabled, intervalMs })
      )
    } catch {
      // Non-fatal: the preference just won't survive a reload.
    }
  }, [enabled, intervalMs])

  const refreshNow = React.useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  // Stamp the time when a refresh *finishes*, so "updated 8s ago" describes
  // the data on screen rather than the moment we asked for it. React gives no
  // "transition settled" callback, so the falling edge of `isRefreshing` is
  // the signal — this is synchronising with the router, not derived state.
  const wasRefreshing = React.useRef(false)
  React.useEffect(() => {
    const finished = wasRefreshing.current && !isRefreshing
    wasRefreshing.current = isRefreshing
    if (finished) setLastRefreshedAt(Date.now())
  }, [isRefreshing])

  // The interval closes over `isRefreshing`; a ref keeps the check current
  // without re-arming the timer on every transition. Written in an effect
  // because refs must not be mutated during render.
  const isRefreshingRef = React.useRef(isRefreshing)
  React.useEffect(() => {
    isRefreshingRef.current = isRefreshing
  }, [isRefreshing])

  const active = enabled && intervalMs > 0

  React.useEffect(() => {
    if (!active) return

    const id = window.setInterval(() => {
      // Background tabs cost requests and show nobody anything.
      if (document.hidden) return
      // A slow upstream must not stack requests — drop the tick, don't queue.
      if (isRefreshingRef.current) return
      // Don't yank data out from under someone mid-keystroke.
      const el = document.activeElement
      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el instanceof HTMLElement && el.isContentEditable)
      ) {
        return
      }
      refreshNow()
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [active, intervalMs, refreshNow])

  // Coming back to a tab should show current data immediately, not after one
  // more full interval.
  React.useEffect(() => {
    if (!active) return

    const onVisible = () => {
      if (!document.hidden && !isRefreshingRef.current) refreshNow()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [active, refreshNow])

  const value = React.useMemo(
    () => ({
      enabled,
      intervalMs,
      lastRefreshedAt,
      isRefreshing,
      refreshNow,
      setEnabled,
      setIntervalMs,
    }),
    [enabled, intervalMs, lastRefreshedAt, isRefreshing, refreshNow]
  )

  return (
    <LiveRefreshContext.Provider value={value}>
      {children}
    </LiveRefreshContext.Provider>
  )
}
