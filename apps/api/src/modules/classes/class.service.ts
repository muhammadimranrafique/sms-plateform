import type { Prisma } from '@prisma/client';
import type { CreateClassDto, UpdateClassDto, ClassQuery } from '@sms/types';
import { prisma } from '../../config/prisma';
import { withAuditContext } from '../../shared/audit';
import { NotFoundError } from '../../shared/errors';
import type { Actor } from '../../shared/types';

const classInclude = { _count: { select: { students: { where: { deletedAt: null } } } } } satisfies Prisma.ClassInclude;

export async function listClasses(q?: ClassQuery) {
  const where: Prisma.ClassWhereInput = {
    ...(q?.isActive !== undefined && { isActive: q.isActive }),
  };
  return prisma.class.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: classInclude,
  });
}

export async function getClass(id: number) {
  const cls = await prisma.class.findUnique({
    where: { id },
    include: { ...classInclude, students: { where: { deletedAt: null }, take: 10, orderBy: { name: 'asc' } } },
  });
  if (!cls) throw new NotFoundError('Class');
  return cls;
}

export async function createClass(dto: CreateClassDto, user: Actor) {
  return withAuditContext(user, (tx) => tx.class.create({ data: dto }));
}

export async function updateClass(id: number, dto: UpdateClassDto, user: Actor) {
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Class');
  return withAuditContext(user, (tx) => tx.class.update({ where: { id }, data: dto }));
}

export async function deleteClass(id: number, user: Actor) {
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Class');
  await withAuditContext(user, (tx) => tx.class.update({ where: { id }, data: { isActive: false } }));
}
