import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTx = vi.hoisted(() => ({
  $executeRawUnsafe: vi.fn(),
  student: { findMany: vi.fn(), updateMany: vi.fn() },
  promotion: { createMany: vi.fn() },
  promotionBatch: { create: vi.fn() },
}));

const mockPrisma = vi.hoisted(() => ({
  promotion: { findFirst: vi.fn(), count: vi.fn() },
  class: { findUnique: vi.fn() },
  session: { findUnique: vi.fn() },
  $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(mockTx)),
}));
vi.mock('../../config/prisma', () => ({ prisma: mockPrisma }));

import * as service from './promotion.service';
import { BadRequestError } from '../../shared/errors';

const actor = { id: 'u1', email: 'admin@sms.test', role: 'admin' as const };
const dto = {
  studentIds: [1, 2],
  newClassId: 5,
  newSessionId: 2,
  idempotencyKey: '11111111-1111-1111-1111-111111111111',
};

beforeEach(() => vi.clearAllMocks());

describe('promoteStudents', () => {
  it('replays idempotently when the batch already exists', async () => {
    mockPrisma.promotion.findFirst.mockResolvedValue({ id: 1 });
    mockPrisma.promotion.count.mockResolvedValue(2);
    const res = await service.promoteStudents(dto as never, actor);
    expect(res.idempotentReplay).toBe(true);
    expect(res.promoted).toBe(2);
  });

  it('captures each student real oldClassId/oldSessionId', async () => {
    mockPrisma.promotion.findFirst.mockResolvedValue(null);
    mockPrisma.class.findUnique.mockResolvedValue({ id: 5 });
    mockPrisma.session.findUnique.mockResolvedValue({ id: 2 });
    mockTx.student.findMany.mockResolvedValue([
      { id: 1, classId: 3, sessionId: 1 },
      { id: 2, classId: 4, sessionId: 1 },
    ]);
    const res = await service.promoteStudents(dto as never, actor);
    expect(res.promoted).toBe(2);
    expect(mockTx.promotion.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ oldClassId: 3, oldSessionId: 1 }),
        expect.objectContaining({ oldClassId: 4, oldSessionId: 1 }),
      ]),
    });
  });

  it('throws when a student is missing/inactive', async () => {
    mockPrisma.promotion.findFirst.mockResolvedValue(null);
    mockPrisma.class.findUnique.mockResolvedValue({ id: 5 });
    mockPrisma.session.findUnique.mockResolvedValue({ id: 2 });
    mockTx.student.findMany.mockResolvedValue([{ id: 1, classId: 3, sessionId: 1 }]);
    await expect(service.promoteStudents(dto as never, actor)).rejects.toBeInstanceOf(
      BadRequestError,
    );
  });
});
