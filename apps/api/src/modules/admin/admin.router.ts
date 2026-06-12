import { Router } from 'express';
import { authGuard, rbac } from '../../middleware/auth.middleware';
import { prisma } from '../../config/prisma';
import { ok } from '../../shared/response';
import type { AuthRequest } from '../../middleware/auth.middleware';
import type { Response } from 'express';

export const adminRouter = Router();
adminRouter.use(authGuard, rbac('admin'));

// Paginated, read-only access to the audit trail (admins only).
adminRouter.get('/audit-logs', async (req: AuthRequest, res: Response) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));
  const [rows, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count(),
  ]);
  // BigInt id -> string for JSON safety.
  const data = rows.map((r) => ({ ...r, id: r.id.toString() }));
  res.json(ok(data, { total, page, limit }));
});
