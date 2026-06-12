import { Prisma } from '@prisma/client';
import type { PromotionDto, PromotionQuery } from '@sms/types';
import { prisma } from '../../config/prisma';
import { paginate, toSkipTake } from '../../shared/pagination';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors';
import type { Actor } from '../../shared/types';

export async function listPromotions(q: PromotionQuery) {
  const where: Prisma.PromotionWhereInput = {
    ...(q.studentId && { studentId: q.studentId }),
    ...(q.newClassId && { newClassId: q.newClassId }),
    ...(q.newSessionId && { newSessionId: q.newSessionId }),
  };
  const [data, total] = await prisma.$transaction([
    prisma.promotion.findMany({
      where,
      include: { student: true, newClass: true, newSession: true },
      ...toSkipTake(q.page, q.limit),
      orderBy: { promotedAt: 'desc' },
    }),
    prisma.promotion.count({ where }),
  ]);
  return paginate(data, total, q.page, q.limit);
}

/**
 * Promote a batch of students into a new class/session.
 *
 * Correctness guarantees (v3):
 *  - Each student's REAL oldClassId / oldSessionId is read inside the txn
 *    (v2 hard-coded oldClassId: 0 — fixed here).
 *  - Serializable isolation prevents lost updates under concurrency.
 *  - idempotencyKey -> batchId makes a double-submit a no-op (returns prior result).
 *  - Target class & session existence validated up front.
 */
export async function promoteStudents(dto: PromotionDto, user: Actor) {
  // Idempotency: if this batch already ran, return the existing result.
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
    const result = await prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${user.id}'`);
        await tx.$executeRawUnsafe(
          `SET LOCAL app.username = '${user.email.replace(/'/g, "''")}'`,
        );

        const students = await tx.student.findMany({
          where: { id: { in: dto.studentIds }, deletedAt: null },
          select: { id: true, classId: true, sessionId: true },
        });
        if (students.length !== dto.studentIds.length) {
          throw new BadRequestError('One or more students were not found or are inactive');
        }

        let promoted = 0;
        for (const s of students) {
          // Skip no-op promotions (already in target class+session).
          if (s.classId === dto.newClassId && s.sessionId === dto.newSessionId) continue;

          await tx.promotion.create({
            data: {
              studentId: s.id,
              oldClassId: s.classId, // <-- real value, captured per student
              oldSessionId: s.sessionId, // <-- real value, captured per student
              newClassId: dto.newClassId,
              newSessionId: dto.newSessionId,
              promotedBy: user.email,
              batchId: dto.idempotencyKey,
              remarks: dto.remarks,
            },
          });
          await tx.student.update({
            where: { id: s.id },
            data: { classId: dto.newClassId, sessionId: dto.newSessionId },
          });
          promoted++;
        }
        return { batchId: dto.idempotencyKey, promoted, idempotentReplay: false };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return result;
  } catch (err) {
    // Unique violation on (studentId, oldSessionId) => already promoted this session.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('One or more students were already promoted for this session');
    }
    throw err;
  }
}
