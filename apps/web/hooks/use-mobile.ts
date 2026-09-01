import * as React from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

/**
 * Deviates from the shadcn CLI's version, which seeds state in an effect and
 * so renders once with the wrong value before correcting itself.
 * `useSyncExternalStore` is the right primitive for an external source like a
 * media query: correct on the first client render, and no cascading update.
 *
 * The server snapshot is `false` — there is no viewport to measure, and the
 * sidebar's desktop layout is the safer default to hydrate from.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}
