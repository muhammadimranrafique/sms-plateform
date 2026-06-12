import * as Sentry from '@sentry/node';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prisma';
import { createApp } from './app';

async function bootstrap() {
  // 1) Observability
  if (env.SENTRY_DSN) Sentry.init({ dsn: env.SENTRY_DSN, environment: env.NODE_ENV });

  // 2) Verify DB connectivity before accepting traffic
  await prisma.$queryRaw`SELECT 1`;

  // 3) Start
  const app = createApp(env);
  const server = app.listen(env.PORT, () =>
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'API listening'),
  );

  // 4) Graceful shutdown
  const shutdown = (signal: string) => {
    logger.warn({ signal }, 'Shutting down');
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.fatal(err, 'Boot failed');
  process.exit(1);
});
