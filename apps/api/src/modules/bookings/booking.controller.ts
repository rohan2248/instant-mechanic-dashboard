import type { Request, Response } from 'express';
import {
  assignBookingBody,
  bookingIdParams,
  cancelBookingBody,
  createBookingBody,
  listBookingsQuery,
  updateStatusBody,
} from './booking.model';
import * as service from './booking.service';

// Schemas are parsed here, at the HTTP boundary. A ZodError thrown by `parse`
// is turned into a 400 by the error handler, so no handler needs a try/catch.

export async function list(req: Request, res: Response) {
  res.json(await service.listBookings(listBookingsQuery.parse(req.query)));
}

export async function detail(req: Request, res: Response) {
  const { id } = bookingIdParams.parse(req.params);
  res.json(await service.getBooking(id));
}

export async function create(req: Request, res: Response) {
  res.status(201).json(await service.createBooking(createBookingBody.parse(req.body)));
}

export async function updateStatus(req: Request, res: Response) {
  const { id } = bookingIdParams.parse(req.params);
  res.json(await service.transitionStatus(id, updateStatusBody.parse(req.body)));
}

export async function assign(req: Request, res: Response) {
  const { id } = bookingIdParams.parse(req.params);
  res.json(await service.assignMechanic(id, assignBookingBody.parse(req.body)));
}

export async function cancel(req: Request, res: Response) {
  const { id } = bookingIdParams.parse(req.params);
  const { reason } = cancelBookingBody.parse(req.body ?? {});
  res.json(await service.cancelBooking(id, reason));
}
