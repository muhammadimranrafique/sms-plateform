import { Prisma } from '@prisma/client';
import type {
  CreateVoucherDto,
  GenerateVoucherDto,
  GenerateBatchVoucherDto,
  GenerateAllMonthsVoucherDto,
  UpdateVoucherStatusDto,
  VoucherQuery,
} from '@sms/types';
import { prisma } from '../../config/prisma';
import type { PrismaTx } from '../../config/prisma';
import { paginate, toSkipTake } from '../../shared/pagination';
import { NotFoundError, BadRequestError } from '../../shared/errors';
import type { Actor } from '../../shared/types';

async function validateFeeStructureExists(tx: PrismaTx, classId: number, sessionId: number): Promise<void> {
  const exists = await tx.feeStructure.findUnique({
    where: { classId_sessionId: { classId, sessionId } },
    select: { id: true },
  });
  if (!exists) {
    const cls = await tx.class.findUnique({ where: { id: classId }, select: { name: true, section: true } });
    const sess = await tx.session.findUnique({ where: { id: sessionId }, select: { name: true } });
    const classLabel = cls ? `${cls.name}${cls.section ? ` - ${cls.section}` : ''}` : `ID ${classId}`;
    const sessionLabel = sess?.name ?? `ID ${sessionId}`;
    throw new BadRequestError(
      `No fee structure defined for class "${classLabel}" and session "${sessionLabel}". Create one in Fee Structures first.`,
    );
  }
}

async function nextVoucherNo(tx: PrismaTx): Promise<string> {
  const seq = await tx.voucherSequence.update({
    where: { id: 1 },
    data: { lastValue: { increment: 1 } },
  });
  const year = new Date().getFullYear();
  return `V-${year}-${String(seq.lastValue).padStart(6, '0')}`;
}

const voucherInclude = {
  student: { include: { class: true } },
  lines: { include: { feeHead: true } },
} satisfies Prisma.VoucherInclude;

async function computeVoucherAmounts(
  studentId: number,
  sessionId: number,
  classId: number,
  _feeMonth: string,
  dueDate: Date,
  tx: PrismaTx,
) {
  const feeStructure = await tx.feeStructure.findUnique({
    where: { classId_sessionId: { classId, sessionId } },
    include: { items: { include: { feeHead: true } } },
  });

  if (!feeStructure) {
    const cls = await tx.class.findUnique({ where: { id: classId }, select: { name: true, section: true } });
    const sess = await tx.session.findUnique({ where: { id: sessionId }, select: { name: true } });
    const classLabel = cls ? `${cls.name}${cls.section ? ` - ${cls.section}` : ''}` : `ID ${classId}`;
    const sessionLabel = sess?.name ?? `ID ${sessionId}`;
    throw new BadRequestError(
      `No fee structure defined for class "${classLabel}" and session "${sessionLabel}". Create one in Fee Structures first.`,
    );
  }

  const lines = feeStructure.items.map((item) => ({
    feeHeadId: item.feeHeadId,
    description: item.feeHead.name,
    amount: item.amount,
  }));

  const totalAmount = lines.reduce((s, l) => s + l.amount.toNumber(), 0);

  const discounts = await tx.discount.findMany({
    where: { studentId, isActive: true, validFrom: { lte: dueDate }, OR: [{ validUntil: null }, { validUntil: { gte: dueDate } }] },
  });

  let discountAmount = 0;
  for (const d of discounts) {
    if (d.type === 'PERCENTAGE') {
      if (d.feeHeadId) {
        const line = lines.find((l) => l.feeHeadId === d.feeHeadId);
        if (line) discountAmount += line.amount.toNumber() * d.value.toNumber() / 100;
      } else {
        discountAmount += totalAmount * d.value.toNumber() / 100;
      }
    } else {
      discountAmount += d.value.toNumber();
    }
  }

  const arrears = await tx.feeCharge.findMany({
    where: { studentId, sessionId, status: { in: ['UNPAID', 'OVERDUE', 'PARTIAL'] } },
  });

  const arrearsAmount = arrears.reduce((s, c) => s + c.amount.toNumber() + c.fine.toNumber() - c.paidAmount.toNumber(), 0);
  const netAmount = Math.max(0, totalAmount - discountAmount + arrearsAmount);

  return { lines, totalAmount, discountAmount, arrearsAmount, netAmount };
}

