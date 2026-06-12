import type { CreateSessionDto, UpdateSessionDto } from '@sms/types';
import { prisma } from '../../config/prisma';
import { withAuditContext } from '../../shared/audit';
import { NotFoundError } from '../../shared/errors';
import type { Actor } from '../../shared/types';

export async function listSessions() {
  return prisma.session.findMany({ orderBy: { startDate: 'desc' } });
}

export async function getCurrentSession() {
  const session = await prisma.session.findFirst({ where: { isCurrent: true } });
  if (!session) throw new NotFoundError('Current session');
  return session;
}

export async function createSession(dto: CreateSessionDto, user: Actor) {
  // Enforce single current session atomically.
  return withAuditContext(user, async (tx) => {
    if (dto.isCurrent) await tx.session.updateMany({ data: { isCurrent: false } });
    return tx.session.create({ data: dto });
  });
}

export async function updateSession(id: number, dto: UpdateSessionDto, user: Actor) {
  const existing = await prisma.session.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Session');
  return withAuditContext(user, async (tx) => {
    if (dto.isCurrent) await tx.session.updateMany({ data: { isCurrent: false } });
    return tx.session.update({ where: { id }, data: dto });
  });
}
