"use server"

import { revalidatePath } from "next/cache"

import { ApiError, apiFetch } from "@/lib/api/client"
import { getBooking, getMechanic } from "@/lib/api/queries"
import type { BookingDetail, BookingStatus, MechanicDetail, MechanicStatus } from "@/types/api"

/**
 * Mutations. Each one calls the API, then revalidates every route whose
 * numbers the change could move — a status transition shifts the Overview
 * tiles and the mechanic's current job, not just the row that was clicked.
 */

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string; details?: unknown }

/**
 * The API is the authority on what is legal. The UI only offers transitions
 * from LEGAL_TRANSITIONS, but a stale tab can still lose a race, so a 409's
 * `details` is passed through verbatim for the caller to render — a generic
 * "something went wrong" would hide `allowed[]` and `activeJobs`, which are
 * the only actionable part of those errors.
 */
async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        ok: false,
        code: error.code,
        message: error.message,
        details: error.details,
      }
    }
    return {
      ok: false,
      code: "UNKNOWN",
      message: error instanceof Error ? error.message : "Unexpected error.",
    }
  }
}

function revalidateDashboard() {
  revalidatePath("/", "layout")
}

/**
 * Detail reads for the slide-over sheets.
 *
 * Client components cannot import `lib/api/*` (it is `server-only`, which is
 * what keeps the API origin out of the bundle), so the sheets reach detail
 * data through an action rather than a fetch of their own. Loading it on open
 * also keeps the list payload small — 25 rows don't ship 25 event timelines.
 */
export async function fetchBookingDetail(
  id: number
): Promise<ActionResult<BookingDetail>> {
  return run(() => getBooking(id))
}

export async function fetchMechanicDetail(
  id: number
): Promise<ActionResult<MechanicDetail>> {
  return run(() => getMechanic(id))
}

export async function updateBookingStatus(
  id: number,
  status: BookingStatus,
  note?: string
): Promise<ActionResult<BookingDetail>> {
  const result = await run(() =>
    apiFetch<BookingDetail>(`/bookings/${id}/status`, {
      method: "PATCH",
      body: { status, ...(note ? { note } : {}) },
    })
  )
  if (result.ok) revalidateDashboard()
  return result
}

export async function assignMechanic(
  id: number,
  mechanicId: number | null,
  note?: string
): Promise<ActionResult<BookingDetail>> {
  const result = await run(() =>
    apiFetch<BookingDetail>(`/bookings/${id}/assign`, {
      method: "PATCH",
      body: { mechanicId, ...(note ? { note } : {}) },
    })
  )
  if (result.ok) revalidateDashboard()
  return result
}

export async function cancelBooking(
  id: number,
  reason?: string
): Promise<ActionResult<BookingDetail>> {
  const result = await run(() =>
    apiFetch<BookingDetail>(`/bookings/${id}/cancel`, {
      method: "POST",
      body: reason ? { reason } : {},
    })
  )
  if (result.ok) revalidateDashboard()
  return result
}

export async function setMechanicStatus(
  id: number,
  status: MechanicStatus
): Promise<ActionResult<MechanicDetail>> {
  const result = await run(() =>
    apiFetch<MechanicDetail>(`/mechanics/${id}/status`, {
      method: "PATCH",
      body: { status },
    })
  )
  if (result.ok) revalidateDashboard()
  return result
}
