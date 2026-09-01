import type { Request, Response } from 'express';
import { activityQuery, limitQuery, timeseriesQuery } from './dashboard.model';
import * as service from './dashboard.service';

export async function overview(_req: Request, res: Response) {
  res.json(await service.getOverview());
}

export async function bookingsByStatus(_req: Request, res: Response) {
  res.json(await service.getBookingsByStatus());
}

export async function timeseries(req: Request, res: Response) {
  res.json(await service.getTimeseries(timeseriesQuery.parse(req.query)));
}

export async function topServices(req: Request, res: Response) {
  res.json(await service.getTopServices(limitQuery.parse(req.query)));
}

export async function revenueByCategory(_req: Request, res: Response) {
  res.json(await service.getRevenueByCategory());
}

export async function activity(req: Request, res: Response) {
  res.json(await service.getActivity(activityQuery.parse(req.query)));
}
