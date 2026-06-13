import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../shared/errors';

export function determineAlertLevel(overdueDays: number): 'YELLOW' | 'ORANGE' | 'RED' {
  if (overdueDays >= 61) return 'RED';
  if (overdueDays >= 31) return 'ORANGE';
  return 'YELLOW';
}

export async function generateAlerts(sessionId: number) {
  const overdueStudents = await prisma.$queryRaw<Array<{
    student_id: number;
    overdue_days: number;
    amount_due: string;
  }>>`
    SELECT
      fc.student_id,
      EXTRACT(DAY FROM NOW() - MIN(fc.due_date))::int as overdue_days,
      COALESCE(SUM(fc.amount + fc.fine - fc.paid_amount), 0) as amount_due
    FROM fee_charges fc
    WHERE fc.session_id = ${sessionId}
      AND fc.status IN ('UNPAID', 'OVERDUE', 'PARTIAL')
      AND fc.due_date < NOW()
    GROUP BY fc.student_id
    HAVING EXTRACT(DAY FROM NOW() - MIN(fc.due_date))::int >= 1
  `;

  let created = 0;
  let updated = 0;

  for (const row of overdueStudents) {
    const alertLevel = determineAlertLevel(Number(row.overdue_days));
    const studentId = Number(row.student_id);
    const overdueDays = Number(row.overdue_days);
    const amountDue = Number(row.amount_due);

    const existing = await prisma.defaulterAlert.findFirst({
      where: { studentId, sessionId, status: 'ACTIVE' },
    });

    if (existing) {
      if (existing.alertLevel !== alertLevel || Number(existing.overdueDays) !== overdueDays || Number(existing.amountDue) !== amountDue) {
        await prisma.defaulterAlert.update({
          where: { id: existing.id },
          data: { alertLevel, overdueDays, amountDue },
        });
        updated++;
      }
      continue;
    }

    await prisma.defaulterAlert.create({
      data: { studentId, sessionId, overdueDays, amountDue, alertLevel },
    });
    created++;
  }

  return { generated: created, updated, total: overdueStudents.length };
}

export async function getAlerts(sessionId: number, level?: string, status?: string, page = 1, limit = 50) {
  const where: Record<string, unknown> = { sessionId };
  if (level) where.alertLevel = level;
  if (status) where.status = status;

  const [alerts, total] = await Promise.all([
    prisma.defaulterAlert.findMany({
      where,
      include: { student: { select: { name: true, admissionNo: true, class: true } } },
      orderBy: [{ overdueDays: 'desc' }, { amountDue: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.defaulterAlert.count({ where }),
  ]);

  return { alerts, total, page, limit };
}

export async function resolveAlert(alertId: number, resolvedBy: string, remarks?: string) {
  const alert = await prisma.defaulterAlert.findUnique({ where: { id: alertId } });
  if (!alert) throw new NotFoundError('DefaulterAlert');

  return prisma.defaulterAlert.update({
    where: { id: alertId },
    data: { status: 'RESOLVED', resolvedAt: new Date(), resolvedBy, remarks },
  });
}

export async function dismissAlert(alertId: number) {
  const alert = await prisma.defaulterAlert.findUnique({ where: { id: alertId } });
  if (!alert) throw new NotFoundError('DefaulterAlert');

  return prisma.defaulterAlert.update({
    where: { id: alertId },
    data: { status: 'DISMISSED' },
  });
}
