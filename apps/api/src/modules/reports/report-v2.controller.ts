import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../config/prisma';
import * as reportV2Service from './report-v2.service';
import { ok } from '../../shared/response';
import { BadRequestError } from '../../shared/errors';

export async function getStudentLedger(req: AuthRequest, res: Response) {
  const studentId = Number(req.params.studentId);
  const sessionId = req.query.sessionId ? Number(req.query.sessionId) : undefined;
  const result = await reportV2Service.getStudentLedger(studentId, sessionId);
  res.json(ok(result));
}

export async function getDefaulterList(req: AuthRequest, res: Response) {
  const sessionId = Number(req.query.sessionId) || (await getCurrentSessionId());
  const minOverdue = Number(req.query.minOverdue) || 1;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 100;
  const result = await reportV2Service.getDefaulterList(sessionId, minOverdue, page, limit);
  res.json(ok(result));
}

export async function getClassCollectionSummary(req: AuthRequest, res: Response) {
  const sessionId = Number(req.query.sessionId) || (await getCurrentSessionId());
  const result = await reportV2Service.getClassCollectionSummary(sessionId);
  res.json(ok(result));
}

export async function getComparativeReport(req: AuthRequest, res: Response) {
  const session1Id = Number(req.query.session1Id);
  const session2Id = Number(req.query.session2Id);
  if (!session1Id || !session2Id) throw new BadRequestError('session1Id and session2Id are required');
  const result = await reportV2Service.getComparativeReport(session1Id, session2Id);
  res.json(ok(result));
}

export async function getConcessionReport(req: AuthRequest, res: Response) {
  const sessionId = Number(req.query.sessionId) || (await getCurrentSessionId());
  const result = await reportV2Service.getConcessionReport(sessionId);
  res.json(ok(result));
}

async function getCurrentSessionId(): Promise<number> {
  const session = await prisma.session.findFirst({ where: { isCurrent: true }, select: { id: true } });
  return session?.id ?? 0;
}
