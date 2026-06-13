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

export const promoteSingle = async (req: AuthRequest, res: Response) => {
  const result = await service.promoteSingle(req.body, req.user!);
  res.status(201).json(created(result));
};

export const previewBulk = async (req: AuthRequest, res: Response) => {
  const result = await service.previewBulkPromotion(req.body);
  res.json(ok(result));
};

export const executeBulk = async (req: AuthRequest, res: Response) => {
  const result = await service.executeBulkPromotion(req.body, req.user!);
  res.status(201).json(created(result));
};

export const rollback = async (req: AuthRequest, res: Response) => {
  const batchId = req.params.batchId as string;
  const result = await service.rollbackBatch(batchId, req.user!);
  res.json(ok(result));
};

export const listRules = async (req: AuthRequest, res: Response) => {
  const result = await service.listPromotionRules(req.query as never);
  res.json(ok(result.data, { pagination: result }));
};

export const createRule = async (req: AuthRequest, res: Response) => {
  const rule = await service.createPromotionRule(req.body, req.user!);
  res.status(201).json(created(rule));
};

export const updateRule = async (req: AuthRequest, res: Response) => {
  const rule = await service.updatePromotionRule(Number(req.params.id), req.body, req.user!);
  res.json(ok(rule));
};
