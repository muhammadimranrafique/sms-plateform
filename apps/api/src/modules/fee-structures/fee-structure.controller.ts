import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { ok, created } from '../../shared/response';
import * as service from './fee-structure.service';

export const listHeads = async (req: AuthRequest, res: Response) => {
  const result = await service.listFeeHeads(req.query as never);
  res.json(ok(result.data, { pagination: result }));
};

export const createHead = async (req: AuthRequest, res: Response) => {
  const head = await service.createFeeHead(req.body, req.user!);
  res.status(201).json(created(head));
};

export const updateHead = async (req: AuthRequest, res: Response) => {
  const head = await service.updateFeeHead(Number(req.params.id), req.body, req.user!);
  res.json(ok(head));
};

export const list = async (req: AuthRequest, res: Response) => {
  const result = await service.listFeeStructures(req.query as never);
  res.json(ok(result.data, { pagination: result }));
};

export const getById = async (req: AuthRequest, res: Response) => {
  const structure = await service.getFeeStructure(Number(req.params.id));
  res.json(ok(structure));
};

export const create = async (req: AuthRequest, res: Response) => {
  const structure = await service.createFeeStructure(req.body, req.user!, req.id as string);
  res.status(201).json(created(structure));
};

export const update = async (req: AuthRequest, res: Response) => {
  const structure = await service.updateFeeStructure(Number(req.params.id), req.body, req.user!);
  res.json(ok(structure));
};

export const remove = async (req: AuthRequest, res: Response) => {
  await service.deleteFeeStructure(Number(req.params.id), req.user!);
  res.status(204).send();
};
