import { z } from 'zod';

export const GenderSchema = z.enum(['MALE', 'FEMALE', 'OTHER']);
export const StudentStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'LEFT']);

export const CreateStudentSchema = z.object({
  admissionNo: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Alphanumeric uppercase and dashes only'),
  name: z.string().min(2).max(100).trim(),
  fatherName: z.string().min(2).max(100).trim(),
  dob: z.coerce.date().max(new Date(), 'DOB cannot be in the future').optional(),
  gender: GenderSchema.default('MALE'),
  contactNo: z
    .string()
    .regex(/^[+0-9\s-]{7,20}$/, 'Invalid phone number')
    .optional(),
  address: z.string().max(500).optional(),
  classId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  status: StudentStatusSchema.default('ACTIVE'),
});

export const UpdateStudentSchema = CreateStudentSchema.partial()
  .omit({ admissionNo: true })
  // Optimistic concurrency: client echoes the version it edited.
  .extend({ expectedUpdatedAt: z.coerce.date().optional() });

export const StudentQuerySchema = z.object({
  search: z.string().trim().optional(),
  classId: z.coerce.number().int().positive().optional(),
  sessionId: z.coerce.number().int().positive().optional(),
  status: StudentStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'admissionNo', 'createdAt']).default('name'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
});

export type Gender = z.infer<typeof GenderSchema>;
export type StudentStatus = z.infer<typeof StudentStatusSchema>;
export type CreateStudentDto = z.infer<typeof CreateStudentSchema>;
export type UpdateStudentDto = z.infer<typeof UpdateStudentSchema>;
export type StudentQuery = z.infer<typeof StudentQuerySchema>;
