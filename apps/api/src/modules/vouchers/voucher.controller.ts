import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { ok, created } from '../../shared/response';
import * as service from './voucher.service';

export const list = async (req: AuthRequest, res: Response) => {
  const result = await service.listVouchers(req.query as never);
  res.json(ok(result.data, { pagination: result }));
};

export const getById = async (req: AuthRequest, res: Response) => {
  res.json(ok(await service.getVoucher(Number(req.params.id))));
};

export const create = async (req: AuthRequest, res: Response) => {
  res.status(201).json(created(await service.createVoucher(req.body, req.user!)));
};

export const createBatch = async (req: AuthRequest, res: Response) => {
  res.status(201).json(created(await service.createBatchVouchers(req.body, req.user!)));
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  res.json(ok(await service.updateVoucherStatus(Number(req.params.id), req.body, req.user!)));
};
