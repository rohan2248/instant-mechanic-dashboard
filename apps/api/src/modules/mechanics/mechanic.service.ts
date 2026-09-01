import { prisma } from '../../db';
import type { Prisma } from '../../generated/prisma/client';
import { BookingStatus, MechanicStatus } from '../../generated/prisma/enums';
import { Conflict, NotFound } from '../../lib/errors';
import { paginated, toSkipTake } from '../../lib/pagination';
import { ACTIVE_STATUSES } from '../bookings/booking.state';
import {
  type ListMechanicsQuery,
  mechanicListSelect,
  toMechanicListItem,
} from './mechanic.model';

/** Either the client or a transaction handle — lets booking writes reuse these. */
type Db = Prisma.TransactionClient | typeof prisma;

export async function listMechanics(query: ListMechanicsQuery) {
  const where: Prisma.MechanicWhereInput = {
    ...(query.status ? { status: { in: query.status } } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { email: { contains: query.q, mode: 'insensitive' } },
            { phone: { contains: query.q } },
          ],
        }
      : {}),
  };

  // "Most jobs done" sorts on a relation count, which Prisma expresses
  // differently from a scalar sort.
  const orderBy: Prisma.MechanicOrderByWithRelationInput =
    query.sortBy === 'completedJobs'
      ? { bookings: { _count: query.sortDir } }
      : { [query.sortBy]: query.sortDir };

  const [rows, total] = await Promise.all([
    prisma.mechanic.findMany({ where, orderBy, select: mechanicListSelect, ...toSkipTake(query) }),
    prisma.mechanic.count({ where }),
  ]);

  return paginated(rows.map(toMechanicListItem), query, total);
}

export async function getMechanic(id: number) {
  const mechanic = await prisma.mechanic.findUnique({
    where: { id },
    select: mechanicListSelect,
  });
  if (!mechanic) throw new NotFound(`Mechanic ${id} not found.`);

  const [byStatus, recentBookings] = await Promise.all([
    prisma.booking.groupBy({
      by: ['status'],
      where: { mechanicId: id },
      _count: { _all: true },
    }),
    prisma.booking.findMany({
      where: { mechanicId: id },
      orderBy: { scheduledAt: 'desc' },
      take: 10,
      select: {
        id: true,
        reference: true,
        status: true,
        scheduledAt: true,
        amountPaise: true,
        customer: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    }),
  ]);

  const revenue = await prisma.booking.aggregate({
    where: { mechanicId: id, status: BookingStatus.COMPLETED },
    _sum: { amountPaise: true },
  });

  return {
    ...toMechanicListItem(mechanic),
    bookingsByStatus: Object.fromEntries(
      Object.values(BookingStatus).map((status) => [
        status,
        byStatus.find((row) => row.status === status)?._count._all ?? 0,
      ]),
    ),
    revenuePaise: revenue._sum.amountPaise ?? 0,
    recentBookings: recentBookings.map((booking) => ({
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      scheduledAt: booking.scheduledAt.toISOString(),
      amountPaise: booking.amountPaise,
      customer: booking.customer.name,
      service: booking.service.name,
    })),
  };
}

export async function setMechanicStatus(id: number, status: MechanicStatus) {
  const mechanic = await prisma.mechanic.findUnique({ where: { id }, select: { id: true } });
  if (!mechanic) throw new NotFound(`Mechanic ${id} not found.`);

  // Going off duty while holding a live job would leave that booking with an
  // unavailable mechanic and no way for the board to show who is responsible.
  if (status === MechanicStatus.OFF_DUTY) {
    const activeJobs = await prisma.booking.count({
      where: { mechanicId: id, status: { in: [...ACTIVE_STATUSES] } },
    });
    if (activeJobs > 0) {
      throw new Conflict(
        'Mechanic is on an active job. Complete or cancel it before going off duty.',
        { activeJobs },
      );
    }
  }

  await prisma.mechanic.update({ where: { id }, data: { status } });
  return getMechanic(id);
}

/**
 * Reconcile a mechanic's availability with the jobs they actually hold. Called
 * from the booking transaction after every status change, so mechanic status is
 * derived in exactly one place rather than set ad hoc by each write path.
 *
 * OFF_DUTY is left alone: it is a human decision, not a consequence of the board.
 */
export async function syncMechanicStatus(db: Db, mechanicId: number | null): Promise<void> {
  if (mechanicId === null) return;

  const mechanic = await db.mechanic.findUnique({
    where: { id: mechanicId },
    select: { status: true },
  });
  if (!mechanic || mechanic.status === MechanicStatus.OFF_DUTY) return;

  const activeJobs = await db.booking.count({
    where: { mechanicId, status: { in: [...ACTIVE_STATUSES] } },
  });
  const next = activeJobs > 0 ? MechanicStatus.ON_JOB : MechanicStatus.AVAILABLE;

  if (next !== mechanic.status) {
    await db.mechanic.update({ where: { id: mechanicId }, data: { status: next } });
  }
}

/** Guard used when assigning work: an off-duty mechanic cannot take a booking. */
export async function assertAssignable(db: Db, mechanicId: number): Promise<void> {
  const mechanic = await db.mechanic.findUnique({
    where: { id: mechanicId },
    select: { id: true, name: true, status: true },
  });
  if (!mechanic) throw new NotFound(`Mechanic ${mechanicId} not found.`);
  if (mechanic.status === MechanicStatus.OFF_DUTY) {
    throw new Conflict(`${mechanic.name} is off duty and cannot be assigned work.`);
  }
}
