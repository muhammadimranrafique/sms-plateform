import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../config/prisma';
import * as exportService from './export.service';
import { ok } from '../../shared/response';

export async function exportDefaulters(req: AuthRequest, res: Response) {
  const sessionId = Number(req.query.sessionId) || (await getCurrentSessionId());
  const minOverdue = Number(req.query.minOverdue) || 1;
  const format = (req.query.format as string) ?? 'json';

  const data = await exportService.exportDefaulterList(sessionId, minOverdue);

  if (format === 'csv') {
    const headers = ['Admission No', 'Student Name', 'Father Name', 'Class', 'Contact', 'Outstanding', 'Overdue Days'];
    const rows = data.map((r) => [r.admissionNo, r.studentName, r.fatherName, r.className, r.contactNo, String(r.totalOutstanding), String(r.overdueDays)]);
    const csv = exportService.toCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="defaulters-${sessionId}.csv"`);
    return res.send(csv);
  }

  res.json(ok(data));
}

export async function exportCollectionRegister(req: AuthRequest, res: Response) {
  const date = (req.query.date as string) ?? new Date().toISOString().split('T')[0];
  const format = (req.query.format as string) ?? 'json';

  const data = await exportService.exportCollectionRegister(date);

  if (format === 'csv') {
    const headers = ['Receipt No', 'Student Name', 'Admission No', 'Amount', 'Method', 'Reference', 'Paid At', 'Received By'];
    const rows = data.records.map((r) => [String(r.receiptNo), r.studentName, r.admissionNo, String(r.amount), r.method, r.referenceNo ?? '', r.paidAt, r.receivedBy ?? '']);
    const csv = exportService.toCSV(headers, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="collection-${date}.csv"`);
    return res.send(csv);
  }

  res.json(ok(data));
}

async function getCurrentSessionId(): Promise<number> {
  const session = await prisma.session.findFirst({ where: { isCurrent: true }, select: { id: true } });
  return session?.id ?? 0;
}
