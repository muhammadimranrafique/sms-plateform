import type { Prisma } from '@prisma/client';
import type { CreateFeePaymentDto, FeePaymentQuery } from '@sms/types';
import { prisma } from '../../config/prisma';
import { withAuditContext } from '../../shared/audit';
import { paginate, toSkipTake } from '../../shared/pagination';
import { NotFoundError, BadRequestError } from '../../shared/errors';
import type { Actor } from '../../shared/types';
import type { PrismaTx } from '../../config/prisma';

async function recalcChargeStatus(tx: PrismaTx, chargeId: number) {
  const charge = await tx.feeCharge.findUnique({ where: { id: chargeId } });
  if (!charge) return;

  const agg = await tx.feePayment.aggregate({
    where: { feeChargeId: chargeId },
    _sum: { amount: true },
  });

  const totalPaid = agg._sum.amount?.toNumber() ?? 0;
  const chargeAmount = charge.amount.toNumber();
  const totalDue = chargeAmount + charge.fine.toNumber();

  let status: string;
  if (totalPaid >= totalDue) {
    status = 'PAID';
  } else if (totalPaid > 0) {
    status = 'PARTIAL';
  } else if (charge.dueDate < new Date()) {
    status = 'OVERDUE';
  } else {
    status = 'UNPAID';
  }

  await tx.feeCharge.update({
    where: { id: chargeId },
    data: { paidAmount: totalPaid, status: status as 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' },
  });
}

export async function listPayments(q: FeePaymentQuery) {
  const where: Prisma.FeePaymentWhereInput = {
    ...(q.feeChargeId && { feeChargeId: q.feeChargeId }),
    ...(q.method && { method: q.method }),
    ...(q.fromDate && { paidAt: { gte: q.fromDate } }),
    ...(q.toDate && { paidAt: { lte: q.toDate } }),
  };
  const [data, total] = await prisma.$transaction([
    prisma.feePayment.findMany({ where, include: { feeCharge: true }, ...toSkipTake(q.page, q.limit), orderBy: { paidAt: 'desc' } }),
    prisma.feePayment.count({ where }),
  ]);
  return paginate(data, total, q.page, q.limit);
}

export async function createPayment(dto: CreateFeePaymentDto, user: Actor) {
  const charge = await prisma.feeCharge.findUnique({ where: { id: dto.feeChargeId } });
  if (!charge) throw new NotFoundError('FeeCharge');

  const chargeAmount = charge.amount.toNumber();
  const agg = await prisma.feePayment.aggregate({
    where: { feeChargeId: dto.feeChargeId },
    _sum: { amount: true },
  });
  const existingPaid = agg._sum.amount?.toNumber() ?? 0;
  const totalDue = chargeAmount + charge.fine.toNumber();

  if (existingPaid + dto.amount > totalDue) {
    throw new BadRequestError('Payment amount exceeds remaining balance');
  }

  return withAuditContext(user, async (tx) => {
    const payment = await tx.feePayment.create({
      data: { ...dto, paidAt: dto.paidAt ?? new Date(), receivedBy: user.email },
    });

    await recalcChargeStatus(tx, dto.feeChargeId);

    return tx.feePayment.findUnique({
      where: { id: payment.id },
      include: { feeCharge: true },
    });
  });
}
