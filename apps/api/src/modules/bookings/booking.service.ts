import { prisma } from '../../db';
import type { Prisma } from '../../generated/prisma/client';
import { BookingStatus } from '../../generated/prisma/enums';
import { BadRequest, NotFound } from '../../lib/errors';
import { paginated, toSkipTake } from '../../lib/pagination';
import { formatBookingReference } from '../../lib/reference';
import { istCalendarDate } from '../../lib/time';
import { assertAssignable, syncMechanicStatus } from '../mechanics/mechanic.service';
import {
  type AssignBookingBody,
  bookingDetailSelect,
  bookingListSelect,
  type CreateBookingBody,
  type ListBookingsQuery,
  toBookingDetail,
  toBookingListItem,
  type UpdateStatusBody,
} from './booking.model';
import { assertTransition, requiresMechanic } from './booking.state';

/**
 * Shared by the list endpoint and its count. Every branch here is backed by an
 * index declared in schema.prisma — `[status, scheduledAt]`, `[scheduledOn]`,
 * `[mechanicId, status]`, `[customerId]`, `[serviceId]`.
 */
function buildBookingWhere(query: ListBookingsQuery): Prisma.BookingWhereInput {
  const scheduledOn: Prisma.DateTimeFilter = {};
  if (query.from) scheduledOn.gte = new Date(`${query.from}T00:00:00.000Z`);
  if (query.to) scheduledOn.lte = new Date(`${query.to}T00:00:00.000Z`);

  return {
    ...(query.status ? { status: { in: query.status } } : {}),
    ...(query.mechanicId !== undefined ? { mechanicId: query.mechanicId } : {}),
    ...(query.customerId !== undefined ? { customerId: query.customerId } : {}),
    ...(query.serviceId !== undefined ? { serviceId: query.serviceId } : {}),
    ...(query.from || query.to ? { scheduledOn } : {}),
    ...(query.q
      ? {
          OR: [
            { reference: { contains: query.q, mode: 'insensitive' } },
            { customer: { name: { contains: query.q, mode: 'insensitive' } } },
            { vehicle: { registration: { contains: query.q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
}

export async function listBookings(query: ListBookingsQuery) {
  const where = buildBookingWhere(query);

  const [rows, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      // `id` breaks ties so pagination is stable when many bookings share a slot.
      orderBy: [{ [query.sortBy]: query.sortDir }, { id: 'desc' }],
      select: bookingListSelect,
      ...toSkipTake(query),
    }),
    prisma.booking.count({ where }),
  ]);

  return paginated(rows.map(toBookingListItem), query, total);
}

export async function getBooking(id: number) {
  const booking = await prisma.booking.findUnique({ where: { id }, select: bookingDetailSelect });
  if (!booking) throw new NotFound(`Booking ${id} not found.`);
  return toBookingDetail(booking);
}

export async function createBooking(input: CreateBookingBody) {
  const id = await prisma.$transaction(async (tx) => {
    const [vehicle, service] = await Promise.all([
      tx.vehicle.findUnique({
        where: { id: input.vehicleId },
        select: { id: true, customerId: true },
      }),
      tx.service.findUnique({
        where: { id: input.serviceId },
        select: { id: true, name: true, basePricePaise: true, isActive: true },
      }),
    ]);

    if (!vehicle) throw new NotFound(`Vehicle ${input.vehicleId} not found.`);
    if (!service) throw new NotFound(`Service ${input.serviceId} not found.`);

    // Catch this explicitly rather than letting it through: booking a car that
    // belongs to someone else is a client mistake, not a foreign-key violation.
    if (vehicle.customerId !== input.customerId) {
      throw new BadRequest('That vehicle does not belong to the given customer.', {
        vehicleId: vehicle.id,
        vehicleOwnerId: vehicle.customerId,
        customerId: input.customerId,
      });
    }
    if (!service.isActive) {
      throw new BadRequest(`Service "${service.name}" is no longer offered.`);
    }
    if (input.mechanicId) await assertAssignable(tx, input.mechanicId);

    const status = input.mechanicId ? BookingStatus.ASSIGNED : BookingStatus.PENDING;

    // The reference embeds the row id, so it is written in a second step. Both
    // statements share this transaction — no row is ever visible without one.
    const created = await tx.booking.create({
      data: {
        reference: '',
        customerId: input.customerId,
        vehicleId: vehicle.id,
        serviceId: service.id,
        mechanicId: input.mechanicId ?? null,
        status,
        amountPaise: input.amountPaise ?? service.basePricePaise,
        scheduledAt: input.scheduledAt,
        scheduledOn: istCalendarDate(input.scheduledAt),
      },
      select: { id: true, createdAt: true },
    });

    await tx.booking.update({
      where: { id: created.id },
      data: { reference: formatBookingReference(created.id, input.scheduledAt) },
    });

    // Every booking opens with a PENDING event so the timeline always has a
    // origin, then an ASSIGNED event if it was created with a mechanic attached.
    await tx.bookingEvent.create({
      data: {
        bookingId: created.id,
        fromStatus: null,
        toStatus: BookingStatus.PENDING,
        note: input.note ?? 'Booking created',
        createdAt: created.createdAt,
      },
    });

    if (status === BookingStatus.ASSIGNED) {
      await tx.bookingEvent.create({
        data: {
          bookingId: created.id,
          fromStatus: BookingStatus.PENDING,
          toStatus: BookingStatus.ASSIGNED,
          note: 'Mechanic assigned',
        },
      });
      await syncMechanicStatus(tx, input.mechanicId ?? null);
    }

    return created.id;
  });

  return getBooking(id);
}

/**
 * The one path that changes a booking's status. Assignment and cancellation both
 * funnel through it, so the transition guard, the audit event and the mechanic
 * reconciliation cannot be skipped by using a different endpoint.
 */
export async function transitionStatus(id: number, input: UpdateStatusBody) {
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id },
      select: { id: true, status: true, mechanicId: true, scheduledAt: true, service: { select: { durationMins: true } } },
    });
    if (!booking) throw new NotFound(`Booking ${id} not found.`);

    assertTransition(booking.status, input.status);

    if (requiresMechanic(input.status) && booking.mechanicId === null) {
      throw new BadRequest(`Assign a mechanic before moving this booking to ${input.status}.`);
    }

    const completing = input.status === BookingStatus.COMPLETED;

    await tx.booking.update({
      where: { id },
      data: {
        status: input.status,
        // completedAt is the revenue timestamp, so it is set here and nowhere
        // else; reopening is impossible because COMPLETED is terminal.
        ...(completing ? { completedAt: new Date() } : {}),
      },
    });

    await tx.bookingEvent.create({
      data: {
        bookingId: id,
        fromStatus: booking.status,
        toStatus: input.status,
        note: input.note ?? defaultNoteFor(input.status),
      },
    });

    await syncMechanicStatus(tx, booking.mechanicId);
  });

  return getBooking(id);
}

