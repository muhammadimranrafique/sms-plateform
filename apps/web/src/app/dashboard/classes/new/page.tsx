'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CreateClassSchema, type CreateClassDto } from '@sms/types';
import { useCreateClass } from '@/lib/hooks/useClasses';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';

export default function NewClassPage() {
  const router = useRouter();
  const create = useCreateClass();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClassDto>({
    resolver: zodResolver(CreateClassSchema),
    defaultValues: { isActive: true, sortOrder: 0 },
  });

  async function onSubmit(values: CreateClassDto) {
    try {
      await create.mutateAsync(values);
      toast.success('Class created');
      router.push('/dashboard/classes');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create class');
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy-900">New Class</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="col-span-full">
          <label className="text-sm font-medium">Class Name</label>
          <input className="input mt-1" placeholder="e.g. Class 1" {...register('name')} />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Section (optional)</label>
          <input className="input mt-1" placeholder="e.g. A" {...register('section')} />
          {errors.section && <p className="mt-1 text-xs text-red-500">{errors.section.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Sort Order</label>
          <input className="input mt-1" type="number" {...register('sortOrder', { valueAsNumber: true })} />
          {errors.sortOrder && <p className="mt-1 text-xs text-red-500">{errors.sortOrder.message}</p>}
        </div>
        <div className="col-span-full flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Saving...' : 'Create Class'}
          </Button>
        </div>
      </form>
    </div>
  );
}
