import { describe, it, expect } from 'vitest';
import { CreateStudentSchema, StudentQuerySchema } from './student.schema';

describe('CreateStudentSchema', () => {
  it('accepts a valid student', () => {
    const parsed = CreateStudentSchema.parse({
      admissionNo: 'ADM-001',
      name: 'Ali Khan',
      fatherName: 'Khan',
      classId: 1,
      sessionId: 1,
    });
    expect(parsed.gender).toBe('MALE');
    expect(parsed.status).toBe('ACTIVE');
  });

  it('rejects a lowercase admission number', () => {
    const res = CreateStudentSchema.safeParse({
      admissionNo: 'adm-001',
      name: 'Ali',
      fatherName: 'Khan',
      classId: 1,
      sessionId: 1,
    });
    expect(res.success).toBe(false);
  });

  it('rejects a future date of birth', () => {
    const res = CreateStudentSchema.safeParse({
      admissionNo: 'ADM-2',
      name: 'Ali',
      fatherName: 'Khan',
      dob: new Date(Date.now() + 86_400_000),
      classId: 1,
      sessionId: 1,
    });
    expect(res.success).toBe(false);
  });
});

describe('StudentQuerySchema', () => {
  it('applies defaults and coerces strings', () => {
    const q = StudentQuerySchema.parse({ page: '2', limit: '50' });
    expect(q.page).toBe(2);
    expect(q.limit).toBe(50);
    expect(q.sortBy).toBe('name');
  });

  it('caps limit at 100', () => {
    const res = StudentQuerySchema.safeParse({ limit: '500' });
    expect(res.success).toBe(false);
  });
});
