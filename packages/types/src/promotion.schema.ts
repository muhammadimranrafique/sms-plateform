import { z } from 'zod';

export const PromotionSchema = z.object({
  studentIds: z.array(z.number().int().positive()).min(1).max(500),
  newClassId: z.number().int().positive(),
  newSessionId: z.number().int().positive(),
  // NOTE: oldSessionId / oldClassId are DERIVED server-side per student.
  // They are intentionally NOT accepted from the client (prevents inconsistent records).
  idempotencyKey: z.string().uuid(),
  remarks: z.string().max(500).optional(),
});

export const PromotionQuerySchema = z.object({
  studentId: z.coerce.number().int().positive().optional(),
  newClassId: z.coerce.number().int().positive().optional(),
  newSessionId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PromotionDto = z.infer<typeof PromotionSchema>;
export type PromotionQuery = z.infer<typeof PromotionQuerySchema>;
