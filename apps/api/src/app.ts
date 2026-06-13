import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import type { ApiEnv } from '@sms/types';
import { logger } from './config/logger';
import { prisma } from './config/prisma';
import { requestId } from './middleware/requestId.middleware';
import { apiLimiter, authLimiter } from './middleware/rateLimit.middleware';
import { notFound, errorHandler } from './middleware/error.middleware';
import { swaggerRouter } from './docs/openapi';
import { studentRouter } from './modules/students/student.router';
import { classRouter } from './modules/classes/class.router';
import { sessionRouter } from './modules/sessions/session.router';
import { promotionRouter } from './modules/promotions/promotion.router';
import { voucherRouter } from './modules/vouchers/voucher.router';
import { feeStructureRouter } from './modules/fee-structures/fee-structure.router';
import { feePaymentRouter } from './modules/fee-payments/fee-payment.router';
import { discountRouter } from './modules/discounts/discount.router';
import { reportRouter } from './modules/reports/report.router';
import { adminRouter } from './modules/admin/admin.router';

export function createApp(env: ApiEnv) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(pinoHttp({ logger, customProps: (req) => ({ requestId: (req as { id?: string }).id }) }));

  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
  app.get('/readyz', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ready: true });
    } catch {
      res.status(503).json({ ready: false });
    }
  });

  app.use('/docs', swaggerRouter);

  app.use('/api/v1/auth', authLimiter);
  app.use('/api/v1', apiLimiter);

  app.use('/api/v1/students', studentRouter);
  app.use('/api/v1/classes', classRouter);
  app.use('/api/v1/sessions', sessionRouter);
  app.use('/api/v1/promotions', promotionRouter);
  app.use('/api/v1/vouchers', voucherRouter);
  app.use('/api/v1/fee-structures', feeStructureRouter);
  app.use('/api/v1/fee-payments', feePaymentRouter);
  app.use('/api/v1/discounts', discountRouter);
  app.use('/api/v1/reports', reportRouter);
  app.use('/api/v1/admin', adminRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
