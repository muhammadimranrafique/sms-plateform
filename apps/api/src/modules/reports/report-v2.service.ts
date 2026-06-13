import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../shared/errors';
import type { Prisma } from '@prisma/client';

export async function getStudentLedger(studentId: number, sessionId?: number) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, deletedAt: null },
    include: { class: true, session: true },
  });
  if (!student) throw new NotFoundError('Student');

  const chargeWhere: Prisma.FeeChargeWhereInput = { studentId };
  if (sessionId) chargeWhere.sessionId = sessionId;

  const [charges, payments, discounts, concessions, ledger] = await Promise.all([
    prisma.feeCharge.findMany({
      where: chargeWhere,
      include: { feeHead: true },
      orderBy: [{ dueDate: 'asc' }, { feeMonth: 'asc' }],
    }),
    prisma.payment.findMany({
      where: { studentId, status: 'COMPLETED' },
      include: { allocations: { include: { feeCharge: { include: { feeHead: true } } } } },
      orderBy: { paidAt: 'desc' },
    }),
    prisma.discount.findMany({ where: { studentId, isActive: true } }),
    prisma.studentConcession.findMany({
      where: { studentId },
      include: { concession: true, feeHead: true },
    }),
    prisma.studentLedger.findUnique({ where: { studentId } }),
  ]);

  const totalCharged = charges.reduce((s, c) => s + Number(c.amount), 0);
  const totalFine = charges.reduce((s, c) => s + Number(c.fine), 0);
  const totalPaid = charges.reduce((s, c) => s + Number(c.paidAmount), 0);

  return {
    student,
    summary: {
      totalCharged,
      totalFine,
      totalPaid,
      totalDiscount: discounts.reduce((s, d) => s + Number(d.value), 0),
      advanceBalance: Number(ledger?.advance ?? 0),
      outstandingBalance: totalCharged + totalFine - totalPaid,
    },
    charges,
    payments,
    discounts,
    concessions,
  };
}

export async function getDefaulterList(sessionId: number, minOverdueDays = 1, page = 1, limit = 100) {
  const result = await prisma.$queryRaw<Array<{
    student_id: number;
    admission_no: string;
    name: string;
    father_name: string;
    contact_no: string;
    address: string;
    class_name: string;
    total_outstanding: string;
    overdue_days: number;
  }>>`
    SELECT
      s.id as student_id,
      s.admission_no,
      s.name,
      s.father_name,
      s.contact_no,
      s.address,
      c.name as class_name,
      COALESCE(SUM(fc.amount + fc.fine - fc.paid_amount), 0) as total_outstanding,
      EXTRACT(DAY FROM NOW() - MIN(fc.due_date))::int as overdue_days
    FROM students s
    JOIN classes c ON c.id = s.class_id
    JOIN fee_charges fc ON fc.student_id = s.id
    WHERE s.session_id = ${sessionId}
      AND s.deleted_at IS NULL
      AND fc.status IN ('UNPAID', 'OVERDUE', 'PARTIAL')
      AND fc.due_date < NOW()
    GROUP BY s.id, s.admission_no, s.name, s.father_name, s.contact_no, s.address, c.name
    HAVING EXTRACT(DAY FROM NOW() - MIN(fc.due_date))::int >= ${minOverdueDays}
    ORDER BY overdue_days DESC, total_outstanding DESC
    LIMIT ${limit} OFFSET ${(page - 1) * limit}
  `;

  return result.map((r) => ({
    studentId: Number(r.student_id),
    admissionNo: r.admission_no,
    name: r.name,
    fatherName: r.father_name,
    contactNo: r.contact_no,
    address: r.address,
    className: r.class_name,
    totalOutstanding: Number(r.total_outstanding),
    overdueDays: Number(r.overdue_days),
  }));
}

export async function getClassCollectionSummary(sessionId: number) {
  const result = await prisma.$queryRaw<Array<{
    class_id: number;
    class_name: string;
    student_count: bigint;
    total_assigned: string;
    total_collected: string;
    total_outstanding: string;
    collection_rate: string;
  }>>`
    SELECT
      c.id as class_id,
      c.name as class_name,
      COUNT(DISTINCT s.id)::int as student_count,
      COALESCE(SUM(fc.amount), 0) as total_assigned,
      COALESCE(SUM(fc.paid_amount), 0) as total_collected,
      COALESCE(SUM(fc.amount + fc.fine - fc.paid_amount), 0) as total_outstanding,
      CASE
        WHEN COALESCE(SUM(fc.amount), 0) > 0
        THEN ROUND((COALESCE(SUM(fc.paid_amount), 0) / COALESCE(SUM(fc.amount), 0)) * 100, 2)
        ELSE 0
      END as collection_rate
    FROM classes c
    JOIN students s ON s.class_id = c.id AND s.deleted_at IS NULL
    LEFT JOIN fee_charges fc ON fc.student_id = s.id AND fc.session_id = ${sessionId}
    GROUP BY c.id, c.name
    ORDER BY c.name ASC
  `;

  return result.map((r) => ({
    classId: Number(r.class_id),
    className: r.class_name,
    studentCount: Number(r.student_count),
    totalAssigned: Number(r.total_assigned),
    totalCollected: Number(r.total_collected),
    totalOutstanding: Number(r.total_outstanding),
    collectionRate: Number(r.collection_rate),
  }));
}

export async function getComparativeReport(session1Id: number, session2Id: number) {
  const s1 = await getSessionSnapshot(session1Id);
  const s2 = await getSessionSnapshot(session2Id);

  return {
    session1: { id: session1Id, ...s1 },
    session2: { id: session2Id, ...s2 },
    variance: {
      assignedChange: s2.totalAssigned - s1.totalAssigned,
      collectedChange: s2.totalCollected - s1.totalCollected,
      assignedPercent: s1.totalAssigned > 0
        ? Math.round(((s2.totalAssigned - s1.totalAssigned) / s1.totalAssigned) * 10000) / 100
        : 0,
      collectedPercent: s1.totalCollected > 0
        ? Math.round(((s2.totalCollected - s1.totalCollected) / s1.totalCollected) * 10000) / 100
        : 0,
    },
  };
}

export async function getConcessionReport(sessionId: number) {
  const concessions = await prisma.studentConcession.findMany({
    where: { student: { sessionId } },
    include: {
      student: { select: { name: true, admissionNo: true, class: true } },
      concession: true,
      feeHead: true,
    },
  });

  const byConcession = new Map<string, { count: number; totalValue: number }>();
  for (const sc of concessions) {
    const name = sc.concession.name;
    const existing = byConcession.get(name) ?? { count: 0, totalValue: 0 };
    existing.count++;
    if (sc.concession.type === 'FIXED') {
      existing.totalValue += Number(sc.concession.value);
    }
    byConcession.set(name, existing);
  }

  return {
    totalConcessions: concessions.length,
    summaryByType: Array.from(byConcession.entries()).map(([name, data]) => ({ name, ...data })),
    details: concessions,
  };
}

async function getSessionSnapshot(sessionId: number) {
  const charges = await prisma.feeCharge.aggregate({
    where: { sessionId },
    _sum: { amount: true, paidAmount: true, fine: true },
  });
  return {
    totalAssigned: Number(charges._sum.amount ?? 0),
    totalCollected: Number(charges._sum.paidAmount ?? 0),
    totalFine: Number(charges._sum.fine ?? 0),
    totalOutstanding: Number(charges._sum.amount ?? 0) + Number(charges._sum.fine ?? 0) - Number(charges._sum.paidAmount ?? 0),
  };
}
