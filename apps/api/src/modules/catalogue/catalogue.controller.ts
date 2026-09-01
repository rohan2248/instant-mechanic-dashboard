import type { Request, Response } from 'express';
import { listServicesQuery } from './catalogue.model';
import * as service from './catalogue.service';

export async function services(req: Request, res: Response) {
  res.json(await service.listServices(listServicesQuery.parse(req.query)));
}

export async function categories(_req: Request, res: Response) {
  res.json(await service.listCategories());
}

export function enums(_req: Request, res: Response) {
  res.json(service.listEnums());
}
