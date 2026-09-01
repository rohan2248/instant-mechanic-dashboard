import { Router } from 'express';
import * as controller from './vehicle.controller';

export const vehicleRoutes = Router();

vehicleRoutes.get('/', controller.list);
vehicleRoutes.get('/:id', controller.detail);
