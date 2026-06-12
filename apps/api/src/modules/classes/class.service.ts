import type { CreateClassDto, UpdateClassDto } from '@sms/types';
import { prisma } from '../../config/prisma';
import { withAuditContext } from '../../shared/audit';
import { NotFoundError } from '../../shared/errors';
import type { Actor } from '../../shared/types';

export async function listClasses() {
  return prisma.class.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { students: { where: { deletedAt: null } } } } },
  });
}

export async function createClass(dto: CreateClassDto, user: Actor) {
  return withAuditContext(user, (tx) => tx.class.create({ data: dto }));
}

export async function updateClass(id: number, dto: UpdateClassDto, user: Actor) {
  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Class');
  return withAuditContext(user, (tx) => tx.class.update({ where: { id }, data: dto }));
}
