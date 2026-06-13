import { z } from 'zod';

export const BatchStatusSchema = z.enum(['EXECUTED', 'ROLLED_BACK']);

export const BulkPromotionPreviewSchema = z.object({
  fromSessionId: z.number().int().positive(),
  toSessionId: z.number().int().positive(),
  ruleId: z.number().int().positive().optional(),
});

export const BulkPromotionExecuteSchema = z.object({
  studentIds: z.array(z.number().int().positive()).min(1).max(500),
  newClassId: z.number().int().positive(),
  newSessionId: z.number().int().positive(),
  idempotencyKey: z.string().uuid(),
  ruleId: z.number().int().positive().optional(),
  remarks: z.string().max(500).optional(),
});

export const SinglePromotionSchema = z.object({
  studentId: z.number().int().positive(),
  newClassId: z.number().int().positive(),
  newSessionId: z.number().int().positive(),
  idempotencyKey: z.string().uuid(),
  remarks: z.string().max(500).optional(),
});

export type BatchStatus = z.infer<typeof BatchStatusSchema>;
export type BulkPromotionPreviewDto = z.infer<typeof BulkPromotionPreviewSchema>;
export type BulkPromotionExecuteDto = z.infer<typeof BulkPromotionExecuteSchema>;
export type SinglePromotionDto = z.infer<typeof SinglePromotionSchema>;
