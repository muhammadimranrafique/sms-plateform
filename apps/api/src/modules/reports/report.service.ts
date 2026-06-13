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
        _count: { classId: true },
        orderBy: { classId: 'asc' },
      }),
    ]);

  return {
    totalStudents,
    activeStudents,
    totalClasses,
    pendingVouchers,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    studentsByClass: byClass.map((b) => ({ classId: b.classId, count: (b._count as { classId: number }).classId })),
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
