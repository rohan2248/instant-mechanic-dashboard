// API contract for the vehicles module. Read-only.
import { z } from 'zod';
import { FuelType } from '../../generated/prisma/enums';
import { paginationQuery } from '../../lib/pagination';
import { csvArray, idParams } from '../../lib/params';

export const vehicleIdParams = idParams;

export const listVehiclesQuery = z.object({
  customerId: z.coerce.number().int().positive().optional(),
  fuelType: csvArray(z.enum(FuelType)).optional(),
  // Matches registration, make or model.
  q: z.string().trim().min(1).max(120).optional(),
  ...paginationQuery,
});
export type ListVehiclesQuery = z.infer<typeof listVehiclesQuery>;
