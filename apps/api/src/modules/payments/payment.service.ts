import type { ReceivePaymentDto, ReversePaymentDto, PaymentQuery } from '@sms/types';
import { prisma } from '../../config/prisma';
import type { PrismaTx } from '../../config/prisma';
import { paginate, toSkipTake } from '../../shared/pagination';
import { NotFoundError, BadRequestError, ConflictError } from '../../shared/errors';
import type { Actor } from '../../shared/types';
import { getApplicableRules, calculateLateFine } from './late-fine.service';

const PAYMENT_TX_TIMEOUT = 30_000;

async function withPaymentTx<T>(actor: Actor, fn: (tx: PrismaTx) => Promise<T>): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${actor.id}'`);
      await tx.$executeRawUnsafe(`SET LOCAL app.username = '${actor.email.replace(/'/g, "''")}'`);
      return fn(tx);
    },
    { timeout: PAYMENT_TX_TIMEOUT },
  );
}

async function ensureStudentLedger(tx: PrismaTx, studentId: number) {
  return tx.studentLedger.upsert({
    where: { studentId },
    create: { studentId, advance: 0 },
    update: {},
  });
}

async function resolveChargeIds(dto: ReceivePaymentDto, tx: PrismaTx): Promise<number[]> {
  if (dto.chargeIds && dto.chargeIds.length > 0) {
    return dto.chargeIds;
  }
  if (dto.voucherNo) {
    const voucher = await tx.voucher.findUnique({
      where: { voucherNo: dto.voucherNo },
      include: { feeCharges: { select: { id: true } } },
    });
    if (!voucher) throw new NotFoundError('Voucher');

    if (voucher.feeCharges.length > 0) {
      return voucher.feeCharges.map((c) => c.id);
    }

    const legacyCharges = await tx.feeCharge.findMany({
      where: {
        studentId: voucher.studentId,
        ...(voucher.feeMonth ? { feeMonth: voucher.feeMonth } : {}),
      },
      select: { id: true },
    });

    if (legacyCharges.length > 0) {
      return legacyCharges.map((c) => c.id);
    }

    throw new NotFoundError('FeeCharges');
  }
  throw new BadRequestError('Either voucherNo or chargeIds must be provided');
}

async function allocatePayment(
  tx: PrismaTx,
  chargeIds: number[],
  amount: number,
  paidAt: Date,
  studentId: number,
) {
  const charges = await tx.feeCharge.findMany({
    where: { id: { in: chargeIds }, studentId },
    include: { feeHead: true, session: true },
    orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
  });

  if (charges.length === 0) throw new NotFoundError('FeeCharges');

  const rules = await getApplicableRules(charges[0]!.sessionId, tx);
  const allocations: { feeChargeId: number; amount: number; finePaid: number }[] = [];
  let remaining = amount;

  for (const charge of charges) {
    if (remaining <= 0) break;

    const chargeAmount = charge.amount.toNumber();
    const existingPaid = charge.paidAmount.toNumber();
    const existingFine = charge.fine.toNumber();
    const outstanding = chargeAmount + existingFine - existingPaid;

    if (outstanding <= 0) continue;

    const fineResult = calculateLateFine(chargeAmount, existingFine, charge.dueDate, paidAt, rules, existingPaid);
    const newFine = Math.max(existingFine, fineResult.fineAmount);
    const totalOutstanding = chargeAmount + newFine - existingPaid;

    if (totalOutstanding <= 0) continue;

    if (remaining >= totalOutstanding) {
      allocations.push({
        feeChargeId: charge.id,
        amount: chargeAmount - existingPaid,
        finePaid: newFine,
      });
      remaining -= totalOutstanding;
    } else {
      const amountToCharge = Math.min(remaining, chargeAmount - existingPaid);
      const fineToPay = Math.max(0, remaining - amountToCharge);
      allocations.push({
        feeChargeId: charge.id,
        amount: amountToCharge,
        finePaid: fineToPay,
      });
      remaining = 0;
    }
  }

  return { allocations, advanceAmount: remaining };
}

function deriveChargeStatus(
  chargeAmount: number,
  fine: number,
  totalPaid: number,
  dueDate: Date,
  now: Date,
): 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' {
  const totalDue = chargeAmount + fine;
  if (totalPaid >= totalDue) return 'PAID';
  if (totalPaid > 0) return 'PARTIAL';
  if (dueDate < now) return 'OVERDUE';
  return 'UNPAID';
}

