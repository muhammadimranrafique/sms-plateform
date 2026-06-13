import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { ok, created } from '../../shared/response';
import * as service from './payment.service';

export const receive = async (req: AuthRequest, res: Response) => {
  const result = await service.receivePayment(req.body, req.user!);
  res.status(201).json(created(result));
};

export const history = async (req: AuthRequest, res: Response) => {
  const studentId = Number(req.params.studentId);
  const result = await service.getPaymentHistory(studentId, req.query as never);
  res.json(ok(result.data, { pagination: result.pagination }));
};

export const reverse = async (req: AuthRequest, res: Response) => {
  const paymentId = Number(req.params.paymentId);
  const result = await service.reversePayment(paymentId, req.body, req.user!);
  res.json(ok(result));
};
