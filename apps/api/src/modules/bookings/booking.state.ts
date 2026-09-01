import { BookingStatus } from '../../generated/prisma/enums';
import { Conflict } from '../../lib/errors';

/**
 * The booking lifecycle, in one place. Every write path that changes a status
 * goes through `assertTransition`, so an invalid move is impossible to reach by
 * calling a different endpoint.
 */
const TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.ASSIGNED, BookingStatus.CANCELLED],
  // Unassigning a mechanic drops the booking back to the pending queue.
  [BookingStatus.ASSIGNED]: [BookingStatus.ON_THE_WAY, BookingStatus.PENDING, BookingStatus.CANCELLED],
  [BookingStatus.ON_THE_WAY]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
  [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

/** Statuses that occupy a mechanic right now. */
export const ACTIVE_STATUSES = [BookingStatus.ON_THE_WAY, BookingStatus.IN_PROGRESS] as const;

/** Statuses that are still open — neither completed nor cancelled. */
export const OPEN_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.ASSIGNED,
  BookingStatus.ON_THE_WAY,
  BookingStatus.IN_PROGRESS,
] as const;

export function isTerminal(status: BookingStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/**
 * A rejected transition is a 409, not a 400: the request was perfectly well
 * formed, the booking was just in the wrong state to accept it.
 */
export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (from === to) {
    throw new Conflict(`Booking is already ${from}.`);
  }
  if (canTransition(from, to)) return;

  throw new Conflict(
    isTerminal(from)
      ? `Booking is ${from} and can no longer change status.`
      : `Cannot move a booking from ${from} to ${to}.`,
    { from, to, allowed: TRANSITIONS[from] },
  );
}

/** Whether leaving `to` requires an assigned mechanic. */
export function requiresMechanic(to: BookingStatus): boolean {
  return to !== BookingStatus.PENDING && to !== BookingStatus.CANCELLED;
}
