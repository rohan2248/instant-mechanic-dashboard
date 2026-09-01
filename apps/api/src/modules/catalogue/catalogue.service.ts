import { prisma } from '../../db';
import { BookingStatus, FuelType, MechanicStatus } from '../../generated/prisma/enums';
import type { ListServicesQuery } from './catalogue.model';

export async function listServices(query: ListServicesQuery) {
  const rows = await prisma.service.findMany({
    where: {
      ...(query.categoryId !== undefined ? { categoryId: query.categoryId } : {}),
      ...(query.categorySlug ? { category: { slug: query.categorySlug } } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    },
    orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      basePricePaise: true,
      durationMins: true,
      isActive: true,
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    basePricePaise: row.basePricePaise,
    durationMins: row.durationMins,
    isActive: row.isActive,
    categoryId: row.category.id,
    category: row.category.name,
    categorySlug: row.category.slug,
  }));
}

export async function listCategories() {
  const rows = await prisma.serviceCategory.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { services: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    serviceCount: row._count.services,
  }));
}

/**
 * The enum values the UI filters on. Served from the generated Prisma enums so
 * the frontend's filter chips are never a stale hand-copy of the schema.
 */
export function listEnums() {
  return {
    bookingStatus: Object.values(BookingStatus),
    mechanicStatus: Object.values(MechanicStatus),
    fuelType: Object.values(FuelType),
  };
}
