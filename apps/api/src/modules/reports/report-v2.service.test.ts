import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  student: { findFirst: vi.fn() },
  feeCharge: { findMany: vi.fn(), aggregate: vi.fn() },
  payment: { findMany: vi.fn() },
  discount: { findMany: vi.fn() },
  studentConcession: { findMany: vi.fn() },
  studentLedger: { findUnique: vi.fn() },
  $queryRaw: vi.fn(),
}));
vi.mock('../../config/prisma', () => ({ prisma: mockPrisma }));

import * as service from './report-v2.service';
import { NotFoundError } from '../../shared/errors';

beforeEach(() => vi.clearAllMocks());

describe('getStudentLedger', () => {
  const mockStudent = {
    id: 1, name: 'Ali', admissionNo: 'S001',
    class: { name: 'Class 1' }, session: { name: '2026' },
  };

  it('returns full ledger with summary', async () => {
    const dec = (n: number) => ({ toNumber: () => n, valueOf: () => n });
    mockPrisma.student.findFirst.mockResolvedValue(mockStudent);
    mockPrisma.feeCharge.findMany.mockResolvedValue([
      { id: 1, amount: dec(5000), fine: dec(200), paidAmount: dec(5000), feeHead: { name: 'Tuition' }, dueDate: new Date(), feeMonth: '2026-01' },
      { id: 2, amount: dec(3000), fine: dec(0), paidAmount: dec(1000), feeHead: { name: 'Transport' }, dueDate: new Date(), feeMonth: '2026-01' },
    ]);
    mockPrisma.payment.findMany.mockResolvedValue([]);
    mockPrisma.discount.findMany.mockResolvedValue([{ value: dec(500) }]);
    mockPrisma.studentConcession.findMany.mockResolvedValue([]);
    mockPrisma.studentLedger.findUnique.mockResolvedValue({ advance: 2000 });

    const res = await service.getStudentLedger(1);
    expect(res.student.name).toBe('Ali');
    expect(res.summary.totalCharged).toBe(8000);
    expect(res.summary.totalPaid).toBe(6000);
    expect(res.summary.totalFine).toBe(200);
    expect(res.summary.outstandingBalance).toBe(2200);
    expect(res.summary.advanceBalance).toBe(2000);
    expect(res.charges).toHaveLength(2);
  });

  it('throws NotFoundError for missing student', async () => {
    mockPrisma.student.findFirst.mockResolvedValue(null);
    await expect(service.getStudentLedger(999)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('getConcessionReport', () => {
  it('groups concessions by type', async () => {
    const dec = (n: number) => ({ toNumber: () => n, valueOf: () => n });
    mockPrisma.studentConcession.findMany.mockResolvedValue([
      {
        concession: { name: 'Sibling Concession', type: 'FIXED', value: dec(1000) },
        student: { name: 'A', admissionNo: 'S1', class: { name: 'Class 1' } },
        feeHead: { name: 'Tuition' },
      },
      {
        concession: { name: 'Sibling Concession', type: 'FIXED', value: dec(1000) },
        student: { name: 'B', admissionNo: 'S2', class: { name: 'Class 2' } },
        feeHead: null,
      },
      {
        concession: { name: 'Merit Scholarship', type: 'PERCENTAGE', value: dec(50) },
        student: { name: 'C', admissionNo: 'S3', class: { name: 'Class 1' } },
        feeHead: { name: 'Tuition' },
      },
    ]);

    const res = await service.getConcessionReport(1);
    expect(res.totalConcessions).toBe(3);
    expect(res.summaryByType).toHaveLength(2);
    const sibling = res.summaryByType.find((s: any) => s.name === 'Sibling Concession');
    expect(sibling?.count).toBe(2);
    expect(sibling?.totalValue).toBe(2000);
  });
});

describe('getDefaulterList', () => {
  it('returns mapped defaulter rows', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      {
        student_id: 1, admission_no: 'S001', name: 'Ali', father_name: 'Khan',
        contact_no: '03001234567', address: 'Lahore', class_name: 'Class 1',
        total_outstanding: '5000', overdue_days: 45,
      },
    ]);

    const res = await service.getDefaulterList(1, 30, 1, 10);
    expect(res).toHaveLength(1);
    expect(res[0].studentId).toBe(1);
    expect(res[0].overdueDays).toBe(45);
    expect(res[0].totalOutstanding).toBe(5000);
  });
});
