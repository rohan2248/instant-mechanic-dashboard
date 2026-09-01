import { prisma } from '../../db';
import { BookingStatus, MechanicStatus } from '../../generated/prisma/enums';
import { addDays, eachDay, istTodayDate, lastNDays, startOfMonth, toDateKey } from '../../lib/time';
import { OPEN_STATUSES } from '../bookings/booking.state';
import type { ActivityQuery, LimitQuery, TimeseriesQuery } from './dashboard.model';

/** The headline tiles. One round trip for everything that fits in a Promise.all. */
export async function getOverview() {
  const today = istTodayDate();
  const monthStart = startOfMonth(today);
  const thirtyDaysAgo = addDays(today, -30);

  const [
    totalBookings,
    todayBookings,
    revenue,
    activeMechanics,
    totalMechanics,
    newCustomersThisMonth,
    newCustomersRolling30d,
    openBookings,
    completedBookings,
    cancelledBookings,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { scheduledOn: today } }),
    prisma.booking.aggregate({
      where: { status: BookingStatus.COMPLETED },
      _sum: { amountPaise: true },
    }),
    prisma.mechanic.count({
      where: { status: { in: [MechanicStatus.AVAILABLE, MechanicStatus.ON_JOB] } },
    }),
    prisma.mechanic.count(),
    prisma.customer.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.customer.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.booking.count({ where: { status: { in: [...OPEN_STATUSES] } } }),
    prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
    prisma.booking.count({ where: { status: BookingStatus.CANCELLED } }),
  ]);

  // Cancellations are excluded from the denominator: a job nobody ever asked us
  // to finish is not a job we failed to complete.
  const resolved = completedBookings + cancelledBookings;

  return {
    totalBookings,
    todayBookings,
    openBookings,
    completedBookings,
    cancelledBookings,
    revenuePaise: revenue._sum.amountPaise ?? 0,
    activeMechanics,
    totalMechanics,
    newCustomersThisMonth,
    newCustomersRolling30d,
    completionRate: resolved === 0 ? 0 : Math.round((completedBookings / resolved) * 1000) / 10,
    asOf: new Date().toISOString(),
  };
}

/** Donut source. Every status appears, so the legend does not reshuffle. */
export async function getBookingsByStatus() {
  const rows = await prisma.booking.groupBy({
    by: ['status'],
    _count: { _all: true },
    _sum: { amountPaise: true },
  });

  const total = rows.reduce((sum, row) => sum + row._count._all, 0);

  return Object.values(BookingStatus).map((status) => {
    const row = rows.find((candidate) => candidate.status === status);
    const count = row?._count._all ?? 0;
    return {
      status,
      count,
      amountPaise: row?._sum.amountPaise ?? 0,
      share: total === 0 ? 0 : Math.round((count / total) * 1000) / 10,
    };
  });
}

/**
 * Daily bookings and revenue. `groupBy` returns no row for a day with no
 * bookings, so the axis is enumerated from the requested window and the gaps are
 * zero-filled — otherwise the chart silently closes up quiet days.
 */
export async function getTimeseries(query: TimeseriesQuery) {
  const { from, to } = lastNDays(query.days);

  const rows = await prisma.booking.groupBy({
    by: ['scheduledOn'],
    where: { scheduledOn: { gte: from, lte: to } },
    _count: { _all: true },
    _sum: { amountPaise: true },
  });

  const byDate = new Map(rows.map((row) => [toDateKey(row.scheduledOn), row]));

  return {
    from: toDateKey(from),
    to: toDateKey(to),
    points: eachDay(from, to).map((day) => {
      const key = toDateKey(day);
      const row = byDate.get(key);
      return {
        date: key,
        bookings: row?._count._all ?? 0,
        revenuePaise: row?._sum.amountPaise ?? 0,
      };
    }),
  };
}

export async function getTopServices(query: LimitQuery) {
  const rows = await prisma.service.findMany({
    select: {
      id: true,
      name: true,
      basePricePaise: true,
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { bookings: { _count: 'desc' } },
    take: query.limit,
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category.name,
    categorySlug: row.category.slug,
    basePricePaise: row.basePricePaise,
    bookings: row._count.bookings,
  }));
}

/**
 * Revenue per service category. Prisma cannot group by a column on a related
 * table, so this groups by service and folds the result up into categories.
 */
export async function getRevenueByCategory() {
  const [byService, services] = await Promise.all([
    prisma.booking.groupBy({
      by: ['serviceId'],
      where: { status: BookingStatus.COMPLETED },
      _count: { _all: true },
      _sum: { amountPaise: true },
    }),
    prisma.service.findMany({
      select: { id: true, category: { select: { id: true, name: true, slug: true } } },
    }),
  ]);

  const categoryByServiceId = new Map(services.map((service) => [service.id, service.category]));
  const totals = new Map<number, { name: string; slug: string; bookings: number; revenuePaise: number }>();

  for (const row of byService) {
    const category = categoryByServiceId.get(row.serviceId);
    if (!category) continue;
    const entry = totals.get(category.id) ?? {
      name: category.name,
      slug: category.slug,
      bookings: 0,
      revenuePaise: 0,
    };
    entry.bookings += row._count._all;
    entry.revenuePaise += row._sum.amountPaise ?? 0;
    totals.set(category.id, entry);
  }

  return [...totals.entries()]
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => b.revenuePaise - a.revenuePaise);
}

/** The live feed: the most recent status transitions across the whole board. */
export async function getActivity(query: ActivityQuery) {
  const events = await prisma.bookingEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: query.limit,
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      note: true,
      createdAt: true,
      booking: {
        select: {
          id: true,
          reference: true,
          customer: { select: { id: true, name: true } },
          service: { select: { id: true, name: true } },
          mechanic: { select: { id: true, name: true } },
        },
      },
    },
  });

  return events.map((event) => ({
    id: event.id,
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    note: event.note,
    createdAt: event.createdAt.toISOString(),
    bookingId: event.booking.id,
    reference: event.booking.reference,
    customer: event.booking.customer.name,
    service: event.booking.service.name,
    mechanic: event.booking.mechanic?.name ?? null,
  }));
}
