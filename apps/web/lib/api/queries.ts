import "server-only"

import { apiFetch } from "@/lib/api/client"
import type {
  ActivityItem,
  BookingDetail,
  BookingListItem,
  BookingStatus,
  CategoryRevenueRow,
  DashboardOverview,
  MechanicDetail,
  MechanicListItem,
  MechanicStatus,
  Paginated,
  ServiceCategoryRow,
  StatusBreakdownRow,
  Timeseries,
  TopServiceRow,
} from "@/types/api"

/**
 * One function per endpoint. Nothing outside this file knows a URL string, so
 * an API change is a single-file edit.
 */

/* ------------------------------- dashboard ------------------------------- */

export function getOverview() {
  return apiFetch<DashboardOverview>("/dashboard/overview")
}

export function getStatusBreakdown() {
  return apiFetch<StatusBreakdownRow[]>("/dashboard/bookings-by-status")
}

export function getTimeseries(days = 30) {
  return apiFetch<Timeseries>("/dashboard/timeseries", {
    searchParams: { days },
  })
}

export function getTopServices(limit = 5) {
  return apiFetch<TopServiceRow[]>("/dashboard/top-services", {
    searchParams: { limit },
  })
}

export function getRevenueByCategory() {
  return apiFetch<CategoryRevenueRow[]>("/dashboard/revenue-by-category")
}

export function getActivity(limit = 20) {
  return apiFetch<ActivityItem[]>("/dashboard/activity", {
    searchParams: { limit },
  })
}

/* -------------------------------- bookings -------------------------------- */

export type BookingQuery = {
  status?: BookingStatus[]
  mechanicId?: number
  customerId?: number
  serviceId?: number
  from?: string
  to?: string
  q?: string
  sortBy?: "scheduledAt" | "createdAt" | "amountPaise" | "status"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export function getBookings(query: BookingQuery = {}) {
  return apiFetch<Paginated<BookingListItem>>("/bookings", {
    searchParams: { ...query },
  })
}

export function getBooking(id: number) {
  return apiFetch<BookingDetail>(`/bookings/${id}`)
}

/* -------------------------------- mechanics ------------------------------- */

export type MechanicQuery = {
  status?: MechanicStatus[]
  q?: string
  sortBy?: "name" | "hiredAt" | "completedJobs"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export function getMechanics(query: MechanicQuery = {}) {
  return apiFetch<Paginated<MechanicListItem>>("/mechanics", {
    searchParams: { ...query },
  })
}

export function getMechanic(id: number) {
  return apiFetch<MechanicDetail>(`/mechanics/${id}`)
}

/**
 * Every mechanic, flattened for the bookings filter dropdown and the assign
 * menu. The API caps pageSize at 100 and the seed has 24 mechanics, so a
 * single page covers it.
 */
export async function getMechanicOptions() {
  const { data } = await getMechanics({
    pageSize: 100,
    sortBy: "name",
    sortDir: "asc",
  })
  return data.map(({ id, name, status }) => ({ id, name, status }))
}

/**
 * Counts per mechanic status for the summary strip. The list endpoint has no
 * aggregate, but `meta.total` with pageSize=1 gives the count without
 * transferring rows.
 */
export async function getMechanicStatusCounts() {
  const statuses: MechanicStatus[] = ["AVAILABLE", "ON_JOB", "OFF_DUTY"]
  const results = await Promise.all(
    statuses.map((status) => getMechanics({ status: [status], pageSize: 1 }))
  )
  return Object.fromEntries(
    statuses.map((status, i) => [status, results[i].meta.total])
  ) as Record<MechanicStatus, number>
}

/* -------------------------------- catalogue ------------------------------- */

export function getServiceCategories() {
  return apiFetch<ServiceCategoryRow[]>("/service-categories")
}
