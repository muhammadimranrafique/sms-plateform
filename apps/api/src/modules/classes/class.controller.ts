import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { ok, created } from '../../shared/response';
import * as service from './class.service';

export const list = async (_req: AuthRequest, res: Response) => {
  res.json(ok(await service.listClasses()));
};

export const create = async (req: AuthRequest, res: Response) => {
  res.status(201).json(created(await service.createClass(req.body, req.user!)));
};

export const update = async (req: AuthRequest, res: Response) => {
  res.json(ok(await service.updateClass(Number(req.params.id), req.body, req.user!)));
};
