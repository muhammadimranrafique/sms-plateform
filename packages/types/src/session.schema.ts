import { z } from 'zod';

export const CreateSessionSchema = z
  .object({
    name: z
      .string()
      .regex(/^\d{4}-\d{4}$/, 'Format must be YYYY-YYYY (e.g. 2024-2025)'),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isCurrent: z.boolean().default(false),
  })
  .refine((s) => s.endDate > s.startDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });

export const UpdateSessionSchema = z.object({
  name: z.string().regex(/^\d{4}-\d{4}$/).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isCurrent: z.boolean().optional(),
});

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionDto = z.infer<typeof UpdateSessionSchema>;
