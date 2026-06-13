import { prisma } from '../../config/prisma';

export async function exportDefaulterList(sessionId: number, minOverdueDays = 1) {
  const result = await prisma.$queryRaw<Array<{
    admission_no: string;
    name: string;
    father_name: string;
    class_name: string;
    contact_no: string;
    total_outstanding: string;
    overdue_days: number;
  }>>`
    SELECT
      s.admission_no,
      s.name,
      s.father_name,
      c.name as class_name,
      s.contact_no,
      COALESCE(SUM(fc.amount + fc.fine - fc.paid_amount), 0) as total_outstanding,
      EXTRACT(DAY FROM NOW() - MIN(fc.due_date))::int as overdue_days
    FROM students s
    JOIN classes c ON c.id = s.class_id
    JOIN fee_charges fc ON fc.student_id = s.id
    WHERE s.session_id = ${sessionId}
      AND s.deleted_at IS NULL
      AND fc.status IN ('UNPAID', 'OVERDUE', 'PARTIAL')
      AND fc.due_date < NOW()
    GROUP BY s.id, s.admission_no, s.name, s.father_name, s.contact_no, c.name
    HAVING EXTRACT(DAY FROM NOW() - MIN(fc.due_date))::int >= ${minOverdueDays}
    ORDER BY overdue_days DESC
  `;

  return result.map((r) => ({
    admissionNo: r.admission_no,
    studentName: r.name,
    fatherName: r.father_name,
    className: r.class_name,
    contactNo: r.contact_no,
    totalOutstanding: Number(r.total_outstanding),
    overdueDays: Number(r.overdue_days),
  }));
}

export async function exportCollectionRegister(date: string) {
  const startDate = new Date(date);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  const payments = await prisma.payment.findMany({
    where: { paidAt: { gte: startDate, lt: endDate }, status: 'COMPLETED' },
    include: {
      student: { select: { name: true, admissionNo: true, class: true } },
      allocations: { include: { feeCharge: { include: { feeHead: true } } } },
    },
    orderBy: { paidAt: 'asc' },
  });

  return {
    date,
    records: payments.map((p) => ({
      receiptNo: p.id,
      studentName: p.student.name,
      admissionNo: p.student.admissionNo,
      amount: Number(p.amount),
      method: p.method,
      referenceNo: p.referenceNo,
      paidAt: p.paidAt.toISOString(),
      receivedBy: p.receivedBy,
      feeHeads: p.allocations.map((a) => ({
        headName: a.feeCharge.feeHead.name,
        amount: Number(a.amount),
        finePaid: Number(a.finePaid),
      })),
    })),
    totals: {
      count: payments.length,
      sum: payments.reduce((s, p) => s + Number(p.amount), 0),
    },
  };
}

export function toCSV(headers: string[], rows: string[][]): string {
  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
}
