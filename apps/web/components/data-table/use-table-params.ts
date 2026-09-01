"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"

import { withParams } from "@/lib/api/search-params"

/**
 * Shared plumbing for every table control.
 *
 * All table state — search, filters, sort, page — lives in the URL, so a
 * control's job is just to patch the query string and let the server refetch.
 * That keeps views shareable, back/forward correct, and means the automatic
 * polling refresh naturally re-requests the same filtered slice.
 *
 * `isPending` comes from the transition so the table body can dim instead of
 * being replaced by a skeleton mid-interaction.
 */
export function useTableParams() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const setParams = useCallback(
    (patch: Record<string, string | string[] | number | null | undefined>) => {
      const next = withParams(searchParams, patch)
      startTransition(() => {
        // scroll: false — a filter change shouldn't throw the user back to
        // the top of a long table.
        router.push(next.size ? `?${next}` : "?", { scroll: false })
      })
    },
    [router, searchParams]
  )

  return { searchParams, setParams, isPending }
}
