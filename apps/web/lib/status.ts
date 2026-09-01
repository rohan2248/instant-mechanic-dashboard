import type { BookingStatus, MechanicStatus } from "@/types/api"

/**
 * The single source of status vocabulary for the dashboard: labels, badge
 * treatment and chart ordering.
 *
 * The theme is monochrome, so status is never carried by hue. It is carried by
 * badge weight (solid > tinted > outlined) and by dot fill (solid / hollow /
 * pulsing), which survives greyscale, dark mode and colour-blind viewers.
 */

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost"

type StatusPresentation = {
  label: string
  variant: BadgeVariant
  /** Hollow dots read as "not started"; pulsing reads as "happening now". */
  dot: "solid" | "hollow" | "pulse"
}

/** Enum order — matches what /dashboard/bookings-by-status always returns. */
export const BOOKING_STATUSES: BookingStatus[] = [
  "PENDING",
  "ASSIGNED",
  "ON_THE_WAY",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]

export const MECHANIC_STATUSES: MechanicStatus[] = [
  "AVAILABLE",
  "ON_JOB",
  "OFF_DUTY",
]

export const BOOKING_STATUS_PRESENTATION: Record<
  BookingStatus,
  StatusPresentation
> = {
  PENDING: { label: "Pending", variant: "outline", dot: "hollow" },
  ASSIGNED: { label: "Assigned", variant: "secondary", dot: "solid" },
  ON_THE_WAY: { label: "On the way", variant: "secondary", dot: "pulse" },
  IN_PROGRESS: { label: "In progress", variant: "default", dot: "pulse" },
  COMPLETED: { label: "Completed", variant: "outline", dot: "solid" },
  CANCELLED: { label: "Cancelled", variant: "destructive", dot: "solid" },
}

export const MECHANIC_STATUS_PRESENTATION: Record<
  MechanicStatus,
  StatusPresentation
> = {
  AVAILABLE: { label: "Available", variant: "secondary", dot: "solid" },
  ON_JOB: { label: "On job", variant: "default", dot: "pulse" },
  OFF_DUTY: { label: "Off duty", variant: "outline", dot: "hollow" },
}

export function bookingStatusLabel(status: BookingStatus) {
  return BOOKING_STATUS_PRESENTATION[status].label
}

export function mechanicStatusLabel(status: MechanicStatus) {
  return MECHANIC_STATUS_PRESENTATION[status].label
}

/**
 * Mirrors LEGAL_TRANSITIONS in
 * `apps/api/src/modules/bookings/booking.state.ts`.
 *
 * Row actions offer only these, so the UI never asks the API for a move it is
 * going to reject with a 409. The API remains the authority — a stale tab can
 * still lose the race, which is why actions surface the 409's `allowed[]`.
 */
export const LEGAL_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["ON_THE_WAY", "PENDING", "CANCELLED"],
  ON_THE_WAY: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
}

export function isTerminal(status: BookingStatus) {
  return LEGAL_TRANSITIONS[status].length === 0
}

/** Statuses the API counts as an active job for a mechanic. */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  "ON_THE_WAY",
  "IN_PROGRESS",
]

/**
 * Chart step per status. Index into the six-step lightness ramp defined in
 * globals.css, ordered along the booking lifecycle so the gradient itself
 * reads as pipeline progress.
 */
export const BOOKING_STATUS_CHART_COLOR: Record<BookingStatus, string> = {
  PENDING: "var(--chart-6)",
  ASSIGNED: "var(--chart-5)",
  ON_THE_WAY: "var(--chart-4)",
  IN_PROGRESS: "var(--chart-3)",
  COMPLETED: "var(--chart-1)",
  CANCELLED: "var(--chart-2)",
}

/** Cycles the ramp for lists of unknown length (categories, services). */
export function rampColor(index: number) {
  return `var(--chart-${(index % 6) + 1})`
}
