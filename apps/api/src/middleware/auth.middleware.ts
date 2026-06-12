import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@sms/types';
import { supabaseAdmin } from '../config/supabase';
import { UnauthorizedError, ForbiddenError } from '../shared/errors';
import type { Actor } from '../shared/types';

export interface AuthRequest extends Request {
  user?: Actor;
}

/** Verify the bearer token via Supabase and attach the actor. */
export async function authGuard(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new UnauthorizedError('Missing bearer token');

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) throw new UnauthorizedError('Invalid or expired token');

  // SECURITY: role comes from app_metadata (service-role controlled),
  // never user_metadata (which the end user can edit).
  const role = (user.app_metadata?.role as Role | undefined) ?? 'viewer';
  req.user = { id: user.id, email: user.email ?? 'unknown', role };
  next();
}

/** Restrict a route to the given roles. */
export const rbac =
  (...allowed: Role[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !allowed.includes(req.user.role)) throw new ForbiddenError();
    next();
  };
