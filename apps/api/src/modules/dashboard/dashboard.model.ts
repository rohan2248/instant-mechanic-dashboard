// API contract for the dashboard module. Reads only — no output mappers needed,
// the services build their response shapes directly from aggregate results.
import { z } from 'zod';

export const timeseriesQuery = z.object({
  // 90 is the depth of the seeded history; asking for more returns empty buckets.
  days: z.coerce.number().int().min(1).max(365).default(30),
});
export type TimeseriesQuery = z.infer<typeof timeseriesQuery>;

export const limitQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(5),
});
export type LimitQuery = z.infer<typeof limitQuery>;

export const activityQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ActivityQuery = z.infer<typeof activityQuery>;
