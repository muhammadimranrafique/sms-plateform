import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../config/prisma';
import * as defaulterService from './defaulter.service';
import { ok } from '../../shared/response';

export async function generateAlerts(req: AuthRequest, res: Response) {
  const sessionId = Number(req.body.sessionId) || (await getCurrentSessionId());
  const result = await defaulterService.generateAlerts(sessionId);
  res.json(ok(result));
}

export async function listAlerts(req: AuthRequest, res: Response) {
  const sessionId = Number(req.query.sessionId) || (await getCurrentSessionId());
  const level = req.query.level as string | undefined;
  const status = req.query.status as string | undefined;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 50;
  const result = await defaulterService.getAlerts(
    sessionId,
    level as any,
    status as any,
    page,
    limit,
  );
  res.json(ok(result));
}

export async function resolveAlert(req: AuthRequest, res: Response) {
  const alertId = Number(req.params.alertId);
  const resolvedBy = req.user?.email ?? 'unknown';
  const remarks = req.body?.remarks as string | undefined;
  const result = await defaulterService.resolveAlert(alertId, resolvedBy, remarks);
  res.json(ok(result));
}

export async function dismissAlert(req: AuthRequest, res: Response) {
  const alertId = Number(req.params.alertId);
  const result = await defaulterService.dismissAlert(alertId);
  res.json(ok(result));
}

async function getCurrentSessionId(): Promise<number> {
  const session = await prisma.session.findFirst({ where: { isCurrent: true }, select: { id: true } });
  return session?.id ?? 0;
}
