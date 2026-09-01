// API contract for the mechanics module.
import { z } from 'zod';
import type { Prisma } from '../../generated/prisma/client';
import { BookingStatus, MechanicStatus } from '../../generated/prisma/enums';
import { paginationQuery } from '../../lib/pagination';
import { csvArray, idParams } from '../../lib/params';
import { ACTIVE_STATUSES } from '../bookings/booking.state';

// ---------- input ----------

export const mechanicIdParams = idParams;

export const listMechanicsQuery = z.object({
  status: csvArray(z.enum(MechanicStatus)).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  sortBy: z.enum(['name', 'hiredAt', 'completedJobs']).default('name'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
  ...paginationQuery,
});
export type ListMechanicsQuery = z.infer<typeof listMechanicsQuery>;

export const updateMechanicStatusBody = z.object({
  status: z.enum(MechanicStatus),
});
export type UpdateMechanicStatusBody = z.infer<typeof updateMechanicStatusBody>;

// ---------- output ----------

// `as const` below freezes every literal it contains, and Prisma's `in` filter
// rejects a readonly array. Referencing a pre-typed variable sidesteps that —
// `as const` only rewrites literal expressions, not identifiers.
const activeStatusFilter: BookingStatus[] = [...ACTIVE_STATUSES];

export const mechanicListSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  hiredAt: true,
  _count: { select: { bookings: { where: { status: BookingStatus.COMPLETED } } } },
  // The job they are on right now, if any — drives the "current job" column.
  bookings: {
    where: { status: { in: activeStatusFilter } },
    take: 1,
    orderBy: { scheduledAt: 'asc' },
    select: {
      id: true,
      reference: true,
      status: true,
      scheduledAt: true,
      customer: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
    },
  },
} as const;

export type MechanicListRow = Prisma.MechanicGetPayload<{ select: typeof mechanicListSelect }>;

export function toMechanicListItem(row: MechanicListRow) {
  const current = row.bookings[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    hiredAt: row.hiredAt.toISOString(),
    completedJobs: row._count.bookings,
    currentBooking: current
      ? {
          id: current.id,
          reference: current.reference,
          status: current.status,
          scheduledAt: current.scheduledAt.toISOString(),
          customer: current.customer.name,
          service: current.service.name,
        }
      : null,
  };
}
