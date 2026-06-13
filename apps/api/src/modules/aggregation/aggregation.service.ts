import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../shared/errors';

export async function getStudentFeeSummary(studentId: number) {
  const [charges, ledger, vouchers] = await Promise.all([
    prisma.feeCharge.aggregate({
      where: { studentId },
      _sum: { amount: true, paidAmount: true, fine: true },
    }),
    prisma.studentLedger.findUnique({ where: { studentId } }),
    prisma.voucher.findMany({
      where: { studentId },
      select: { id: true, status: true },
    }),
  ]);

  const totalAssigned = Number(charges._sum.amount ?? 0);
  const totalPaid = Number(charges._sum.paidAmount ?? 0);
  const totalFine = Number(charges._sum.fine ?? 0);
  const advanceBalance = Number(ledger?.advance ?? 0);
  const collectionRate = totalAssigned > 0 ? Math.round((totalPaid / totalAssigned) * 10000) / 100 : 0;
  const pendingCount = vouchers.filter((v) => ['PENDING', 'UNPAID'].includes(v.status)).length;
  const overdueCount = vouchers.filter((v) => ['OVERDUE', 'PARTIAL'].includes(v.status)).length;

  return { totalAssigned, totalPaid, totalFine, advanceBalance, pendingCount, overdueCount, collectionRate };
}

export async function getClassFeeSummary(classId: number, sessionId: number) {
  const result = await prisma.$queryRaw<Array<{
    class_name: string;
    student_count: bigint;
    total_assigned: string;
    total_collected: string;
    total_outstanding: string;
    paid_count: bigint;
    partial_count: bigint;
    unpaid_count: bigint;
    overdue_count: bigint;
  }>>`
    SELECT
      c.name as class_name,
      COUNT(DISTINCT s.id)::int as student_count,
      COALESCE(SUM(fc.amount), 0) as total_assigned,
      COALESCE(SUM(fc.paid_amount), 0) as total_collected,
      COALESCE(SUM(fc.amount + fc.fine - fc.paid_amount), 0) as total_outstanding,
      COUNT(DISTINCT CASE WHEN fc.status = 'PAID' THEN fc.student_id END)::int as paid_count,
      COUNT(DISTINCT CASE WHEN fc.status = 'PARTIAL' THEN fc.student_id END)::int as partial_count,
      COUNT(DISTINCT CASE WHEN fc.status = 'UNPAID' THEN fc.student_id END)::int as unpaid_count,
      COUNT(DISTINCT CASE WHEN fc.status = 'OVERDUE' THEN fc.student_id END)::int as overdue_count
    FROM classes c
    JOIN students s ON s.class_id = c.id AND s.deleted_at IS NULL
    LEFT JOIN fee_charges fc ON fc.student_id = s.id AND fc.session_id = ${sessionId}
    WHERE c.id = ${classId}
    GROUP BY c.id, c.name
  `;

  const r = result[0];
  if (!r) throw new NotFoundError('Class');

  const totalAssigned = Number(r.total_assigned);
  return {
    className: r.class_name,
    studentCount: Number(r.student_count),
    totalAssigned,
    totalCollected: Number(r.total_collected),
    totalOutstanding: Number(r.total_outstanding),
    collectionRate: totalAssigned > 0 ? Math.round((Number(r.total_collected) / totalAssigned) * 10000) / 100 : 0,
    paidCount: Number(r.paid_count),
    partialCount: Number(r.partial_count),
    unpaidCount: Number(r.unpaid_count),
    overdueCount: Number(r.overdue_count),
  };
}

export async function getInstitutionKPI(sessionId?: number) {
  const where = sessionId ? { sessionId } : {};
  const [charges, studentCount, alertCount] = await Promise.all([
    prisma.feeCharge.aggregate({ where, _sum: { amount: true, paidAmount: true, fine: true } }),
    prisma.student.count({ where: { deletedAt: null, ...(sessionId ? { sessionId } : {}) } }),
    prisma.defaulterAlert.count({ where: { status: 'ACTIVE' } }),
  ]);

  const totalAssigned = Number(charges._sum.amount ?? 0);
  const totalCollected = Number(charges._sum.paidAmount ?? 0);
  const totalFine = Number(charges._sum.fine ?? 0);
  const outstanding = Math.max(0, totalAssigned + totalFine - totalCollected);
  const collectionRate = totalAssigned > 0 ? Math.round((totalCollected / totalAssigned) * 10000) / 100 : 0;

  return {
    totalStudents: studentCount,
    totalFeeAssigned: totalAssigned,
    totalFeeCollected: totalCollected,
    totalOutstanding: outstanding,
    totalOverdue: await getTotalOverdue(where),
    collectionRate,
    overdueRate: totalAssigned > 0 ? Math.round((outstanding / totalAssigned) * 10000) / 100 : 0,
    activeDefaulters: alertCount,
  };
}

