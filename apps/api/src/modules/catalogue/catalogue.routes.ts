import { Router } from 'express';
import * as controller from './catalogue.controller';

// Mounted at three separate paths in routes.ts because they are three separate
// resources that happen to share one small module.
export const serviceRoutes = Router();
serviceRoutes.get('/', controller.services);

export const serviceCategoryRoutes = Router();
serviceCategoryRoutes.get('/', controller.categories);

export const metaRoutes = Router();
metaRoutes.get('/enums', controller.enums);
