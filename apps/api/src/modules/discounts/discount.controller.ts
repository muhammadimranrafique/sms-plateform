import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { ok, created } from '../../shared/response';
import * as service from './discount.service';

export const list = async (req: AuthRequest, res: Response) => {
  const result = await service.listDiscounts(req.query as never);
  res.json(ok(result.data, { pagination: result }));
};

export const getById = async (req: AuthRequest, res: Response) => {
  const discount = await service.getDiscount(Number(req.params.id));
  res.json(ok(discount));
};

export const create = async (req: AuthRequest, res: Response) => {
  const discount = await service.createDiscount(req.body, req.user!);
  res.status(201).json(created(discount));
};

export const update = async (req: AuthRequest, res: Response) => {
  const discount = await service.updateDiscount(Number(req.params.id), req.body, req.user!);
  res.json(ok(discount));
};

export const remove = async (req: AuthRequest, res: Response) => {
  await service.deleteDiscount(Number(req.params.id), req.user!);
  res.status(204).send();
};
