import type { BookingQuery, MechanicQuery } from "@/lib/api/queries"
import { BOOKING_STATUSES, MECHANIC_STATUSES } from "@/lib/status"
import type { BookingStatus, MechanicStatus } from "@/types/api"

/**
 * URL state <-> API query params.
 *
 * The table controls write straight into the URL using the API's own
 * vocabulary (`q`, `status`, `sortBy`, `page`…), so there is no translation
 * layer and every view is shareable and back-button-correct.
 *
 * Everything here is defensive: search params are user input, and an
 * out-of-range `page` or a bogus `sortBy` must degrade to the default rather
 * than 400 the API.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>

export const DEFAULT_PAGE_SIZE = 25
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

/** Accepts both `?status=A,B` and `?status=A&status=B`. */
function list(value: string | string[] | undefined): string[] {
  if (value === undefined) return []
  const parts = Array.isArray(value) ? value : [value]
  return parts.flatMap((part) => part.split(",")).filter(Boolean)
}

function int(value: string | string[] | undefined, fallback: number, min = 1, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(first(value))
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) return fallback
  return parsed
}

function oneOf<T extends string>(
  value: string | string[] | undefined,
  allowed: readonly T[],
  fallback: T
): T {
  const candidate = first(value) as T | undefined
  return candidate && allowed.includes(candidate) ? candidate : fallback
}

/** YYYY-MM-DD only — anything else is dropped rather than passed through. */
function isoDate(value: string | string[] | undefined) {
  const candidate = first(value)
  return candidate && /^\d{4}-\d{2}-\d{2}$/.test(candidate)
    ? candidate
    : undefined
}

/* -------------------------------- bookings -------------------------------- */

const BOOKING_SORT_KEYS = [
  "scheduledAt",
  "createdAt",
  "amountPaise",
  "status",
] as const

export function parseBookingParams(params: RawSearchParams): BookingQuery {
  const q = first(params.q)?.trim()

  return {
    q: q || undefined,
    status: list(params.status).filter((s): s is BookingStatus =>
      (BOOKING_STATUSES as string[]).includes(s)
    ),
    mechanicId: params.mechanicId ? int(params.mechanicId, 0) || undefined : undefined,
    from: isoDate(params.from),
    to: isoDate(params.to),
    sortBy: oneOf(params.sortBy, BOOKING_SORT_KEYS, "scheduledAt"),
    sortDir: oneOf(params.sortDir, ["asc", "desc"] as const, "desc"),
    page: int(params.page, 1),
    // The API rejects anything over 100, so clamp before it can 400.
    pageSize: int(params.pageSize, DEFAULT_PAGE_SIZE, 1, 100),
  }
}

/* -------------------------------- mechanics ------------------------------- */

const MECHANIC_SORT_KEYS = ["name", "hiredAt", "completedJobs"] as const

export function parseMechanicParams(params: RawSearchParams): MechanicQuery {
  const q = first(params.q)?.trim()

  return {
    q: q || undefined,
    status: list(params.status).filter((s): s is MechanicStatus =>
      (MECHANIC_STATUSES as string[]).includes(s)
    ),
    sortBy: oneOf(params.sortBy, MECHANIC_SORT_KEYS, "name"),
    sortDir: oneOf(params.sortDir, ["asc", "desc"] as const, "asc"),
    page: int(params.page, 1),
    pageSize: int(params.pageSize, DEFAULT_PAGE_SIZE, 1, 100),
  }
}

/* -------------------------------- analytics ------------------------------- */

export const RANGE_OPTIONS = [7, 30, 90] as const

export function parseDays(params: RawSearchParams) {
  const parsed = Number(first(params.days))
  return (RANGE_OPTIONS as readonly number[]).includes(parsed) ? parsed : 30
}

/* --------------------------- client-side writing -------------------------- */

/**
 * Applies a patch to the current query string. Used by every table control.
 *
 * Two behaviours worth keeping: a `null` value removes the key entirely (so a
 * cleared filter leaves a clean URL), and any change other than `page` itself
 * resets to page 1 — otherwise narrowing a filter while on page 7 lands the
 * user on an empty result.
 */
export function withParams(
  current: URLSearchParams,
  patch: Record<string, string | string[] | number | null | undefined>
) {
  const next = new URLSearchParams(current.toString())

  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === "") {
      next.delete(key)
    } else if (Array.isArray(value)) {
      if (value.length === 0) next.delete(key)
      else next.set(key, value.join(","))
    } else {
      next.set(key, String(value))
    }
  }

  if (!("page" in patch)) next.delete("page")

  return next
}
