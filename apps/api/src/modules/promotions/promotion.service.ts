import { Prisma } from '@prisma/client';
import type {
  PromotionDto,
  PromotionQuery,
  CreatePromotionRuleDto,
  UpdatePromotionRuleDto,
  PromotionRuleQuery,
  SinglePromotionDto,
  BulkPromotionPreviewDto,
  BulkPromotionExecuteDto,
} from '@sms/types';
import { prisma } from '../../config/prisma';
import type { PrismaTx } from '../../config/prisma';
import { paginate, toSkipTake } from '../../shared/pagination';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors';
import type { Actor } from '../../shared/types';

const promotionInclude = {
  student: true,
  newClass: true,
  newSession: true,
  oldClass: true,
  oldSession: true,
} satisfies Prisma.PromotionInclude;

// ---- Promotion Rules ----

export async function listPromotionRules(q: PromotionRuleQuery) {
  const where: Prisma.PromotionRuleWhereInput = {
    ...(q.sessionId && { sessionId: q.sessionId }),
    ...(q.isActive !== undefined && { isActive: q.isActive }),
  };
  const [data, total] = await prisma.$transaction([
    prisma.promotionRule.findMany({ where, include: { session: true }, ...toSkipTake(q.page, q.limit), orderBy: { createdAt: 'desc' } }),
    prisma.promotionRule.count({ where }),
  ]);
  return paginate(data, total, q.page, q.limit);
}

export async function createPromotionRule(dto: CreatePromotionRuleDto, user: Actor) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${user.id}'`);
    return tx.promotionRule.create({ data: dto });
  });
}

export async function updatePromotionRule(id: number, dto: UpdatePromotionRuleDto, user: Actor) {
  const existing = await prisma.promotionRule.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('PromotionRule');
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${user.id}'`);
    return tx.promotionRule.update({ where: { id }, data: dto });
  });
}

// ---- Eligibility Engine ----

export async function evaluateStudentEligibility(
  studentId: number,
  sessionId: number,
  ruleId?: number,
  tx?: PrismaTx,
) {
  const client = tx ?? prisma;
  const reasons: string[] = [];

  if (ruleId) {
    const rule = await client.promotionRule.findUnique({ where: { id: ruleId } });
    if (rule?.feeClearanceRequired) {
      const outstanding = await client.feeCharge.findMany({
        where: { studentId, sessionId, status: { in: ['UNPAID', 'OVERDUE', 'PARTIAL'] } },
      });
      if (outstanding.length > 0) {
        const totalDue = outstanding.reduce((s, c) => s + c.amount.toNumber() + c.fine.toNumber() - c.paidAmount.toNumber(), 0);
        if (totalDue > 0) reasons.push(`Outstanding fee balance: ${totalDue.toFixed(2)}`);
      }
    }
  }

  return { eligible: reasons.length === 0, reasons };
}

// ---- Single Promotion ----

export async function promoteSingle(dto: SinglePromotionDto, user: Actor) {
  const prior = await prisma.promotion.findFirst({ where: { batchId: dto.idempotencyKey } });
  if (prior) return { batchId: dto.idempotencyKey, promoted: 1, idempotentReplay: true };

  const [targetClass, targetSession] = await Promise.all([
    prisma.class.findUnique({ where: { id: dto.newClassId } }),
    prisma.session.findUnique({ where: { id: dto.newSessionId } }),
  ]);
  if (!targetClass) throw new NotFoundError('Target class');
  if (!targetSession) throw new NotFoundError('Target session');

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${user.id}'`);
      await tx.$executeRawUnsafe(`SET LOCAL app.username = '${user.email.replace(/'/g, "''")}'`);

      const student = await tx.student.findFirst({
        where: { id: dto.studentId, deletedAt: null },
        select: { id: true, classId: true, sessionId: true },
      });
      if (!student) throw new BadRequestError('Student not found or inactive');

      if (student.classId === dto.newClassId && student.sessionId === dto.newSessionId) {
        throw new BadRequestError('Student is already in the target class and session');
      }

      await tx.promotionBatch.create({
        data: {
          id: dto.idempotencyKey,
          status: 'EXECUTED',
          promotedBy: user.email,
          remarks: dto.remarks,
        },
      });

      await tx.promotion.create({
        data: {
          studentId: student.id,
          oldClassId: student.classId,
          oldSessionId: student.sessionId,
          newClassId: dto.newClassId,
          newSessionId: dto.newSessionId,
          promotedBy: user.email,
          batchId: dto.idempotencyKey,
          remarks: dto.remarks,
        },
      });

      await tx.student.update({
        where: { id: student.id },
        data: { classId: dto.newClassId, sessionId: dto.newSessionId },
      });

      return { batchId: dto.idempotencyKey, promoted: 1, idempotentReplay: false };
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('Student was already promoted for this session');
    }
    if (err instanceof BadRequestError || err instanceof NotFoundError) {
      throw err;
    }
    throw new Error(`Promotion failed: ${(err as Error).message}`);
  }
}

// ---- Bulk Promotion Preview ----