function deriveVoucherStatus(
  charges: { status: string; amount: { toNumber(): number }; paidAmount: { toNumber(): number }; fine: { toNumber(): number }; dueDate: Date | null }[],
  dueDate?: Date,
): 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED' {
  const allPaid = charges.every(
    (c) => c.paidAmount.toNumber() >= c.amount.toNumber() + c.fine.toNumber(),
  );
  if (allPaid) return 'PAID';

  const anyPaid = charges.some((c) => c.paidAmount.toNumber() > 0);
  if (anyPaid) return 'PARTIAL';

  if (dueDate && dueDate < new Date()) return 'OVERDUE';

  return 'PENDING';
}

export async function receivePayment(dto: ReceivePaymentDto, user: Actor) {
  return withPaymentTx(user, async (tx) => {
    const student = await tx.student.findFirst({
      where: { id: dto.studentId, deletedAt: null },
    });
    if (!student) throw new NotFoundError('Student');

    const chargeIds = await resolveChargeIds(dto, tx);

    const existingCharges = await tx.feeCharge.findMany({
      where: { id: { in: chargeIds }, studentId: dto.studentId },
      select: { id: true, version: true },
    });
    if (existingCharges.length !== chargeIds.length) {
      throw new BadRequestError('Some charge IDs do not belong to this student or do not exist');
    }

    const paidAt = dto.paidAt ?? new Date();

    if (dto.isAdvance) {
      const ledger = await ensureStudentLedger(tx, dto.studentId);
      const payment = await tx.payment.create({
        data: {
          studentId: dto.studentId,
          amount: dto.amount,
          method: dto.method,
          referenceNo: dto.referenceNo,
          paidAt,
          receivedBy: user.email,
          remarks: dto.remarks,
        },
      });

      await tx.studentLedger.update({
        where: { id: ledger.id },
        data: { advance: { increment: dto.amount } },
      });

      const updatedLedger = await tx.studentLedger.findUnique({
        where: { studentId: dto.studentId },
      });

      return {
        payment,
        allocations: [],
        advanceBalance: updatedLedger?.advance.toNumber() ?? dto.amount,
        voucherStatus: null,
      };
    }

    const { allocations, advanceAmount } = await allocatePayment(
      tx, chargeIds, dto.amount, paidAt, dto.studentId,
    );

    const totalAllocated = allocations.reduce((s, a) => s + a.amount + a.finePaid, 0);
    if (totalAllocated === 0 && advanceAmount === 0) {
      throw new BadRequestError('No outstanding charges to pay');
    }

    const payment = await tx.payment.create({
      data: {
        studentId: dto.studentId,
        amount: dto.amount,
        method: dto.method,
        referenceNo: dto.referenceNo,
        paidAt,
        receivedBy: user.email,
        remarks: dto.remarks,
        allocations: {
          create: allocations.filter((a) => a.amount > 0 || a.finePaid > 0).map((a) => ({
            feeChargeId: a.feeChargeId,
            amount: a.amount,
            finePaid: a.finePaid,
          })),
        },
      },
      include: { allocations: true },
    });

    for (const alloc of allocations) {
      const charge = await tx.feeCharge.findUnique({ where: { id: alloc.feeChargeId } });
      if (!charge) continue;

      const newPaidAmount = charge.paidAmount.toNumber() + alloc.amount;
      const newFine = alloc.finePaid;
      const newStatus = deriveChargeStatus(
        charge.amount.toNumber(), newFine, newPaidAmount, charge.dueDate, paidAt,
      );

      await tx.feeCharge.update({
        where: { id: alloc.feeChargeId },
        data: {
          paidAmount: newPaidAmount,
          fine: newFine,
          status: newStatus,
          version: { increment: 1 },
        },
      });
    }

    if (advanceAmount > 0) {
      const ledger = await ensureStudentLedger(tx, dto.studentId);
      await tx.studentLedger.update({
        where: { id: ledger.id },
        data: { advance: { increment: advanceAmount } },
      });
    }

    const updatedLedger = await tx.studentLedger.findUnique({
      where: { studentId: dto.studentId },
    });

    let voucherStatus = null;
    if (dto.voucherNo) {
      voucherStatus = await recomputeVoucherStatusByNo(tx, dto.voucherNo);
    } else {
      const updatedCharges = await tx.feeCharge.findMany({
        where: { id: { in: chargeIds } },
        select: { status: true, amount: true, paidAmount: true, fine: true, dueDate: true, feeHead: true, feeMonth: true, id: true },
      });
      const allCharges = await tx.feeCharge.findMany({
        where: { studentId: dto.studentId },
        select: { status: true, amount: true, paidAmount: true, fine: true, dueDate: true },
      });
      const overallStatus = deriveVoucherStatus(allCharges as any);
      voucherStatus = {
        voucherNo: null,
        status: overallStatus,
        lineItems: updatedCharges.map((c) => ({
          feeChargeId: c.id,
          feeHeadName: c.feeHead.name,
          feeMonth: c.feeMonth,
          originalAmount: c.amount.toNumber(),
          fine: c.fine.toNumber(),
          paidAmount: c.paidAmount.toNumber(),
          status: c.status,
        })),
      };
    }

    return {
      paymentId: payment.id,
      allocations: payment.allocations.map((a) => ({
        feeChargeId: a.feeChargeId,
        amount: a.amount.toNumber(),
        finePaid: a.finePaid.toNumber(),
      })),
      advanceBalance: updatedLedger?.advance.toNumber() ?? 0,
      voucherStatus,
    };
  });
}

