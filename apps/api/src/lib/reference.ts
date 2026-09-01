import { istCalendarDate } from './time';

/**
 * Booking references are derived from the row id rather than a `count() + 1`,
 * which would hand two concurrent creates the same number. The format matches
 * what the seed writes (`IM-2026-000123`), so seeded and live rows are
 * indistinguishable in the UI.
 */
export function formatBookingReference(id: number, scheduledAt: Date): string {
  const year = istCalendarDate(scheduledAt).getUTCFullYear();
  return `IM-${year}-${String(id).padStart(6, '0')}`;
}
