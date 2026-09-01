import { prisma } from '../../db';
import type { Prisma } from '../../generated/prisma/client';
import { NotFound } from '../../lib/errors';
import { paginated, toSkipTake } from '../../lib/pagination';
import type { ListVehiclesQuery } from './vehicle.model';

const vehicleSelect = {
  id: true,
  make: true,
  model: true,
  year: true,
  registration: true,
  fuelType: true,
  createdAt: true,
  customer: { select: { id: true, name: true, phone: true } },
  _count: { select: { bookings: true } },
} as const;

export async function listVehicles(query: ListVehiclesQuery) {
  const where: Prisma.VehicleWhereInput = {
    ...(query.customerId !== undefined ? { customerId: query.customerId } : {}),
    ...(query.fuelType ? { fuelType: { in: query.fuelType } } : {}),
    ...(query.q
      ? {
          OR: [
            { registration: { contains: query.q, mode: 'insensitive' } },
            { make: { contains: query.q, mode: 'insensitive' } },
            { model: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { id: 'asc' },
      select: vehicleSelect,
      ...toSkipTake(query),
    }),
    prisma.vehicle.count({ where }),
  ]);

  return paginated(rows.map(shape), query, total);
}

export async function getVehicle(id: number) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id }, select: vehicleSelect });
  if (!vehicle) throw new NotFound(`Vehicle ${id} not found.`);
  return shape(vehicle);
}

function shape(row: Prisma.VehicleGetPayload<{ select: typeof vehicleSelect }>) {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    year: row.year,
    registration: row.registration,
    fuelType: row.fuelType,
    createdAt: row.createdAt.toISOString(),
    customer: row.customer,
    bookingCount: row._count.bookings,
  };
}
