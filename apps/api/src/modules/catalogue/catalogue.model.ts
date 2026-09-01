// API contract for the service catalogue (services + their categories). Read-only.
import { z } from 'zod';

export const listServicesQuery = z.object({
  categoryId: z.coerce.number().int().positive().optional(),
  categorySlug: z.string().trim().min(1).max(80).optional(),
  // Defaults to active only — a retired service should not appear in a booking form.
  isActive: z
    .enum(['true', 'false', 'all'])
    .default('true')
    .transform((value) => (value === 'all' ? undefined : value === 'true')),
});
export type ListServicesQuery = z.infer<typeof listServicesQuery>;
