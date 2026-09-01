/**
 * All business days in this system are Asia/Kolkata days, but `Booking.scheduledOn`
 * is a `@db.Date` — a bare calendar date Prisma reads and writes as UTC midnight.
 * Every conversion between the two lives here, so a day-bucket query can never
 * drift by an offset somewhere else in the codebase.
 *
 * India is a fixed +05:30 with no DST, so a constant shift is exact.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** UTC instant for a wall-clock time in Asia/Kolkata. */
export function istToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  return new Date(Date.UTC(year, month, day, hour, minute) - IST_OFFSET_MS);
}

/** The IST calendar date an instant falls on, as UTC midnight (for `@db.Date`). */
export function istCalendarDate(instant: Date): Date {
  const shifted = new Date(instant.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

/** Today's IST calendar date parts, used as the anchor for day offsets. */
export function istToday(): { year: number; month: number; day: number } {
  const shifted = new Date(Date.now() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
}

/** Today's IST calendar date as UTC midnight — the value to compare `scheduledOn` against. */
export function istTodayDate(): Date {
  return istCalendarDate(new Date());
}

/** Shift a UTC-midnight calendar date by whole days. */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** First day of the IST calendar month `date` falls in, as UTC midnight. */
export function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/**
 * The half-open instant range covering one IST calendar day. Use this to filter
 * `scheduledAt`/`createdAt` (true timestamps); `scheduledOn` compares directly
 * against the calendar date instead.
 */
export function dayRangeUtc(date: Date): { gte: Date; lt: Date } {
  const start = new Date(date.getTime() - IST_OFFSET_MS);
  return { gte: start, lt: new Date(start.getTime() + DAY_MS) };
}

/**
 * The inclusive calendar-date window ending today, `days` wide. `lastNDays(30)`
 * spans today and the 29 days before it — 30 buckets, not 31.
 */
export function lastNDays(days: number): { from: Date; to: Date } {
  const to = istTodayDate();
  return { from: addDays(to, -(days - 1)), to };
}

/**
 * Every calendar date from `from` to `to` inclusive. `groupBy` returns no row for
 * a day with no bookings, so time-series endpoints enumerate the axis from here
 * and zero-fill the gaps rather than handing the chart a discontinuous series.
 */
export function eachDay(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  for (let cursor = from; cursor.getTime() <= to.getTime(); cursor = addDays(cursor, 1)) {
    days.push(cursor);
  }
  return days;
}

/** `YYYY-MM-DD` for a UTC-midnight calendar date — the wire format for a day bucket. */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
