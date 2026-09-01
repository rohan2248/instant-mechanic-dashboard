import { z } from 'zod';

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

/**
 * Spread into any list query schema. The `pageSize` ceiling is deliberate: it is
 * the only thing stopping a caller from asking for all 600 bookings at once.
 */
export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
};

export interface PageParams {
  page: number;
  pageSize: number;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function toSkipTake({ page, pageSize }: PageParams): { skip: number; take: number } {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function buildMeta({ page, pageSize }: PageParams, total: number): PageMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** The envelope every list endpoint returns. */
export function paginated<T>(data: T[], params: PageParams, total: number) {
  return { data, meta: buildMeta(params, total) };
}
