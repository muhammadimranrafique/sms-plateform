import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { ok } from '../../shared/response';
import * as service from './report.service';

export const dashboard = async (_req: AuthRequest, res: Response) => {
  res.json(ok(await service.getDashboardStats()));
};

export const feeCollection = async (req: AuthRequest, res: Response) => {
  const month = typeof req.query.month === 'string' ? req.query.month : undefined;
  res.json(ok(await service.getFeeCollection(month)));
};
