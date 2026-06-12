import { prisma, type PrismaTx } from '../config/prisma';
import type { Actor } from './types';

interface AuditEntry {
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'PROMOTE';
  tableName: string;
  recordId?: number;
  oldValues?: unknown;
  newValues?: unknown;
  requestId?: string;
}

/** Write a single app-level audit record (rich business context). */
export async function audit(actor: Actor, entry: AuditEntry, tx: PrismaTx = prisma): Promise<void> {
  await tx.auditLog.create({
    data: {
      userId: actor.id,
      username: actor.email,
      action: entry.action,
      tableName: entry.tableName,
      recordId: entry.recordId,
      oldValues: entry.oldValues === undefined ? undefined : (entry.oldValues as object),
      newValues: entry.newValues === undefined ? undefined : (entry.newValues as object),
      requestId: entry.requestId,
    },
  });
}

/**
 * Run a mutation inside a transaction that also sets the Postgres session
 * variables consumed by the DB audit trigger (guaranteed capture), then
 * returns the mutation result. Use for writes that must be attributed.
 */
export async function withAuditContext<T>(
  actor: Actor,
  fn: (tx: PrismaTx) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${actor.id}'`);
    await tx.$executeRawUnsafe(`SET LOCAL app.username = '${actor.email.replace(/'/g, "''")}'`);
    return fn(tx);
  });
}
