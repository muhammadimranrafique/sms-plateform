import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { ok, created } from '../../shared/response';
import * as service from './session.service';

export const list = async (_req: AuthRequest, res: Response) => {
  res.json(ok(await service.listSessions()));
};

export const getById = async (req: AuthRequest, res: Response) => {
  res.json(ok(await service.getSession(Number(req.params.id))));
};

export const current = async (_req: AuthRequest, res: Response) => {
  res.json(ok(await service.getCurrentSession()));
};

export const create = async (req: AuthRequest, res: Response) => {
  res.status(201).json(created(await service.createSession(req.body, req.user!)));
};

export const update = async (req: AuthRequest, res: Response) => {
  res.json(ok(await service.updateSession(Number(req.params.id), req.body, req.user!)));
};

export const rollover = async (req: AuthRequest, res: Response) => {
  res.status(201).json(created(await service.rolloverSession(Number(req.params.id), req.user!)));
};
