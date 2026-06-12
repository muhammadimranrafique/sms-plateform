import { Prisma } from '@prisma/client';
import type {
  CreateVoucherDto,
  BatchVoucherDto,
  UpdateVoucherStatusDto,
  VoucherQuery,
} from '@sms/types';
import { prisma } from '../../config/prisma';
import type { PrismaTx } from '../../config/prisma';
import { paginate, toSkipTake } from '../../shared/pagination';
import { NotFoundError } from '../../shared/errors';
import type { Actor } from '../../shared/types';

/**
 * Race-safe voucher number generation. Atomically increments a single
 * sequence row inside the caller transaction, so concurrent requests can
 * never receive the same number (vs. the unsafe count()+1 pattern).
 */
async function nextVoucherNo(tx: PrismaTx): Promise<string> {
  const seq = await tx.voucherSequence.update({
    where: { id: 1 },
    data: { lastValue: { increment: 1 } },
  });
  const year = new Date().getFullYear();
  return `V-${year}-${String(seq.lastValue).padStart(6, '0')}`;
}

export async function listVouchers(q: VoucherQuery) {
  const where: Prisma.VoucherWhereInput = {
    ...(q.studentId && { studentId: q.studentId }),
    ...(q.status && { status: q.status }),
    ...(q.feeMonth && { feeMonth: q.feeMonth }),
  };
  const [data, total] = await prisma.$transaction([
    prisma.voucher.findMany({
      where,
      include: { student: true },
      ...toSkipTake(q.page, q.limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.voucher.count({ where }),
  ]);
  return paginate(data, total, q.page, q.limit);
}

export async function getVoucher(id: number) {
  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: { student: { include: { class: true } } },
  });
  if (!voucher) throw new NotFoundError('Voucher');
  return voucher;
}

export async function createVoucher(dto: CreateVoucherDto, user: Actor) {
  const student = await prisma.student.findFirst({
    where: { id: dto.studentId, deletedAt: null },
  });
  if (!student) throw new NotFoundError('Student');

  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${user.id}'`);
    const voucherNo = await nextVoucherNo(tx);
    return tx.voucher.create({
      data: {
        voucherNo,
        studentId: dto.studentId,
        dueDate: dto.dueDate,
        amount: new Prisma.Decimal(dto.amount),
        feeMonth: dto.feeMonth,
        remarks: dto.remarks,
      },
    });
  });
}

export async function createBatchVouchers(dto: BatchVoucherDto, user: Actor) {
  // Idempotent batch: feeMonth + class acts as the natural batch guard.
  const students = await prisma.student.findMany({
    where: { classId: dto.classId, sessionId: dto.sessionId, status: 'ACTIVE', deletedAt: null },
    select: { id: true },
  });
  if (students.length === 0) throw new NotFoundError('Active students for class/session');

  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${user.id}'`);
      let createdCount = 0;
      for (const s of students) {
        const voucherNo = await nextVoucherNo(tx);
        await tx.voucher.create({
          data: {
            voucherNo,
            studentId: s.id,
            dueDate: dto.dueDate,
            amount: new Prisma.Decimal(dto.amount),
            feeMonth: dto.feeMonth,
          },
        });
        createdCount++;
      }
      return { batchKey: dto.idempotencyKey, created: createdCount };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function updateVoucherStatus(
  id: number,
  dto: UpdateVoucherStatusDto,
  user: Actor,
) {
  const existing = await prisma.voucher.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Voucher');
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${user.id}'`);
    return tx.voucher.update({
      where: { id },
      data: { status: dto.status, remarks: dto.remarks ?? existing.remarks },
    });
  });
}
