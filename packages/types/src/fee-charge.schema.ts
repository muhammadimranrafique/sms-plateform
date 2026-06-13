import { z } from 'zod';

export const ChargeStatusSchema = z.enum(['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE']);

export const CreateFeeChargeSchema = z.object({
  studentId: z.number().int().positive(),
  feeHeadId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  feeMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM'),
  amount: z.coerce.number().positive().max(999_999_999),
  dueDate: z.coerce.date(),
  fine: z.coerce.number().min(0).default(0),
});

export const FeeChargeQuerySchema = z.object({
  studentId: z.coerce.number().int().positive().optional(),
  sessionId: z.coerce.number().int().positive().optional(),
  feeMonth: z.string().optional(),
  status: ChargeStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ChargeStatus = z.infer<typeof ChargeStatusSchema>;
export type CreateFeeChargeDto = z.infer<typeof CreateFeeChargeSchema>;
export type FeeChargeQuery = z.infer<typeof FeeChargeQuerySchema>;
