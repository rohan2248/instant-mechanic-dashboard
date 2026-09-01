/**
 * Hand-written mirror of the `apps/api` response shapes.
 *
 * There is no shared package in this workspace, so these types are the only
 * contract between the two apps — keep them field-for-field with the Prisma
 * models and the module mappers in `apps/api/src/modules/**`.
 *
 * Money is ALWAYS integer paise. Divide by 100 only inside `formatPaise`.
 */

export type BookingStatus =
  | "PENDING"
  | "ASSIGNED"
  | "ON_THE_WAY"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"

export type MechanicStatus = "AVAILABLE" | "ON_JOB" | "OFF_DUTY"

export type FuelType = "PETROL" | "DIESEL" | "CNG" | "ELECTRIC" | "HYBRID"

/** Envelope used by bookings, mechanics, customers and vehicles. */
export type Paginated<T> = {
  data: T[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/** Error envelope from `apps/api/src/middleware/error-handler.ts`. */
export type ApiErrorBody = {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

/* -------------------------------------------------------------------------- */
/*  Dashboard                                                                 */
/* -------------------------------------------------------------------------- */

export type DashboardOverview = {
  totalBookings: number
  todayBookings: number
  /** PENDING + ASSIGNED + ON_THE_WAY + IN_PROGRESS. Not just PENDING. */
  openBookings: number
  completedBookings: number
  cancelledBookings: number
  /** COMPLETED bookings only. */
  revenuePaise: number
  activeMechanics: number
  totalMechanics: number
  newCustomersThisMonth: number
  newCustomersRolling30d: number
  /** Percentage to one decimal, e.g. 87.4 */
  completionRate: number
  asOf: string
}

export type StatusBreakdownRow = {
  status: BookingStatus
  count: number
  amountPaise: number
  /** Percentage of all bookings, one decimal. */
  share: number
}

export type TimeseriesPoint = {
  /** YYYY-MM-DD */
  date: string
  bookings: number
  /**
   * Sums EVERY status, unlike overview/category revenue which are
   * COMPLETED-only. Surfaced in the UI as "booked value".
   */
  revenuePaise: number
}

export type Timeseries = {
  from: string
  to: string
  points: TimeseriesPoint[]
}

export type TopServiceRow = {
  id: number
  name: string
  category: string
  categorySlug: string
  basePricePaise: number
  bookings: number
}

export type CategoryRevenueRow = {
  id: number
  name: string
  slug: string
  bookings: number
  revenuePaise: number
}

export type ActivityItem = {
  id: number
  fromStatus: BookingStatus | null
  toStatus: BookingStatus
  note: string | null
  createdAt: string
  bookingId: number
  reference: string
  /** Flat strings, not nested objects. */
  customer: string
  service: string
  mechanic: string | null
}

/* -------------------------------------------------------------------------- */
/*  Bookings                                                                  */
/* -------------------------------------------------------------------------- */

export type BookingListItem = {
  id: number
  /** e.g. "IM-2026-000123" */
  reference: string
  status: BookingStatus
  amountPaise: number
  scheduledAt: string
  /** YYYY-MM-DD — the field date filters apply to. */
  scheduledOn: string
  completedAt: string | null
  createdAt: string
  customer: { id: number; name: string; phone: string; city: string }
  /** `label` is `${make} ${model}` — list endpoint only. */
  vehicle: { id: number; registration: string; label: string }
  service: {
    id: number
    name: string
    durationMins: number
    category: string
    categorySlug: string
  }
  mechanic: {
    id: number
    name: string
    phone: string
    status: MechanicStatus
  } | null
}

export type BookingEvent = {
  id: number
  fromStatus: BookingStatus | null
  toStatus: BookingStatus
  note: string | null
  createdAt: string
}

/** Detail expands customer + vehicle; the vehicle here has NO `label`. */
export type BookingDetail = Omit<BookingListItem, "customer" | "vehicle"> & {
  updatedAt: string
  customer: {
    id: number
    name: string
    email: string
    phone: string
    city: string
  }
  vehicle: {
    id: number
    make: string
    model: string
    year: number
    registration: string
    fuelType: FuelType
  }
  /** Oldest first. */
  events: BookingEvent[]
}

/* -------------------------------------------------------------------------- */
/*  Mechanics                                                                 */
/* -------------------------------------------------------------------------- */

export type MechanicListItem = {
  id: number
  name: string
  email: string
  phone: string
  status: MechanicStatus
  hiredAt: string
  completedJobs: number
  /**
   * Populated ONLY for ON_THE_WAY / IN_PROGRESS bookings — an ASSIGNED
   * booking leaves this null. "Last booking" comes from the detail endpoint.
   */
  currentBooking: {
    id: number
    reference: string
    status: BookingStatus
    scheduledAt: string
    customer: string
    service: string
  } | null
}

/** Flattened mechanic, for filter dropdowns and the assign menu. */
export type MechanicOption = {
  id: number
  name: string
  status: MechanicStatus
}

export type MechanicDetail = MechanicListItem & {
  /** All six keys always present. */
  bookingsByStatus: Record<BookingStatus, number>
  revenuePaise: number
  /** Max 10, scheduledAt desc. */
  recentBookings: Array<{
    id: number
    reference: string
    status: BookingStatus
    scheduledAt: string
    amountPaise: number
    customer: string
    service: string
  }>
}

/* -------------------------------------------------------------------------- */
/*  Catalogue / meta                                                          */
/* -------------------------------------------------------------------------- */

export type ServiceCategoryRow = {
  id: number
  name: string
  slug: string
  serviceCount: number
}

export type MetaEnums = {
  bookingStatus: BookingStatus[]
  mechanicStatus: MechanicStatus[]
  fuelType: FuelType[]
}
