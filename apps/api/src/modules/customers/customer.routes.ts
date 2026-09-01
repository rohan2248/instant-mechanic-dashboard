import { Router } from 'express';
import * as controller from './customer.controller';

export const customerRoutes = Router();

customerRoutes.get('/', controller.list);
customerRoutes.get('/:id', controller.detail);
customerRoutes.get('/:id/vehicles', controller.vehicles);