export async function listVouchers(q: VoucherQuery) {
  const where: Prisma.VoucherWhereInput = {
    ...(q.studentId && { studentId: q.studentId }),
    ...(q.status && { status: q.status }),
    ...(q.feeMonth && { feeMonth: q.feeMonth }),
    ...(q.classId && { student: { classId: q.classId } }),
    ...(q.sessionId && { student: { sessionId: q.sessionId } }),
    ...(q.fromDate && { voucherDate: { gte: q.fromDate } }),
    ...(q.toDate && { voucherDate: { lte: q.toDate } }),
  };
  const [data, total] = await prisma.$transaction([
    prisma.voucher.findMany({ where, include: voucherInclude, ...toSkipTake(q.page, q.limit), orderBy: { [q.sortBy]: q.sortDir } }),
    prisma.voucher.count({ where }),
  ]);
  return paginate(data, total, q.page, q.limit);
}

export async function getVoucher(id: number) {
  const voucher = await prisma.voucher.findUnique({ where: { id }, include: voucherInclude });
  if (!voucher) throw new NotFoundError('Voucher');
  return voucher;
}

export async function createVoucher(dto: CreateVoucherDto, user: Actor) {
  const student = await prisma.student.findFirst({ where: { id: dto.studentId, deletedAt: null } });
  if (!student) throw new NotFoundError('Student');

  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${user.id}'`);
    const voucherNo = await nextVoucherNo(tx);
    const totalAmount = dto.lines.reduce((s, l) => s + l.amount, 0);

    return tx.voucher.create({
      data: {
        voucherNo,
        studentId: dto.studentId,
        dueDate: dto.dueDate,
        amount: new Prisma.Decimal(totalAmount),
        netAmount: new Prisma.Decimal(totalAmount),
        feeMonth: dto.feeMonth,
        remarks: dto.remarks,
        lines: {
          create: dto.lines.map((l) => ({
            feeHeadId: l.feeHeadId,
            description: l.description,
            amount: new Prisma.Decimal(l.amount),
          })),
        },
      },
      include: voucherInclude,
    });
  });
}

export async function generateVoucher(dto: GenerateVoucherDto, user: Actor) {
  const student = await prisma.student.findFirst({ where: { id: dto.studentId, deletedAt: null } });
  if (!student) throw new NotFoundError('Student');

  await validateFeeStructureExists(prisma as unknown as PrismaTx, student.classId, student.sessionId);

  return prisma.$transaction(
    async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${user.id}'`);

    const existing = await tx.voucher.findFirst({
      where: { studentId: dto.studentId, feeMonth: dto.feeMonth },
    });
    if (existing) return existing;

    const voucherNo = await nextVoucherNo(tx);
    const fine = 0;

    const computed = await computeVoucherAmounts(dto.studentId, student.sessionId, student.classId, dto.feeMonth, dto.dueDate, tx);

    const voucher = await tx.voucher.create({
      data: {
        voucherNo,
        studentId: dto.studentId,
        dueDate: dto.dueDate,
        amount: new Prisma.Decimal(computed.totalAmount),
        lateFine: new Prisma.Decimal(fine),
        discount: new Prisma.Decimal(computed.discountAmount),
        arrears: new Prisma.Decimal(computed.arrearsAmount),
        netAmount: new Prisma.Decimal(computed.netAmount),
        feeMonth: dto.feeMonth,
        remarks: dto.remarks,
        lines: {
          create: computed.lines.map((l) => ({
            feeHeadId: l.feeHeadId,
            description: l.description,
            amount: l.amount,
          })),
        },
      },
    });

    await tx.feeCharge.createMany({
      data: computed.lines.map((l) => ({
        studentId: dto.studentId,
        feeHeadId: l.feeHeadId,
        sessionId: student.sessionId,
        voucherId: voucher.id,
        feeMonth: dto.feeMonth,
        amount: l.amount,
        dueDate: dto.dueDate,
        fine,
      })),
    });

    return tx.voucher.findUnique({
      where: { id: voucher.id },
      include: voucherInclude,
    });
  }, { timeout: 15000 });
}

