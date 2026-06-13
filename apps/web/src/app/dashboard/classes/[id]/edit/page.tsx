'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { UpdateClassSchema, type UpdateClassDto } from '@sms/types';
import { useClass, useUpdateClass } from '@/lib/hooks/useClasses';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: cls, isLoading } = useClass(id);
  const update = useUpdateClass(id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateClassDto>({
    resolver: zodResolver(UpdateClassSchema),
  });

  useEffect(() => {
    if (cls) {
      reset({
        name: cls.name,
        section: cls.section ?? undefined,
        sortOrder: cls.sortOrder,
        isActive: cls.isActive,
      });
    }
  }, [cls, reset]);

  async function onSubmit(values: UpdateClassDto) {
    try {
      await update.mutateAsync(values);
      toast.success('Class updated');
      router.push('/dashboard/classes');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update class');
    }
  }

  if (isLoading) return <p className="text-slate-400">Loading class...</p>;
  if (!cls) return <p className="text-red-500">Class not found</p>;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy-900">
        Edit Class — {cls.name}{cls.section ? ` - ${cls.section}` : ''}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="col-span-full">
          <label className="text-sm font-medium">Class Name</label>
          <input className="input mt-1" {...register('name')} />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Section</label>
          <input className="input mt-1" {...register('section')} />
          {errors.section && <p className="mt-1 text-xs text-red-500">{errors.section.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Sort Order</label>
          <input className="input mt-1" type="number" {...register('sortOrder', { valueAsNumber: true })} />
          {errors.sortOrder && <p className="mt-1 text-xs text-red-500">{errors.sortOrder.message}</p>}
        </div>
        <div>
          <label className="text-sm font-medium">Active</label>
          <select className="input mt-1" {...register('isActive')}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
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
