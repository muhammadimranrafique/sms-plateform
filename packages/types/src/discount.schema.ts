import { z } from 'zod';

export const DiscountTypeSchema = z.enum(['PERCENTAGE', 'FIXED']);

export const CreateDiscountSchema = z.object({
  studentId: z.number().int().positive(),
  feeHeadId: z.number().int().positive().optional(),
  type: DiscountTypeSchema.default('PERCENTAGE'),
  value: z.coerce.number().positive().max(999_999_999),
  reason: z.string().max(500).optional(),
  approvedBy: z.string().max(100).optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
});

export const UpdateDiscountSchema = CreateDiscountSchema.partial();

export const DiscountQuerySchema = z.object({
  studentId: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type DiscountType = z.infer<typeof DiscountTypeSchema>;
export type CreateDiscountDto = z.infer<typeof CreateDiscountSchema>;
export type UpdateDiscountDto = z.infer<typeof UpdateDiscountSchema>;
export type DiscountQuery = z.infer<typeof DiscountQuerySchema>;