/** Attach, change or clear the mechanic on a booking. */
export async function assignMechanic(id: number, input: AssignBookingBody) {
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id },
      select: { id: true, status: true, mechanicId: true },
    });
    if (!booking) throw new NotFound(`Booking ${id} not found.`);

    const previousMechanicId = booking.mechanicId;

    if (input.mechanicId === null) {
      // Unassigning returns the booking to the queue, which is only meaningful
      // while it is still waiting to start.
      assertTransition(booking.status, BookingStatus.PENDING);
      await tx.booking.update({
        where: { id },
        data: { mechanicId: null, status: BookingStatus.PENDING },
      });
      await tx.bookingEvent.create({
        data: {
          bookingId: id,
          fromStatus: booking.status,
          toStatus: BookingStatus.PENDING,
          note: input.note ?? 'Mechanic unassigned',
        },
      });
    } else {
      // Re-sending the mechanic who is already on the booking is a no-op, not a
      // handover — writing an event for it would put a transition that never
      // happened into the audit trail.
      if (booking.mechanicId === input.mechanicId) return;

      await assertAssignable(tx, input.mechanicId);

      // Reassigning an in-flight job keeps its status; only a pending booking
      // advances to ASSIGNED.
      const isReassignment = booking.status !== BookingStatus.PENDING;
      if (!isReassignment) assertTransition(booking.status, BookingStatus.ASSIGNED);

      await tx.booking.update({
        where: { id },
        data: {
          mechanicId: input.mechanicId,
          ...(isReassignment ? {} : { status: BookingStatus.ASSIGNED }),
        },
      });
      await tx.bookingEvent.create({
        data: {
          bookingId: id,
          fromStatus: booking.status,
          toStatus: isReassignment ? booking.status : BookingStatus.ASSIGNED,
          note: input.note ?? (isReassignment ? 'Mechanic reassigned' : 'Mechanic assigned'),
        },
      });
    }

    // Both mechanics need reconciling on a handover: the old one may now be free.
    await syncMechanicStatus(tx, previousMechanicId);
    await syncMechanicStatus(tx, input.mechanicId);
  });

  return getBooking(id);
}

export function cancelBooking(id: number, reason?: string) {
  return transitionStatus(id, { status: BookingStatus.CANCELLED, note: reason });
}

function defaultNoteFor(status: BookingStatus): string {
  switch (status) {
    case BookingStatus.ASSIGNED:
      return 'Mechanic assigned';
    case BookingStatus.ON_THE_WAY:
      return 'Mechanic en route';
    case BookingStatus.IN_PROGRESS:
      return 'Work started';
    case BookingStatus.COMPLETED:
      return 'Job completed';
    case BookingStatus.CANCELLED:
      return 'Booking cancelled';
    case BookingStatus.PENDING:
      return 'Returned to queue';
  }
}
