'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { UpdateStudentSchema, type UpdateStudentDto } from '@sms/types';
import { useStudent, useUpdateStudent } from '@/lib/hooks/useStudents';
import { useClasses } from '@/lib/hooks/useClasses';
import { useSessions } from '@/lib/hooks/useSessions';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: student, isLoading: loadingStudent } = useStudent(id);
  const update = useUpdateStudent(id);
  const { data: classes } = useClasses();
  const { data: sessions } = useSessions();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateStudentDto>({
    resolver: zodResolver(UpdateStudentSchema),
  });

  useEffect(() => {
    if (student) {
      reset({
        name: student.name,
        fatherName: student.fatherName,
        classId: student.class?.id,
        sessionId: student.session?.id,
        status: student.status as UpdateStudentDto['status'],
      });
    }
  }, [student, reset]);

  async function onSubmit(values: UpdateStudentDto) {
    try {
      await update.mutateAsync(values);
      toast.success('Student updated');
      router.push('/dashboard/students');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update student');
    }
  }

  if (loadingStudent) return <p className="text-slate-400">Loading student...</p>;
  if (!student) return <p className="text-red-500">Student not found</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy-900">
        Edit Student — {student.admissionNo}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <div>
          <label className="text-sm font-medium">Status</label>
          <select className="input mt-1" {...register('status')}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LEFT">Left</option>
          </select>
          {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status.message}</p>}
        </div>
        <div className="col-span-full flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
