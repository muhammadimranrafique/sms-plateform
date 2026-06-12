import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { ok, created } from '../../shared/response';
import * as service from './promotion.service';

export const list = async (req: AuthRequest, res: Response) => {
  const result = await service.listPromotions(req.query as never);
  res.json(ok(result.data, { pagination: result }));
};

export const promote = async (req: AuthRequest, res: Response) => {
  const result = await service.promoteStudents(req.body, req.user!);
  res.status(201).json(created(result));
};
