import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { ok, created } from '../../shared/response';
import * as service from './voucher.service';
import { getVoucherStatus, recalculateVoucher } from '../payments/payment.service';

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

export const generateSingle = async (req: AuthRequest, res: Response) => {
  res.status(201).json(created(await service.generateVoucher(req.body, req.user!)));
};

export const generateBatch = async (req: AuthRequest, res: Response) => {
  res.status(201).json(created(await service.generateBatchVouchers(req.body, req.user!)));
};

export const generateAllMonths = async (req: AuthRequest, res: Response) => {
  res.status(201).json(created(await service.generateAllMonths(req.body, req.user!)));
};

export const updateStatus = async (req: AuthRequest, res: Response) => {
  res.json(ok(await service.updateVoucherStatus(Number(req.params.id), req.body, req.user!)));
};

export const getStatusByVoucherNo = async (req: AuthRequest, res: Response) => {
  const voucherNo = req.params.voucherNo as string;
  const result = await getVoucherStatus(voucherNo);
  res.json(ok(result));
};

export const recalculateVoucherStatus = async (req: AuthRequest, res: Response) => {
  const voucherNo = req.params.voucherNo as string;
  const result = await recalculateVoucher(voucherNo, req.user!);
  res.json(ok(result));
};