export async function generateBatchVouchers(dto: GenerateBatchVoucherDto, user: Actor) {
  const students = await prisma.student.findMany({
    where: { classId: dto.classId, sessionId: dto.sessionId, status: 'ACTIVE', deletedAt: null },
    select: { id: true },
  });
  if (students.length === 0) throw new NotFoundError('Active students for class/session');

  await validateFeeStructureExists(prisma as unknown as PrismaTx, dto.classId, dto.sessionId);

  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${user.id}'`);
      let created = 0;

      for (const s of students) {
        const existing = await tx.voucher.findFirst({
          where: { studentId: s.id, feeMonth: dto.feeMonth },
        });
        if (existing) continue;

        const student = await tx.student.findUnique({ where: { id: s.id }, select: { classId: true, sessionId: true } });
        if (!student) continue;

        const computed = await computeVoucherAmounts(s.id, student.sessionId, student.classId, dto.feeMonth, dto.dueDate, tx);
        const voucherNo = await nextVoucherNo(tx);
        const fine = 0;

        const voucher = await tx.voucher.create({
          data: {
            voucherNo,
            studentId: s.id,
            dueDate: dto.dueDate,
            amount: new Prisma.Decimal(computed.totalAmount),
            lateFine: new Prisma.Decimal(fine),
            discount: new Prisma.Decimal(computed.discountAmount),
            arrears: new Prisma.Decimal(computed.arrearsAmount),
            netAmount: new Prisma.Decimal(computed.netAmount),
            feeMonth: dto.feeMonth,
            remarks: dto.remarks,
            lines: {
              create: computed.lines.map((l) => ({
                feeHeadId: l.feeHeadId,
                description: l.description,
                amount: l.amount,
              })),
            },
          },
        });

        await tx.feeCharge.createMany({
          data: computed.lines.map((l) => ({
            studentId: s.id,
            feeHeadId: l.feeHeadId,
            sessionId: student.sessionId,
            voucherId: voucher.id,
            feeMonth: dto.feeMonth,
            amount: l.amount,
            dueDate: dto.dueDate,
            fine,
          })),
        });
        created++;
      }
      return { batchKey: dto.idempotencyKey, created };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 },
  );
}

export async function generateAllMonths(dto: GenerateAllMonthsVoucherDto, user: Actor) {
  const student = await prisma.student.findFirst({ where: { id: dto.studentId, deletedAt: null } });
  if (!student) throw new NotFoundError('Student');

  await validateFeeStructureExists(prisma as unknown as PrismaTx, student.classId, student.sessionId);

  const allMonths: GenerateVoucherDto[] = [];
  const date = new Date(dto.dueDate);
  for (let m = 0; m < 12; m++) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    allMonths.push({
      studentId: dto.studentId,
      feeMonth: `${year}-${month}`,
      dueDate: dto.dueDate,
      remarks: dto.remarks,
    });
    date.setMonth(date.getMonth() + 1);
  }

  const results = [];
  for (const monthDto of allMonths) {
    const voucher = await generateVoucher(monthDto, user);
    results.push(voucher);
  }
  return { studentId: dto.studentId, generated: results.length, months: results };
}

export async function createBatchVouchersLegacy(dto: { classId: number; sessionId: number; dueDate: Date; amount: number; feeMonth?: string; idempotencyKey: string }, user: Actor) {
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
            netAmount: new Prisma.Decimal(dto.amount),
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

export async function updateVoucherStatus(id: number, dto: UpdateVoucherStatusDto, user: Actor) {
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
