import { prisma } from '../../db';
import type { Prisma } from '../../generated/prisma/client';
import { BookingStatus } from '../../generated/prisma/enums';
import { NotFound } from '../../lib/errors';
import { paginated, toSkipTake } from '../../lib/pagination';
import type { ListCustomersQuery } from './customer.model';

export async function listCustomers(query: ListCustomersQuery) {
  const where: Prisma.CustomerWhereInput = {
    ...(query.city ? { city: { equals: query.city, mode: 'insensitive' } } : {}),
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

  const [rows, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortDir },
      ...toSkipTake(query),
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        createdAt: true,
        _count: { select: { vehicles: true, bookings: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  const data = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    createdAt: row.createdAt.toISOString(),
    vehicleCount: row._count.vehicles,
    bookingCount: row._count.bookings,
  }));

  return paginated(data, query, total);
}

export async function getCustomer(id: number) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      createdAt: true,
      vehicles: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          registration: true,
          fuelType: true,
        },
      },
      bookings: {
        orderBy: { scheduledAt: 'desc' },
        take: 10,
        select: {
          id: true,
          reference: true,
          status: true,
          scheduledAt: true,
          amountPaise: true,
          service: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!customer) throw new NotFound(`Customer ${id} not found.`);

  const spend = await prisma.booking.aggregate({
    where: { customerId: id, status: BookingStatus.COMPLETED },
    _sum: { amountPaise: true },
    _count: { _all: true },
  });

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    city: customer.city,
    createdAt: customer.createdAt.toISOString(),
    lifetimeSpendPaise: spend._sum.amountPaise ?? 0,
    completedBookings: spend._count._all,
    vehicles: customer.vehicles,
    recentBookings: customer.bookings.map((booking) => ({
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      scheduledAt: booking.scheduledAt.toISOString(),
      amountPaise: booking.amountPaise,
      service: booking.service.name,
    })),
  };
}

export async function listCustomerVehicles(id: number) {
  const customer = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
  if (!customer) throw new NotFound(`Customer ${id} not found.`);

  return prisma.vehicle.findMany({
    where: { customerId: id },
    orderBy: { createdAt: 'asc' },
    select: { id: true, make: true, model: true, year: true, registration: true, fuelType: true },
  });
}
