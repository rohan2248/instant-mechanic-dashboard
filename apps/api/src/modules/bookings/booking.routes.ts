import { Router } from 'express';
import * as controller from './booking.controller';

export const bookingRoutes = Router();

bookingRoutes.get('/', controller.list);
bookingRoutes.post('/', controller.create);
bookingRoutes.get('/:id', controller.detail);
bookingRoutes.patch('/:id/status', controller.updateStatus);
bookingRoutes.patch('/:id/assign', controller.assign);
bookingRoutes.post('/:id/cancel', controller.cancel);