export async function previewBulkPromotion(dto: BulkPromotionPreviewDto) {
  const students = await prisma.student.findMany({
    where: { sessionId: dto.fromSessionId, deletedAt: null, status: 'ACTIVE' },
    include: { class: true },
    orderBy: [{ classId: 'asc' }, { name: 'asc' }],
  });

  if (students.length === 0) throw new NotFoundError('Active students in source session');

  const targetClasses = await prisma.class.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
  const classIndexMap = new Map(targetClasses.map((c, i) => [c.id, i]));

  const results = [];
  for (const student of students) {
    const currentIdx = classIndexMap.get(student.classId) ?? -1;
    const nextIdx = Math.min(currentIdx + 1, targetClasses.length - 1);
    const targetClass = targetClasses[nextIdx];

    if (!targetClass) continue;

    const eligibility = await evaluateStudentEligibility(student.id, dto.fromSessionId, dto.ruleId);

    results.push({
      studentId: student.id,
      studentName: student.name,
      admissionNo: student.admissionNo,
      currentClass: student.class.name + (student.class.section ? ` (${student.class.section})` : ''),
      targetClassId: targetClass.id,
      targetClassName: targetClass.name + (targetClass.section ? ` (${targetClass.section})` : ''),
      targetSessionId: dto.toSessionId,
      eligible: eligibility.eligible,
      reasons: eligibility.reasons,
    });
  }

  return results;
}

// ---- Bulk Promotion Execute ----

export async function promoteStudents(dto: PromotionDto, user: Actor) {
  const prior = await prisma.promotion.findFirst({ where: { batchId: dto.idempotencyKey } });
  if (prior) {
    const count = await prisma.promotion.count({ where: { batchId: dto.idempotencyKey } });
    return { batchId: dto.idempotencyKey, promoted: count, idempotentReplay: true };
  }

  const [targetClass, targetSession] = await Promise.all([
    prisma.class.findUnique({ where: { id: dto.newClassId } }),
    prisma.session.findUnique({ where: { id: dto.newSessionId } }),
  ]);
  if (!targetClass) throw new NotFoundError('Target class');
  if (!targetSession) throw new NotFoundError('Target session');

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${user.id}'`);
      await tx.$executeRawUnsafe(`SET LOCAL app.username = '${user.email.replace(/'/g, "''")}'`);

      const students = await tx.student.findMany({
        where: { id: { in: dto.studentIds }, deletedAt: null },
        select: { id: true, classId: true, sessionId: true },
      });
      if (students.length !== dto.studentIds.length) {
        throw new BadRequestError('One or more students were not found or are inactive');
      }

      const toPromote = students.filter(
        (s) => s.classId !== dto.newClassId || s.sessionId !== dto.newSessionId,
      );

      await tx.promotionBatch.create({
        data: {
          id: dto.idempotencyKey,
          status: 'EXECUTED',
          promotedBy: user.email,
          remarks: dto.remarks,
        },
      });

      if (toPromote.length === 0) {
        return { batchId: dto.idempotencyKey, promoted: 0, idempotentReplay: false };
      }

      await tx.promotion.createMany({
        data: toPromote.map((s) => ({
          studentId: s.id,
          oldClassId: s.classId,
          oldSessionId: s.sessionId,
          newClassId: dto.newClassId,
          newSessionId: dto.newSessionId,
          promotedBy: user.email,
          batchId: dto.idempotencyKey,
          remarks: dto.remarks,
        })),
      });

      await tx.student.updateMany({
        where: { id: { in: toPromote.map((s) => s.id) } },
        data: { classId: dto.newClassId, sessionId: dto.newSessionId },
      });

      return { batchId: dto.idempotencyKey, promoted: toPromote.length, idempotentReplay: false };
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('One or more students were already promoted for this session');
    }
    if (err instanceof BadRequestError || err instanceof NotFoundError) {
      throw err;
    }
    throw new Error(`Bulk promotion failed: ${(err as Error).message}`);
  }
}

// ---- Bulk Preview Execute (with per-student selection) ----

export async function executeBulkPromotion(dto: BulkPromotionExecuteDto, user: Actor) {
  return promoteStudents(
    {
      studentIds: dto.studentIds,
      newClassId: dto.newClassId,
      newSessionId: dto.newSessionId,
      idempotencyKey: dto.idempotencyKey,
      remarks: dto.remarks,
    },
    user,
  );
}

// ---- Rollback ----

export async function rollbackBatch(batchId: string, user: Actor) {
  const batch = await prisma.promotionBatch.findUnique({
    where: { id: batchId },
    include: { promotions: true },
  });
  if (!batch) throw new NotFoundError('PromotionBatch');
  if (batch.status === 'ROLLED_BACK') throw new BadRequestError('Batch already rolled back');

  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${user.id}'`);
      await tx.$executeRawUnsafe(`SET LOCAL app.username = '${user.email.replace(/'/g, "''")}'`);

      for (const promo of batch.promotions) {
        await tx.student.update({
          where: { id: promo.studentId },
          data: { classId: promo.oldClassId, sessionId: promo.oldSessionId },
        });
      }

      await tx.promotionBatch.update({
        where: { id: batchId },
        data: { status: 'ROLLED_BACK', revertedAt: new Date(), revertedBy: user.email },
      });

      return { batchId, rolledBack: batch.promotions.length };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

// ---- Existing ----

export async function listPromotions(q: PromotionQuery) {
  if (q.groupBy === 'batch') {
    const [data, total] = await prisma.$transaction([
      prisma.promotionBatch.findMany({
        include: { _count: { select: { promotions: true } } },
        orderBy: { executedAt: 'desc' },
        ...toSkipTake(q.page, q.limit),
      }),
      prisma.promotionBatch.count(),
    ]);
    return paginate(data, total, q.page, q.limit);
  }

  const where: Prisma.PromotionWhereInput = {
    ...(q.studentId && { studentId: q.studentId }),
    ...(q.newClassId && { newClassId: q.newClassId }),
    ...(q.newSessionId && { newSessionId: q.newSessionId }),
  };
  const [data, total] = await prisma.$transaction([
    prisma.promotion.findMany({ where, include: promotionInclude, ...toSkipTake(q.page, q.limit), orderBy: { promotedAt: 'desc' } }),
    prisma.promotion.count({ where }),
  ]);
  return paginate(data, total, q.page, q.limit);
}
