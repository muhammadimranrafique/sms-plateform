import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { AppError, NotFoundError } from '../shared/errors';

/** Terminal 404 handler for unmatched routes. */
export function notFound(_req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError('Route'));
}

/** Global error handler. Express 5 forwards rejected async handlers here. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const appErr = err instanceof AppError ? err : new AppError(err?.message ?? 'Internal error');
  const status = appErr.statusCode;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const log = (req as any).log;
  if (status >= 500) {
    log?.error?.({ err }, 'Unhandled error');
    Sentry.captureException(err);
  } else {
    log?.warn?.({ code: appErr.code, message: appErr.message }, 'Handled error');
  }

  res.status(status).json({
    success: false,
    code: appErr.code,
    message: appErr.message,
    details: appErr.details ?? null,
    requestId: req.id,
  });
};
