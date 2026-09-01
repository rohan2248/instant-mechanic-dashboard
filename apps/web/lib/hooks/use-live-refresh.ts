"use client"

import { createContext, useContext } from "react"

/**
 * The dashboard's liveness contract.
 *
 * Widgets read this hook and never touch the provider's internals, so when the
 * API grows a socket.io gateway the interval below can be swapped for a
 * subscription without changing a single page, table or chart.
 */

export type LiveRefreshState = {
  enabled: boolean
  intervalMs: number
  /** Epoch ms of the last *completed* refresh. */
  lastRefreshedAt: number
  isRefreshing: boolean
  refreshNow: () => void
  setEnabled: (enabled: boolean) => void
  setIntervalMs: (ms: number) => void
}

export const LiveRefreshContext = createContext<LiveRefreshState | null>(null)

export function useLiveRefresh() {
  const context = useContext(LiveRefreshContext)
  if (!context) {
    throw new Error("useLiveRefresh must be used within <LiveRefreshProvider>")
  }
  return context
}

export const DEFAULT_INTERVAL_MS = 30_000

/** "Off" is `0` — the same state as paused, so there is only one concept. */
export const INTERVAL_OPTIONS = [
  { label: "Off", value: "0" },
  { label: "10s", value: "10000" },
  { label: "30s", value: "30000" },
  { label: "60s", value: "60000" },
] as const

export const LIVE_REFRESH_STORAGE_KEY = "im-dashboard:live-refresh"
