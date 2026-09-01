import { Router } from 'express';
import { prisma } from './db';
import { bookingRoutes } from './modules/bookings/booking.routes';
import {
  metaRoutes,
  serviceCategoryRoutes,
  serviceRoutes,
} from './modules/catalogue/catalogue.routes';
import { customerRoutes } from './modules/customers/customer.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { mechanicRoutes } from './modules/mechanics/mechanic.routes';
import { vehicleRoutes } from './modules/vehicles/vehicle.routes';

export const apiRoutes = Router();

/** Liveness + a real database round trip, for the load balancer and for humans. */
apiRoutes.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'reachable', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unreachable' });
  }
});

apiRoutes.use('/dashboard', dashboardRoutes);
apiRoutes.use('/bookings', bookingRoutes);
apiRoutes.use('/mechanics', mechanicRoutes);
apiRoutes.use('/customers', customerRoutes);
apiRoutes.use('/vehicles', vehicleRoutes);
apiRoutes.use('/services', serviceRoutes);
apiRoutes.use('/service-categories', serviceCategoryRoutes);
apiRoutes.use('/meta', metaRoutes);
