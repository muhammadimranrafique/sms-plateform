import type { Prisma } from '@prisma/client';
import type {
  CreateFeeStructureDto,
  UpdateFeeStructureDto,
  FeeStructureQuery,
  FeeHeadDto,
  FeeHeadUpdateDto,
  FeeHeadQuery,
} from '@sms/types';
import { prisma } from '../../config/prisma';
import { audit, withAuditContext } from '../../shared/audit';
import { paginate, toSkipTake } from '../../shared/pagination';
import { NotFoundError, ConflictError } from '../../shared/errors';
import type { Actor } from '../../shared/types';

const structureInclude = {
  class: true,
  session: true,
  items: { include: { feeHead: true } },
} satisfies Prisma.FeeStructureInclude;

export async function listFeeHeads(q: FeeHeadQuery) {
  const where: Prisma.FeeHeadWhereInput = {
    ...(q.isActive !== undefined && { isActive: q.isActive }),
    ...(q.search && {
      OR: [
        { name: { contains: q.search, mode: 'insensitive' } },
        { code: { contains: q.search, mode: 'insensitive' } },
      ],
    }),
  };
  const [data, total] = await prisma.$transaction([
    prisma.feeHead.findMany({ where, ...toSkipTake(q.page, q.limit), orderBy: { sortOrder: 'asc' } }),
    prisma.feeHead.count({ where }),
  ]);
  return paginate(data, total, q.page, q.limit);
}

export async function createFeeHead(dto: FeeHeadDto, user: Actor) {
  const exists = await prisma.feeHead.findUnique({ where: { code: dto.code } });
  if (exists) throw new ConflictError(`Fee head code '${dto.code}' already exists`);
  return withAuditContext(user, (tx) => tx.feeHead.create({ data: dto }));
}

export async function updateFeeHead(id: number, dto: FeeHeadUpdateDto, user: Actor) {
  const existing = await prisma.feeHead.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('FeeHead');
  return withAuditContext(user, (tx) => tx.feeHead.update({ where: { id }, data: dto }));
}

export async function listFeeStructures(q: FeeStructureQuery) {
  const where: Prisma.FeeStructureWhereInput = {
    ...(q.classId && { classId: q.classId }),
    ...(q.sessionId && { sessionId: q.sessionId }),
    ...(q.isActive !== undefined && { isActive: q.isActive }),
  };
  const [data, total] = await prisma.$transaction([
    prisma.feeStructure.findMany({ where, include: structureInclude, ...toSkipTake(q.page, q.limit) }),
    prisma.feeStructure.count({ where }),
  ]);
  return paginate(data, total, q.page, q.limit);
}

export async function getFeeStructure(id: number) {
  const structure = await prisma.feeStructure.findUnique({ where: { id }, include: structureInclude });
  if (!structure) throw new NotFoundError('FeeStructure');
  return structure;
}

export async function createFeeStructure(dto: CreateFeeStructureDto, user: Actor, requestId: string) {
  const existing = await prisma.feeStructure.findUnique({
    where: { classId_sessionId: { classId: dto.classId, sessionId: dto.sessionId } },
  });
  if (existing) throw new ConflictError('Fee structure already exists for this class and session');

  const structure = await withAuditContext(user, (tx) =>
    tx.feeStructure.create({
      data: {
        name: dto.name,
        classId: dto.classId,
        sessionId: dto.sessionId,
        items: { create: dto.items.map((i) => ({ feeHeadId: i.feeHeadId, amount: i.amount })) },
      },
      include: structureInclude,
    }),
  );

  await audit(user, {
    action: 'INSERT',
    tableName: 'fee_structures',
    recordId: structure.id,
    newValues: dto,
    requestId,
  });
  return structure;
}

export async function updateFeeStructure(id: number, dto: UpdateFeeStructureDto, user: Actor) {
  const existing = await prisma.feeStructure.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('FeeStructure');

  return withAuditContext(user, async (tx) => {
    if (dto.items) {
      await tx.feeStructureItem.deleteMany({ where: { feeStructureId: id } });
      await tx.feeStructureItem.createMany({
        data: dto.items.map((i) => ({ feeStructureId: id, feeHeadId: i.feeHeadId, amount: i.amount })),
      });
    }
    const { items: _ignore, ...data } = dto;
    return tx.feeStructure.update({
      where: { id },
      data,
      include: structureInclude,
    });
  });
}

export async function deleteFeeStructure(id: number, user: Actor) {
  const existing = await prisma.feeStructure.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('FeeStructure');

  await withAuditContext(user, (tx) =>
    tx.feeStructure.update({ where: { id }, data: { isActive: false } }),
  );
}
