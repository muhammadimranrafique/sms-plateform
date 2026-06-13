import type { Prisma } from '@prisma/client';
import type { CreateDiscountDto, UpdateDiscountDto, DiscountQuery } from '@sms/types';
import { prisma } from '../../config/prisma';
import { withAuditContext } from '../../shared/audit';
import { paginate, toSkipTake } from '../../shared/pagination';
import { NotFoundError } from '../../shared/errors';
import type { Actor } from '../../shared/types';

const discountInclude = { student: true, feeHead: true } satisfies Prisma.DiscountInclude;

export async function listDiscounts(q: DiscountQuery) {
  const where: Prisma.DiscountWhereInput = {
    ...(q.studentId && { studentId: q.studentId }),
    ...(q.isActive !== undefined && { isActive: q.isActive }),
  };
  const [data, total] = await prisma.$transaction([
    prisma.discount.findMany({ where, include: discountInclude, ...toSkipTake(q.page, q.limit), orderBy: { createdAt: 'desc' } }),
    prisma.discount.count({ where }),
  ]);
  return paginate(data, total, q.page, q.limit);
}

export async function getDiscount(id: number) {
  const discount = await prisma.discount.findUnique({ where: { id }, include: discountInclude });
  if (!discount) throw new NotFoundError('Discount');
  return discount;
}

export async function createDiscount(dto: CreateDiscountDto, user: Actor) {
  return withAuditContext(user, (tx) =>
    tx.discount.create({ data: { ...dto, approvedBy: user.email }, include: discountInclude }),
  );
}

export async function updateDiscount(id: number, dto: UpdateDiscountDto, user: Actor) {
  const existing = await prisma.discount.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Discount');
  return withAuditContext(user, (tx) =>
    tx.discount.update({ where: { id }, data: dto, include: discountInclude }),
  );
}

export async function deleteDiscount(id: number, user: Actor) {
  const existing = await prisma.discount.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Discount');
  await withAuditContext(user, (tx) => tx.discount.update({ where: { id }, data: { isActive: false } }));
}
