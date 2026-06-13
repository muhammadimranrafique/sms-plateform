import { z } from 'zod';

export const CreatePromotionRuleSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  sessionId: z.number().int().positive(),
  passPercentage: z.coerce.number().min(0).max(100).default(40),
  feeClearanceRequired: z.boolean().default(true),
});

export const UpdatePromotionRuleSchema = CreatePromotionRuleSchema.partial();

export const PromotionRuleQuerySchema = z.object({
  sessionId: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePromotionRuleDto = z.infer<typeof CreatePromotionRuleSchema>;
export type UpdatePromotionRuleDto = z.infer<typeof UpdatePromotionRuleSchema>;
export type PromotionRuleQuery = z.infer<typeof PromotionRuleQuerySchema>;
