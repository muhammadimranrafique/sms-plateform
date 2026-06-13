import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma + audit before importing the service under test.
const mockPrisma = vi.hoisted(() => ({
  student: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
}));
vi.mock('../../config/prisma', () => ({ prisma: mockPrisma }));
vi.mock('../../shared/audit', () => ({
  audit: vi.fn(),
  withAuditContext: (_actor: unknown, fn: (tx: unknown) => unknown) => fn(mockPrisma),
}));

import * as service from './student.service';
import { ConflictError, NotFoundError, PreconditionFailedError } from '../../shared/errors';

const actor = { id: 'u1', email: 'admin@sms.test', role: 'admin' as const };

beforeEach(() => vi.clearAllMocks());

describe('createStudent', () => {
  it('throws ConflictError on duplicate admissionNo', async () => {
    mockPrisma.student.findUnique.mockResolvedValue({ id: 1 });
    await expect(
      service.createStudent(
        { admissionNo: 'ADM-1', name: 'A', fatherName: 'B', classId: 1, sessionId: 1 } as never,
        actor,
        'req-1',
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('creates when admissionNo is free', async () => {
    mockPrisma.student.findUnique.mockResolvedValue(null);
    mockPrisma.student.create.mockResolvedValue({ id: 9, admissionNo: 'ADM-1' });
    const res = await service.createStudent(
      { admissionNo: 'ADM-1', name: 'A', fatherName: 'B', classId: 1, sessionId: 1 } as never,
      actor,
      'req-1',
    );
    expect(res.id).toBe(9);
  });
});

describe('updateStudent', () => {
  it('throws NotFoundError when missing', async () => {
    mockPrisma.student.findFirst.mockResolvedValue(null);
    await expect(service.updateStudent(1, {} as never, actor)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('throws PreconditionFailedError on stale write', async () => {
    const now = new Date('2025-01-01T00:00:00Z');
    mockPrisma.student.findFirst.mockResolvedValue({ id: 1, updatedAt: now });
    await expect(
      service.updateStudent(1, { expectedUpdatedAt: new Date('2024-01-01') } as never, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedError);
  });
});

describe('deleteStudent', () => {
  it('soft-deletes an existing student', async () => {
    mockPrisma.student.findFirst.mockResolvedValue({ id: 1 });
    mockPrisma.student.update.mockResolvedValue({ id: 1, deletedAt: new Date() });
    await service.deleteStudent(1, actor);
    expect(mockPrisma.student.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'LEFT' }) }),
    );
  });
});
