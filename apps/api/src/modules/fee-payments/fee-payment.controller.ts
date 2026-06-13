import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { ok, created } from '../../shared/response';
import * as service from './fee-payment.service';

export const list = async (req: AuthRequest, res: Response) => {
  const result = await service.listPayments(req.query as never);
  res.json(ok(result.data, { pagination: result }));
};

export const create = async (req: AuthRequest, res: Response) => {
  const payment = await service.createPayment(req.body, req.user!);
  res.status(201).json(created(payment));
};
