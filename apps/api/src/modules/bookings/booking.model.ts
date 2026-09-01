// API contract for the bookings module — the shapes this module accepts and
// returns. Not to be confused with the Prisma models in prisma/schema.prisma.
import { z } from 'zod';
import type { Prisma } from '../../generated/prisma/client';
import { BookingStatus } from '../../generated/prisma/enums';
import { paginationQuery } from '../../lib/pagination';
import { csvArray, idParams } from '../../lib/params';

// ---------- input ----------

const bookingStatus = z.enum(BookingStatus);

export const bookingIdParams = idParams;

export const listBookingsQuery = z.object({
  status: csvArray(bookingStatus).optional(),
  mechanicId: z.coerce.number().int().positive().optional(),
  customerId: z.coerce.number().int().positive().optional(),
  serviceId: z.coerce.number().int().positive().optional(),
  // Inclusive calendar-date window over `scheduledOn`.
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  // Free text over booking reference, customer name, and vehicle registration.
  q: z.string().trim().min(1).max(120).optional(),
  sortBy: z.enum(['scheduledAt', 'createdAt', 'amountPaise', 'status']).default('scheduledAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  ...paginationQuery,
});
export type ListBookingsQuery = z.infer<typeof listBookingsQuery>;

export const createBookingBody = z.object({
  customerId: z.number().int().positive(),
  vehicleId: z.number().int().positive(),
  serviceId: z.number().int().positive(),
  // Optional at creation: a booking may be taken before anyone is free.
  mechanicId: z.number().int().positive().nullish(),
  scheduledAt: z.coerce.date(),
  // Defaults to the service's list price when omitted. Integer paise — a rupee
  // amount as a float would round wrong the moment it is summed for revenue.
  amountPaise: z.number().int().positive().max(100_000_000).optional(),
  note: z.string().trim().max(280).optional(),
});
export type CreateBookingBody = z.infer<typeof createBookingBody>;

export const updateStatusBody = z.object({
  status: bookingStatus,
  note: z.string().trim().max(280).optional(),
});
export type UpdateStatusBody = z.infer<typeof updateStatusBody>;

export const assignBookingBody = z.object({
  // null unassigns, returning the booking to the pending queue.
  mechanicId: z.number().int().positive().nullable(),
  note: z.string().trim().max(280).optional(),
});
export type AssignBookingBody = z.infer<typeof assignBookingBody>;

export const cancelBookingBody = z.object({
  reason: z.string().trim().min(1).max(280).optional(),
});
export type CancelBookingBody = z.infer<typeof cancelBookingBody>;

// ---------- output ----------
// `select` shapes are declared here so the query and the response shape cannot
// drift apart, and are asserted against Prisma's input types in the service.

export const bookingListSelect = {
  id: true,
  reference: true,
  status: true,
  amountPaise: true,
  scheduledAt: true,
  scheduledOn: true,
  completedAt: true,
  createdAt: true,
  customer: { select: { id: true, name: true, phone: true, city: true } },
  vehicle: { select: { id: true, make: true, model: true, registration: true } },
  service: {
    select: {
      id: true,
      name: true,
      durationMins: true,
      category: { select: { id: true, name: true, slug: true } },
    },
  },
  mechanic: { select: { id: true, name: true, phone: true, status: true } },
} as const;

export const bookingDetailSelect = {
  ...bookingListSelect,
  updatedAt: true,
  customer: { select: { id: true, name: true, email: true, phone: true, city: true } },
  vehicle: {
    select: { id: true, make: true, model: true, year: true, registration: true, fuelType: true },
  },
  events: {
    orderBy: { createdAt: 'asc' },
    select: { id: true, fromStatus: true, toStatus: true, note: true, createdAt: true },
  },
} as const;

// Derived from the `select` above rather than restated, so changing a select
// immediately fails the mapper that no longer matches it.
export type BookingListRow = Prisma.BookingGetPayload<{ select: typeof bookingListSelect }>;

export function toBookingListItem(row: BookingListRow) {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    amountPaise: row.amountPaise,
    scheduledAt: row.scheduledAt.toISOString(),
    scheduledOn: row.scheduledOn.toISOString().slice(0, 10),
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    customer: row.customer,
    vehicle: {
      id: row.vehicle.id,
      registration: row.vehicle.registration,
      label: `${row.vehicle.make} ${row.vehicle.model}`,
    },
    service: {
      id: row.service.id,
      name: row.service.name,
      durationMins: row.service.durationMins,
      category: row.service.category.name,
      categorySlug: row.service.category.slug,
    },
    mechanic: row.mechanic,
  };
}

export type BookingDetailRow = Prisma.BookingGetPayload<{ select: typeof bookingDetailSelect }>;

export function toBookingDetail(row: BookingDetailRow) {
  return {
    ...toBookingListItem(row),
    updatedAt: row.updatedAt.toISOString(),
    customer: row.customer,
    vehicle: {
      id: row.vehicle.id,
      make: row.vehicle.make,
      model: row.vehicle.model,
      year: row.vehicle.year,
      registration: row.vehicle.registration,
      fuelType: row.vehicle.fuelType,
    },
    events: row.events.map((event) => ({
      id: event.id,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      note: event.note,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}
