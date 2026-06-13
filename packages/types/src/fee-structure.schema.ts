import { z } from 'zod';

export const FeeHeadSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  code: z.string().min(1).max(20).trim().toUpperCase(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const FeeHeadUpdateSchema = FeeHeadSchema.partial();

export const FeeStructureItemSchema = z.object({
  feeHeadId: z.number().int().positive(),
  amount: z.coerce.number().positive().max(999_999_999),
});

export const CreateFeeStructureSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  classId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  items: z.array(FeeStructureItemSchema).min(1),
});

export const UpdateFeeStructureSchema = CreateFeeStructureSchema.partial();

export const FeeStructureQuerySchema = z.object({
  classId: z.coerce.number().int().positive().optional(),
  sessionId: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const FeeHeadQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type FeeHeadDto = z.infer<typeof FeeHeadSchema>;
export type FeeHeadUpdateDto = z.infer<typeof FeeHeadUpdateSchema>;
export type FeeStructureItemDto = z.infer<typeof FeeStructureItemSchema>;
export type CreateFeeStructureDto = z.infer<typeof CreateFeeStructureSchema>;
export type UpdateFeeStructureDto = z.infer<typeof UpdateFeeStructureSchema>;
export type FeeStructureQuery = z.infer<typeof FeeStructureQuerySchema>;
export type FeeHeadQuery = z.infer<typeof FeeHeadQuerySchema>;
