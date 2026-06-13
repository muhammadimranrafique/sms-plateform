import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { ValidationError } from '../shared/errors';

type Target = 'body' | 'query' | 'params';

/** Validate & coerce a request segment against a Zod schema. */
export const validate =
  (schema: ZodSchema, target: Target = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse((req as any)[target]);
      // Express 5 makes query/params read-only getters, so use
      // defineProperty to shadow them instead of direct assignment.
      Object.defineProperty(req, target, {
        get: () => parsed,
        configurable: true,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw new ValidationError(
          err.issues.map((e) => ({ path: e.path.join('.'), message: e.message })),
        );
      }
      throw err;
    }
  };
