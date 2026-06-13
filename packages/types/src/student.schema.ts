import { z } from 'zod';

export const GenderSchema = z.enum(['MALE', 'FEMALE', 'OTHER']);
export const StudentStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'LEFT']);

export const CreateStudentSchema = z.object({
  admissionNo: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Alphanumeric uppercase and dashes only'),
  registrationNumber: z.string().max(30).optional(),
  name: z.string().min(2).max(100).trim(),
  fatherName: z.string().min(2).max(100).trim(),
  motherName: z.string().max(100).trim().optional(),
  dob: z.coerce.date().max(new Date(), 'DOB cannot be in the future').optional(),
  gender: GenderSchema.default('MALE'),
  bloodGroup: z.string().max(5).optional(),
  contactNo: z
    .string()
    .regex(/^[+0-9\s-]{7,20}$/, 'Invalid phone number')
    .optional(),
  address: z.string().max(500).optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  admissionDate: z.coerce.date().optional(),
  classId: z.number().int().positive(),
  sessionId: z.number().int().positive(),
  status: StudentStatusSchema.default('ACTIVE'),
});

export const UpdateStudentSchema = CreateStudentSchema.partial()
  .omit({ admissionNo: true })
  .extend({ expectedUpdatedAt: z.coerce.date().optional() });

export const StudentQuerySchema = z.object({
  search: z.string().trim().optional(),
  classId: z.coerce.number().int().positive().optional(),
  sessionId: z.coerce.number().int().positive().optional(),
  status: StudentStatusSchema.optional(),
  gender: GenderSchema.optional(),
  fromDob: z.coerce.date().optional(),
  toDob: z.coerce.date().optional(),
  fromAdmissionDate: z.coerce.date().optional(),
  toAdmissionDate: z.coerce.date().optional(),
  sortBy: z.enum(['name', 'admissionNo', 'createdAt', 'admissionDate', 'dob']).default('name'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
});

export type Gender = z.infer<typeof GenderSchema>;
export type StudentStatus = z.infer<typeof StudentStatusSchema>;
export type CreateStudentDto = z.infer<typeof CreateStudentSchema>;
export type UpdateStudentDto = z.infer<typeof UpdateStudentSchema>;
export type StudentQuery = z.infer<typeof StudentQuerySchema>;
