import { PrismaClient } from '@prisma/client';
import { env } from './env';

/**
 * Single PrismaClient instance. In dev we cache it on globalThis so that
 * hot-reload (tsx watch) does not exhaust the connection pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export type PrismaTx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];
