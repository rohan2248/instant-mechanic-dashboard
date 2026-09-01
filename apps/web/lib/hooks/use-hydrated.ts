"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}

/**
 * `false` during SSR and the hydration pass, `true` afterwards.
 *
 * Used by anything whose output the server cannot know — a resolved theme, a
 * relative timestamp. `useSyncExternalStore` gives this directly from its
 * server/client snapshot pair, without the extra render and setState-in-effect
 * that a `useState` + `useEffect` mount flag costs.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
