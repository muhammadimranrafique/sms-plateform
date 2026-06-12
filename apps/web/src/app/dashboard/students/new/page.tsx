'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CreateStudentSchema, type CreateStudentDto } from '@sms/types';
import { useCreateStudent } from '@/lib/hooks/useStudents';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';

export default function NewStudentPage() {
  const router = useRouter();
  const create = useCreateStudent();
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

  const field = (name: keyof CreateStudentDto, label: string, type = 'text') => (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input className="input mt-1" type={type} {...register(name)} />
      {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy-900">New Student</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('admissionNo', 'Admission No')}
        {field('name', 'Full Name')}
        {field('fatherName', "Father's Name")}
        {field('contactNo', 'Contact No')}
        <div>
          <label className="text-sm font-medium">Class ID</label>
          <input className="input mt-1" type="number" {...register('classId', { valueAsNumber: true })} />
        </div>
        <div>
          <label className="text-sm font-medium">Session ID</label>
          <input className="input mt-1" type="number" {...register('sessionId', { valueAsNumber: true })} />
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
