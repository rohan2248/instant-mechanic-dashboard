import type { Request, Response } from 'express';
import { listMechanicsQuery, mechanicIdParams, updateMechanicStatusBody } from './mechanic.model';
import * as service from './mechanic.service';

export async function list(req: Request, res: Response) {
  res.json(await service.listMechanics(listMechanicsQuery.parse(req.query)));
}

export async function detail(req: Request, res: Response) {
  const { id } = mechanicIdParams.parse(req.params);
  res.json(await service.getMechanic(id));
}

export async function updateStatus(req: Request, res: Response) {
  const { id } = mechanicIdParams.parse(req.params);
  const { status } = updateMechanicStatusBody.parse(req.body);
  res.json(await service.setMechanicStatus(id, status));
}
