// API contract for the customers module. Read-only, and the selects are already
// flat, so there is no output half — the `select` in the service is the contract.
import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination';
import { idParams } from '../../lib/params';

export const customerIdParams = idParams;

export const listCustomersQuery = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  city: z.string().trim().min(1).max(80).optional(),
  sortBy: z.enum(['name', 'createdAt']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  ...paginationQuery,
});
export type ListCustomersQuery = z.infer<typeof listCustomersQuery>;
