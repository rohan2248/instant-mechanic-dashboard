import type { Request, Response } from 'express';
import { listVehiclesQuery, vehicleIdParams } from './vehicle.model';
import * as service from './vehicle.service';

export async function list(req: Request, res: Response) {
  res.json(await service.listVehicles(listVehiclesQuery.parse(req.query)));
}

export async function detail(req: Request, res: Response) {
  const { id } = vehicleIdParams.parse(req.params);
  res.json(await service.getVehicle(id));
}
