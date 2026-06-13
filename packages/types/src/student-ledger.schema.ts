import { z } from 'zod';

export const StudentLedgerSchema = z.object({
  studentId: z.number().int().positive(),
  advance: z.coerce.number().min(0).default(0),
});

export type StudentLedgerDto = z.infer<typeof StudentLedgerSchema>;
