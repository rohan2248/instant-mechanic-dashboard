import { Router } from 'express';
import * as controller from './mechanic.controller';

export const mechanicRoutes = Router();

mechanicRoutes.get('/', controller.list);
mechanicRoutes.get('/:id', controller.detail);
mechanicRoutes.patch('/:id/status', controller.updateStatus);
