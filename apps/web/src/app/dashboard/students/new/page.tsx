'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CreateStudentSchema, type CreateStudentDto } from '@sms/types';
import { useCreateStudent } from '@/lib/hooks/useStudents';
import { useClasses } from '@/lib/hooks/useClasses';
import { useSessions } from '@/lib/hooks/useSessions';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';

export default function NewStudentPage() {
  const router = useRouter();
  const create = useCreateStudent();
  const { data: classes } = useClasses();
  const { data: sessions } = useSessions();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateStudentDto>({
    resolver: zodResolver(CreateStudentSchema),
    defaultValues: { gender: 'MALE', status: 'ACTIVE' },
  });

  async function onSubmit(values: CreateStudentDto) {
    try {
      await create.mutateAsync(values);
      toast.success('Student created');
      router.push('/dashboard/students');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create student');
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy-900">New Student</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Admission No</label>
          <input className="input mt-1" {...register('admissionNo')} />
          {errors.admissionNo && <p className="mt-1 text-xs text-red-500">{errors.admissionNo.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Full Name</label>
          <input className="input mt-1" {...register('name')} />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Father's Name</label>
          <input className="input mt-1" {...register('fatherName')} />
          {errors.fatherName && <p className="mt-1 text-xs text-red-500">{errors.fatherName.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Contact No</label>
          <input className="input mt-1" {...register('contactNo')} />
          {errors.contactNo && <p className="mt-1 text-xs text-red-500">{errors.contactNo.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Class</label>
          <select className="input mt-1" {...register('classId', { valueAsNumber: true })}>
            <option value="">Select class...</option>
            {classes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.section ? ` - ${c.section}` : ''}
              </option>
            ))}
          </select>
          {errors.classId && <p className="mt-1 text-xs text-red-500">{errors.classId.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Session</label>
          <select className="input mt-1" {...register('sessionId', { valueAsNumber: true })}>
            <option value="">Select session...</option>
            {sessions?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.isCurrent ? ' (Current)' : ''}
              </option>
            ))}
          </select>
          {errors.sessionId && <p className="mt-1 text-xs text-red-500">{errors.sessionId.message}</p>}
        </div>
        <div className="col-span-full flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Saving\u2026' : 'Create Student'}
          </Button>
        </div>
      </form>
    </div>
  );
}
