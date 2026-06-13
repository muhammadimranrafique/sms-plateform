import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { ok, created } from '../../shared/response';
import * as service from './class.service';

export const list = async (req: AuthRequest, res: Response) => {
  res.json(ok(await service.listClasses(req.query as never)));
};

export const getById = async (req: AuthRequest, res: Response) => {
  res.json(ok(await service.getClass(Number(req.params.id))));
};

export const create = async (req: AuthRequest, res: Response) => {
  res.status(201).json(created(await service.createClass(req.body, req.user!)));
};

export const update = async (req: AuthRequest, res: Response) => {
  res.json(ok(await service.updateClass(Number(req.params.id), req.body, req.user!)));
};

export const remove = async (req: AuthRequest, res: Response) => {
  await service.deleteClass(Number(req.params.id), req.user!);
  res.status(204).send();
};
