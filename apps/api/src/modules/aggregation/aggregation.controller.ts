import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../config/prisma';
import * as aggregationService from './aggregation.service';
import { ok } from '../../shared/response';
import { NotFoundError, BadRequestError } from '../../shared/errors';

export async function getStudentSummary(req: AuthRequest, res: Response) {
  const studentId = Number(req.params.studentId);
  const student = await prisma.student.findFirst({
    where: { id: studentId, deletedAt: null },
    include: { class: true },
  });
  if (!student) throw new NotFoundError('Student');

  const summary = await aggregationService.getStudentFeeSummary(studentId);
  res.json(ok({
    studentId: student.id,
    studentName: student.name,
    admissionNo: student.admissionNo,
    className: student.class?.name,
    ...summary,
  }));
}

export async function getClassSummary(req: AuthRequest, res: Response) {
  const classId = Number(req.params.classId);
  const sessionId = Number(req.query.sessionId) || (await getCurrentSessionId());
  const summary = await aggregationService.getClassFeeSummary(classId, sessionId);
  res.json(ok(summary));
}

export async function getInstitutionKPI(req: AuthRequest, res: Response) {
  const sessionId = req.query.sessionId ? Number(req.query.sessionId) : undefined;
  const kpi = await aggregationService.getInstitutionKPI(sessionId);
  res.json(ok(kpi));
}

export async function getDailyRegister(req: AuthRequest, res: Response) {
  const date = (req.query.date as string) ?? new Date().toISOString().split('T')[0];
  const register = await aggregationService.getDailyRegister(date);
  res.json(ok(register));
}

export async function getHeadWiseBreakdown(req: AuthRequest, res: Response) {
  const sessionId = Number(req.query.sessionId) || (await getCurrentSessionId());
  const breakdown = await aggregationService.getHeadWiseBreakdown(sessionId);
  res.json(ok(breakdown));
}

export async function getMonthlyRegister(req: AuthRequest, res: Response) {
  const month = req.query.month as string;
  if (!month) throw new BadRequestError('month required (YYYY-MM)');
  const register = await aggregationService.getMonthlyRegister(month);
  res.json(ok(register));
}

export async function refreshAggregation(req: AuthRequest, res: Response) {
  const date = req.body?.date as string | undefined;
  const result = await aggregationService.refreshDailyAggregation(date);
  res.json(ok(result));
}

async function getCurrentSessionId(): Promise<number> {
  const session = await prisma.session.findFirst({ where: { isCurrent: true }, select: { id: true } });
  return session?.id ?? 0;
}
