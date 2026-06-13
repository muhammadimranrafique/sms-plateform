import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  feeCharge: { aggregate: vi.fn(), findMany: vi.fn() },
  studentLedger: { findUnique: vi.fn() },
  voucher: { findMany: vi.fn() },
  student: { count: vi.fn(), findFirst: vi.fn() },
  payment: { findMany: vi.fn() },
  defaulterAlert: { count: vi.fn() },
  $queryRaw: vi.fn(),
  $executeRawUnsafe: vi.fn(),
}));
vi.mock('../../config/prisma', () => ({ prisma: mockPrisma }));

import * as service from './aggregation.service';
import { NotFoundError } from '../../shared/errors';

beforeEach(() => vi.clearAllMocks());

describe('getStudentFeeSummary', () => {
  it('computes summary from charge aggregates', async () => {
    mockPrisma.feeCharge.aggregate.mockResolvedValue({
      _sum: { amount: 10000, paidAmount: 6000, fine: 500 },
    });
    mockPrisma.studentLedger.findUnique.mockResolvedValue({ advance: 2000 });
    mockPrisma.voucher.findMany.mockResolvedValue([
      { id: 1, status: 'PENDING' },
      { id: 2, status: 'PAID' },
      { id: 3, status: 'OVERDUE' },
    ]);

    const res = await service.getStudentFeeSummary(1);
    expect(res.totalAssigned).toBe(10000);
    expect(res.totalPaid).toBe(6000);
    expect(res.totalFine).toBe(500);
    expect(res.advanceBalance).toBe(2000);
    expect(res.pendingCount).toBe(1);
    expect(res.overdueCount).toBe(1);
    expect(res.collectionRate).toBe(60);
  });

  it('handles zero charges gracefully', async () => {
    mockPrisma.feeCharge.aggregate.mockResolvedValue({
      _sum: { amount: null, paidAmount: null, fine: null },
    });
    mockPrisma.studentLedger.findUnique.mockResolvedValue(null);
    mockPrisma.voucher.findMany.mockResolvedValue([]);

    const res = await service.getStudentFeeSummary(1);
    expect(res.collectionRate).toBe(0);
    expect(res.advanceBalance).toBe(0);
  });
});

describe('getClassFeeSummary', () => {
  it('throws NotFoundError for missing class', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);
    await expect(service.getClassFeeSummary(999, 1)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns formatted summary for valid class', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{
      class_name: 'Class 1',
      student_count: 30,
      total_assigned: '50000',
      total_collected: '35000',
      total_outstanding: '15000',
      paid_count: 20,
      partial_count: 5,
      unpaid_count: 3,
      overdue_count: 2,
    }]);

    const res = await service.getClassFeeSummary(1, 1);
    expect(res.className).toBe('Class 1');
    expect(res.studentCount).toBe(30);
    expect(res.collectionRate).toBe(70);
  });
});

describe('getInstitutionKPI', () => {
  it('aggregates institution-wide metrics', async () => {
    mockPrisma.feeCharge.aggregate.mockResolvedValue({
      _sum: { amount: 100000, paidAmount: 65000, fine: 3000 },
    });
    mockPrisma.student.count.mockResolvedValue(200);
    mockPrisma.defaulterAlert.count.mockResolvedValue(15);
    mockPrisma.feeCharge.aggregate
      .mockResolvedValueOnce({ _sum: { amount: 100000, paidAmount: 65000, fine: 3000 } })
      .mockResolvedValueOnce({ _sum: { amount: 20000, paidAmount: 5000, fine: 1000 } });

    const res = await service.getInstitutionKPI(1);
    expect(res.totalStudents).toBe(200);
    expect(res.collectionRate).toBe(65);
    expect(res.activeDefaulters).toBe(15);
  });
});

describe('getDailyRegister', () => {
  it('summarizes payments by method', async () => {
    const dec = (n: number) => ({ toNumber: () => n, valueOf: () => n });
    const mockPayment = (method: string, amount: number) => ({
      id: 1, amount: dec(amount), method, status: 'COMPLETED',
      paidAt: new Date(), student: { name: 'A', admissionNo: '001' },
      createdAt: new Date(), referenceNo: null, receivedBy: null,
      remarks: null, reversedAt: null, reversedBy: null, studentId: 1,
      allocations: [],
    });

    mockPrisma.payment.findMany.mockResolvedValue([
      mockPayment('CASH', 1000),
      mockPayment('BANK_TRANSFER', 2500),
      mockPayment('CASH', 500),
    ]);

    const res = await service.getDailyRegister('2026-06-14');
    expect(res.totals.cashTotal).toBe(1500);
    expect(res.totals.bankTransferTotal).toBe(2500);
    expect(res.transactionCount).toBe(3);
  });
});

describe('getHeadWiseBreakdown', () => {
  it('returns breakdown with percentages', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([
      { head_id: 1, head_name: 'Tuition', head_code: 'TUIT', total_assigned: '60000', total_collected: '40000' },
      { head_id: 2, head_name: 'Transport', head_code: 'TRANS', total_assigned: '20000', total_collected: '15000' },
    ]);

    const res = await service.getHeadWiseBreakdown(1);
    expect(res).toHaveLength(2);
    expect(res[0].feeHeadName).toBe('Tuition');
    expect(res[0].percentageOfTotal).toBe(75);
    expect(res[1].percentageOfTotal).toBe(25);
  });
});
