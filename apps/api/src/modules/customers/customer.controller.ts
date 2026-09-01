import type { Request, Response } from 'express';
import { customerIdParams, listCustomersQuery } from './customer.model';
import * as service from './customer.service';

export async function list(req: Request, res: Response) {
  res.json(await service.listCustomers(listCustomersQuery.parse(req.query)));
}

export async function detail(req: Request, res: Response) {
  const { id } = customerIdParams.parse(req.params);
  res.json(await service.getCustomer(id));
}

export async function vehicles(req: Request, res: Response) {
  const { id } = customerIdParams.parse(req.params);
  res.json(await service.listCustomerVehicles(id));
}
