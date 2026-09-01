import { Router } from 'express';
import * as controller from './dashboard.controller';

export const dashboardRoutes = Router();

dashboardRoutes.get('/overview', controller.overview);
dashboardRoutes.get('/bookings-by-status', controller.bookingsByStatus);
dashboardRoutes.get('/timeseries', controller.timeseries);
dashboardRoutes.get('/top-services', controller.topServices);
dashboardRoutes.get('/revenue-by-category', controller.revenueByCategory);
dashboardRoutes.get('/activity', controller.activity);
