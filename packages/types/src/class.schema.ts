import { z } from 'zod';

export const CreateClassSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  section: z.string().max(10).trim().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const UpdateClassSchema = CreateClassSchema.partial();

export type CreateClassDto = z.infer<typeof CreateClassSchema>;
export type UpdateClassDto = z.infer<typeof UpdateClassSchema>;
