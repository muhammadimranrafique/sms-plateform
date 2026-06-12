import { z } from 'zod';

export const VoucherStatusSchema = z.enum(['PENDING', 'PAID', 'CANCELLED']);

export const CreateVoucherSchema = z.object({
  studentId: z.number().int().positive(),
  dueDate: z.coerce.date(),
  amount: z.coerce.number().positive().max(99_999_999),
  feeMonth: z.string().max(20).optional(),
  remarks: z.string().max(500).optional(),
});

export const BatchVoucherSchema = z.object({
  classId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  dueDate: z.coerce.date(),
  amount: z.coerce.number().positive().max(99_999_999),
  feeMonth: z.string().max(20).optional(),
  idempotencyKey: z.string().uuid(),
});

export const UpdateVoucherStatusSchema = z.object({
  status: VoucherStatusSchema,
  remarks: z.string().max(500).optional(),
});

export const VoucherQuerySchema = z.object({
  studentId: z.coerce.number().int().positive().optional(),
  status: VoucherStatusSchema.optional(),
  feeMonth: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type VoucherStatus = z.infer<typeof VoucherStatusSchema>;
export type CreateVoucherDto = z.infer<typeof CreateVoucherSchema>;
export type BatchVoucherDto = z.infer<typeof BatchVoucherSchema>;
export type UpdateVoucherStatusDto = z.infer<typeof UpdateVoucherStatusSchema>;
export type VoucherQuery = z.infer<typeof VoucherQuerySchema>;
