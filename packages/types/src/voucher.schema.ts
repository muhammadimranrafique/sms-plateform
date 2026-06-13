import { z } from 'zod';

export const VoucherStatusSchema = z.enum(['PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED']);

export const CreateVoucherLineSchema = z.object({
  feeHeadId: z.number().int().positive(),
  description: z.string().max(200).optional(),
  amount: z.coerce.number().positive().max(999_999_999),
});

export const CreateVoucherSchema = z.object({
  studentId: z.number().int().positive(),
  dueDate: z.coerce.date(),
  feeMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format must be YYYY-MM').optional(),
  lines: z.array(CreateVoucherLineSchema).min(1),
  remarks: z.string().max(500).optional(),
});

export const BatchVoucherSchema = z.object({
  classId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  dueDate: z.coerce.date(),
  feeMonth: z.string().regex(/^\d{4}-\d{2}$/),
  idempotencyKey: z.string().uuid(),
  remarks: z.string().max(500).optional(),
});

export const GenerateVoucherSchema = z.object({
  studentId: z.number().int().positive(),
  feeMonth: z.string().regex(/^\d{4}-\d{2}$/),
  dueDate: z.coerce.date(),
  remarks: z.string().max(500).optional(),
});

export const GenerateBatchVoucherSchema = z.object({
  classId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  feeMonth: z.string().regex(/^\d{4}-\d{2}$/),
  dueDate: z.coerce.date(),
  idempotencyKey: z.string().uuid(),
  remarks: z.string().max(500).optional(),
});

export const GenerateAllMonthsVoucherSchema = z.object({
  studentId: z.number().int().positive(),
  dueDate: z.coerce.date(),
  remarks: z.string().max(500).optional(),
});

export const UpdateVoucherStatusSchema = z.object({
  status: VoucherStatusSchema,
  remarks: z.string().max(500).optional(),
});

export const VoucherQuerySchema = z.object({
  studentId: z.coerce.number().int().positive().optional(),
  classId: z.coerce.number().int().positive().optional(),
  sessionId: z.coerce.number().int().positive().optional(),
  status: VoucherStatusSchema.optional(),
  feeMonth: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'amount', 'voucherDate']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type VoucherStatus = z.infer<typeof VoucherStatusSchema>;
export type CreateVoucherLineDto = z.infer<typeof CreateVoucherLineSchema>;
export type CreateVoucherDto = z.infer<typeof CreateVoucherSchema>;
export type BatchVoucherDto = z.infer<typeof BatchVoucherSchema>;
export type GenerateVoucherDto = z.infer<typeof GenerateVoucherSchema>;
export type GenerateBatchVoucherDto = z.infer<typeof GenerateBatchVoucherSchema>;
export type GenerateAllMonthsVoucherDto = z.infer<typeof GenerateAllMonthsVoucherSchema>;
export type UpdateVoucherStatusDto = z.infer<typeof UpdateVoucherStatusSchema>;
export type VoucherQuery = z.infer<typeof VoucherQuerySchema>;
