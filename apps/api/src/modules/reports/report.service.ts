import { prisma } from '../../config/prisma';

export async function getDashboardStats() {
  const [totalStudents, activeStudents, totalClasses, pendingVouchers, byClass] =
    await prisma.$transaction([
      prisma.student.count({ where: { deletedAt: null } }),
      prisma.student.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      prisma.class.count({ where: { isActive: true } }),
      prisma.voucher.count({ where: { status: 'PENDING' } }),
      prisma.student.groupBy({
        by: ['classId'],
        where: { deletedAt: null, status: 'ACTIVE' },
        _count: { _all: true },
      }),
    ]);

  return {
    totalStudents,
    activeStudents,
    totalClasses,
    pendingVouchers,
    studentsByClass: byClass.map((b) => ({ classId: b.classId, count: b._count._all })),
  };
}

export async function getFeeCollection(month?: string) {
  const where = month ? { feeMonth: month } : {};
  const [paid, pending] = await prisma.$transaction([
    prisma.voucher.aggregate({ where: { ...where, status: 'PAID' }, _sum: { amount: true } }),
    prisma.voucher.aggregate({ where: { ...where, status: 'PENDING' }, _sum: { amount: true } }),
  ]);
  return {
    month: month ?? 'all',
    collected: Number(paid._sum.amount ?? 0),
    outstanding: Number(pending._sum.amount ?? 0),
  };
}
