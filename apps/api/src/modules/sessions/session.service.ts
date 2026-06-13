import type { CreateSessionDto, UpdateSessionDto } from '@sms/types';
import { prisma } from '../../config/prisma';
import { withAuditContext } from '../../shared/audit';
import { NotFoundError, BadRequestError } from '../../shared/errors';
import type { Actor } from '../../shared/types';

export async function listSessions() {
  return prisma.session.findMany({ orderBy: { startDate: 'desc' } });
}

export async function getSession(id: number) {
  const session = await prisma.session.findUnique({
    where: { id },
    include: { _count: { select: { students: true } } },
  });
  if (!session) throw new NotFoundError('Session');
  return session;
}

export async function getCurrentSession() {
  const session = await prisma.session.findFirst({ where: { isCurrent: true } });
  if (!session) throw new NotFoundError('Current session');
  return session;
}

export async function createSession(dto: CreateSessionDto, user: Actor) {
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

export async function rolloverSession(currentSessionId: number, user: Actor) {
  const current = await prisma.session.findUnique({ where: { id: currentSessionId } });
  if (!current) throw new NotFoundError('Current session');

  const startYear = current.startDate.getFullYear() + 1;
  const endYear = current.endDate.getFullYear() + 1;
  const newName = `${startYear}-${endYear}`;

  const existing = await prisma.session.findUnique({ where: { name: newName } });
  if (existing) throw new BadRequestError(`Session ${newName} already exists`);

  return withAuditContext(user, async (tx) => {
    await tx.session.updateMany({ data: { isCurrent: false } });
    return tx.session.create({
      data: {
        name: newName,
        startDate: new Date(current.startDate.getTime() + 365 * 24 * 60 * 60 * 1000),
        endDate: new Date(current.endDate.getTime() + 365 * 24 * 60 * 60 * 1000),
        isCurrent: true,
      },
    });
  });
}