export async function getDailyRegister(date?: string) {
  const targetDate = date ?? new Date().toISOString().split('T')[0] ?? '';
  const startDate = new Date(targetDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  const payments = await prisma.payment.findMany({
    where: { paidAt: { gte: startDate, lt: endDate }, status: 'COMPLETED' },
    include: { student: { select: { name: true, admissionNo: true } } },
    orderBy: { paidAt: 'asc' },
  });

  const totals = { cashTotal: 0, bankTransferTotal: 0, chequeTotal: 0, onlineTotal: 0, advanceTotal: 0 };
  for (const p of payments) {
    const amount = Number(p.amount);
    switch (p.method) {
      case 'CASH': totals.cashTotal += amount; break;
      case 'BANK_TRANSFER': totals.bankTransferTotal += amount; break;
      case 'CHEQUE': totals.chequeTotal += amount; break;
      case 'ONLINE': totals.onlineTotal += amount; break;
    }
  }

  return { date: targetDate, entries: payments, totals, transactionCount: payments.length };
}

export async function getHeadWiseBreakdown(sessionId: number) {
  const result = await prisma.$queryRaw<Array<{
    head_id: number;
    head_name: string;
    head_code: string;
    total_assigned: string;
    total_collected: string;
  }>>`
    SELECT
      fh.id as head_id,
      fh.name as head_name,
      fh.code as head_code,
      COALESCE(SUM(fc.amount), 0) as total_assigned,
      COALESCE(SUM(fc.paid_amount), 0) as total_collected
    FROM fee_heads fh
    JOIN fee_charges fc ON fc.fee_head_id = fh.id
    WHERE fc.session_id = ${sessionId}
    GROUP BY fh.id, fh.name, fh.code
    ORDER BY total_assigned DESC
  `;

  const grandTotal = result.reduce((s, r) => s + Number(r.total_assigned), 0);
  return result.map((r) => ({
    feeHeadId: Number(r.head_id),
    feeHeadName: r.head_name,
    feeHeadCode: r.head_code,
    totalAssigned: Number(r.total_assigned),
    totalCollected: Number(r.total_collected),
    collectionRate: Number(r.total_assigned) > 0
      ? Math.round((Number(r.total_collected) / Number(r.total_assigned)) * 10000) / 100
      : 0,
    percentageOfTotal: grandTotal > 0
      ? Math.round((Number(r.total_assigned) / grandTotal) * 10000) / 100
      : 0,
  }));
}

export async function getMonthlyRegister(month?: string) {
  const targetMonth = month ?? new Date().toISOString().slice(0, 7);
  const [yearStr, monthStr] = targetMonth.split('-');
  const year = parseInt(yearStr!);
  const monthNum = parseInt(monthStr!);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0, 23, 59, 59);

  const payments = await prisma.payment.findMany({
    where: { paidAt: { gte: startDate, lte: endDate }, status: 'COMPLETED' },
    include: { student: { select: { name: true, admissionNo: true, class: true } } },
    orderBy: { paidAt: 'asc' },
  });

  const dailyTotals = new Map<string, number>();
  let grandTotal = 0;
  for (const p of payments) {
    const day = p.paidAt.toISOString().split('T')[0]!;
    dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + Number(p.amount));
    grandTotal += Number(p.amount);
  }

  return {
    month: targetMonth, year,
    totalPayments: payments.length,
    grandTotal,
    dailySummary: Array.from(dailyTotals.entries()).map(([date, total]) => ({ date, total })),
    payments,
  };
}

export async function refreshDailyAggregation(date?: string) {
  const targetDate = date ?? new Date().toISOString().split('T')[0];
  await prisma.$executeRawUnsafe(`SELECT refresh_daily_aggregation($1::date)`, targetDate);
  return { refreshed: true, date: targetDate };
}

async function getTotalOverdue(where: { sessionId?: number }): Promise<number> {
  const overdueCharges = await prisma.feeCharge.aggregate({
    where: { ...where, status: { in: ['UNPAID', 'OVERDUE', 'PARTIAL'] }, dueDate: { lt: new Date() } },
    _sum: { amount: true, paidAmount: true, fine: true },
  });
  return Math.max(0, Number(overdueCharges._sum.amount ?? 0) + Number(overdueCharges._sum.fine ?? 0) - Number(overdueCharges._sum.paidAmount ?? 0));
}