export async function reversePayment(paymentId: number, dto: ReversePaymentDto, user: Actor) {
  return withPaymentTx(user, async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { allocations: true },
    });
    if (!payment) throw new NotFoundError('Payment');
    if (payment.status === 'REVERSED') {
      throw new ConflictError('Payment is already reversed');
    }

    for (const alloc of payment.allocations) {
      const charge = await tx.feeCharge.findUnique({ where: { id: alloc.feeChargeId } });
      if (!charge) continue;

      const newPaidAmount = charge.paidAmount.toNumber() - alloc.amount.toNumber();
      const newFine = charge.fine.toNumber() - alloc.finePaid.toNumber();

      await tx.feeCharge.update({
        where: { id: alloc.feeChargeId },
        data: {
          paidAmount: Math.max(0, newPaidAmount),
          fine: Math.max(0, newFine),
          status: deriveChargeStatus(
            charge.amount.toNumber(),
            Math.max(0, newFine),
            Math.max(0, newPaidAmount),
            charge.dueDate,
            new Date(),
          ),
          version: { increment: 1 },
        },
      });
    }

    const ledger = await tx.studentLedger.findUnique({ where: { studentId: payment.studentId } });
    const paymentAmount = payment.amount.toNumber();
    const allocatedAmount = payment.allocations.reduce((s, a) => s + a.amount.toNumber() + a.finePaid.toNumber(), 0);
    const advancePortion = paymentAmount - allocatedAmount;

    if (advancePortion > 0 && ledger && ledger.advance.toNumber() > 0) {
      await tx.studentLedger.update({
        where: { id: ledger.id },
        data: { advance: { decrement: Math.min(advancePortion, ledger.advance.toNumber()) } },
      });
    }

    if (dto.reverseReason === 'CHEQUE_BOUNCE') {
      const bounceRule = await tx.bounceFeeRule.findFirst({ where: { isActive: true } });
      if (bounceRule) {
        let bounceHead = await tx.feeHead.findFirst({ where: { code: 'BOUNCE_FEE' } });
        if (!bounceHead) {
          bounceHead = await tx.feeHead.create({
            data: { name: 'Cheque Bounce Fee', code: 'BOUNCE_FEE', sortOrder: 999 },
          });
        }

        const currentSession = await tx.session.findFirst({ where: { isCurrent: true } });
        await tx.feeCharge.create({
          data: {
            studentId: payment.studentId,
            feeHeadId: bounceHead.id,
            sessionId: currentSession?.id ?? 0,
            feeMonth: new Date().toISOString().slice(0, 7),
            amount: bounceRule.fee,
            dueDate: new Date(),
            fine: 0,
          },
        });
      }
    }

    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REVERSED',
        reversedAt: new Date(),
        reversedBy: user.email,
        remarks: dto.reason ? `${payment.remarks ?? ''} | Reversed: ${dto.reason}`.trim() : payment.remarks,
      },
    });

    return { id: paymentId, status: 'REVERSED' as const };
  });
}

export async function getPaymentHistory(studentId: number, q: PaymentQuery) {
  const student = await prisma.student.findFirst({ where: { id: studentId, deletedAt: null } });
  if (!student) throw new NotFoundError('Student');

  const [payments, total, advanceLedger] = await prisma.$transaction([
    prisma.payment.findMany({
      where: {
        studentId,
        ...(q.fromDate && { paidAt: { gte: q.fromDate } }),
        ...(q.toDate && { paidAt: { lte: q.toDate } }),
        ...(q.method && { method: q.method }),
      },
      include: {
        allocations: {
          include: { feeCharge: { include: { feeHead: true } } },
        },
      },
      orderBy: { paidAt: 'desc' },
      ...toSkipTake(q.page, q.limit),
    }),
    prisma.payment.count({ where: { studentId } }),
    prisma.studentLedger.findUnique({ where: { studentId } }),
  ]);

  const totalPaid = payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((s, p) => s + p.amount.toNumber(), 0);
  const totalReversed = payments
    .filter((p) => p.status === 'REVERSED')
    .reduce((s, p) => s + p.amount.toNumber(), 0);

  const mapped = payments.map((p) => ({
    id: p.id,
    amount: p.amount.toNumber(),
    method: p.method,
    referenceNo: p.referenceNo,
    paidAt: p.paidAt.toISOString(),
    status: p.status,
    reversedAt: p.reversedAt?.toISOString() ?? null,
    allocations: p.allocations.map((a) => ({
      feeChargeId: a.feeChargeId,
      feeHeadName: a.feeCharge.feeHead.name,
      feeMonth: a.feeCharge.feeMonth,
      originalAmount: a.feeCharge.amount.toNumber(),
      fineApplied: a.feeCharge.fine.toNumber(),
      allocatedAmount: a.amount.toNumber(),
      outstandingBefore: a.feeCharge.amount.toNumber() + a.feeCharge.fine.toNumber() - (a.feeCharge.paidAmount.toNumber() - a.amount.toNumber()),
      outstandingAfter: a.feeCharge.amount.toNumber() + a.feeCharge.fine.toNumber() - a.feeCharge.paidAmount.toNumber(),
    })),
    createdAt: p.createdAt.toISOString(),
  }));

  return {
    data: {
      studentId,
      studentName: student.name,
      advanceBalance: advanceLedger?.advance.toNumber() ?? 0,
      payments: mapped,
      totalPaid,
      totalReversed,
    },
    pagination: paginate(mapped, total, q.page, q.limit),
  };
}

export async function recomputeVoucherStatusByNo(tx: PrismaTx, voucherNo: string) {
  const voucher = await tx.voucher.findUnique({
    where: { voucherNo },
    include: {
      student: { include: { class: true } },
      feeCharges: { include: { feeHead: true } },
    },
  });
  if (!voucher) throw new NotFoundError('Voucher');

  const charges = voucher.feeCharges;
  const totalCharged = charges.reduce((s, c) => s + c.amount.toNumber(), 0);
  const totalPaid = charges.reduce((s, c) => s + c.paidAmount.toNumber(), 0);
  const totalFine = charges.reduce((s, c) => s + c.fine.toNumber(), 0);
  const balance = totalCharged + totalFine - totalPaid;

  const status = deriveVoucherStatus(charges as Parameters<typeof deriveVoucherStatus>[0], voucher.dueDate);

  await tx.voucher.update({
    where: { id: voucher.id },
    data: { status },
  });

  return {
    voucherNo: voucher.voucherNo,
    studentId: voucher.studentId,
    studentName: voucher.student.name,
    className: voucher.student.class?.name,
    totalCharged,
    totalPaid,
    totalFine,
    totalDiscount: voucher.discount.toNumber(),
    balance: Math.max(0, balance),
    status,
    lineItems: charges.map((c) => ({
      feeChargeId: c.id,
      feeHeadName: c.feeHead.name,
      feeMonth: c.feeMonth,
      originalAmount: c.amount.toNumber(),
      discountApplied: 0,
      fine: c.fine.toNumber(),
      paidAmount: c.paidAmount.toNumber(),
      outstanding: c.amount.toNumber() + c.fine.toNumber() - c.paidAmount.toNumber(),
      dueDate: c.dueDate.toISOString(),
      status: c.status,
    })),
    generatedAt: new Date().toISOString(),
  };
}

export async function getVoucherStatus(voucherNo: string) {
  return prisma.$transaction(async (tx) => {
    return recomputeVoucherStatusByNo(tx as unknown as PrismaTx, voucherNo);
  });
}

export async function recalculateVoucher(voucherNo: string, user: Actor) {
  return withPaymentTx(user, async (tx) => {
    return recomputeVoucherStatusByNo(tx, voucherNo);
  });
}
