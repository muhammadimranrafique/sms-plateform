'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CreateDiscountSchema, type CreateDiscountDto } from '@sms/types';
import { useDiscounts, useCreateDiscount, useDeleteDiscount } from '@/lib/hooks/useDiscounts';
import { useStudents } from '@/lib/hooks/useStudents';
import { useFeeHeads } from '@/lib/hooks/useFeeStructures';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

export default function DiscountsPage() {
  const { data: discounts, isLoading } = useDiscounts();
  const { data: students, isLoading: studentsLoading, isError: studentsError } = useStudents({ limit: 100 });
  const { data: heads } = useFeeHeads();
  const create = useCreateDiscount();
  const deleteDiscount = useDeleteDiscount();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<CreateDiscountDto>({
    resolver: zodResolver(CreateDiscountSchema),
    defaultValues: { type: 'PERCENTAGE' },
  });

  async function onSubmit(values: CreateDiscountDto) {
    try {
      await create.mutateAsync(values);
      toast.success('Discount created');
      setShowForm(false);
      form.reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create discount');
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this discount?')) return;
    try {
      await deleteDiscount.mutateAsync(id);
      toast.success('Discount deleted');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-navy-900">Discounts & Concessions</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Discount'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl card grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="col-span-full">
            <label className="text-sm font-medium">Student</label>
            <select className="input mt-1" {...form.register('studentId', { valueAsNumber: true })}>
              <option value="">
                {studentsLoading ? 'Loading students...' : studentsError ? 'Error loading students' : 'Select student...'}
              </option>
              {students?.map((s) => (
                <option key={s.id} value={s.id}>{s.admissionNo} — {s.name}</option>
              ))}
            </select>
            {form.formState.errors.studentId && <p className="mt-1 text-xs text-red-500">{form.formState.errors.studentId.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Fee Head (optional)</label>
            <select className="input mt-1" {...form.register('feeHeadId', { valueAsNumber: true })}>
              <option value="">All heads</option>
              {heads?.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <select className="input mt-1" {...form.register('type')}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Value</label>
            <input className="input mt-1" type="number" step="0.01" {...form.register('value', { valueAsNumber: true })} />
            {form.formState.errors.value && <p className="mt-1 text-xs text-red-500">{form.formState.errors.value.message}</p>}
          </div>
          <div className="col-span-full">
            <label className="text-sm font-medium">Reason</label>
            <input className="input mt-1" {...form.register('reason')} />
          </div>
          <div className="col-span-full flex justify-end">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Saving...' : 'Create Discount'}
            </Button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Fee Head</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            )}
            {discounts?.map((d) => (
              <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{d.student?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{d.feeHead?.name ?? 'All'}</td>
                <td className="px-4 py-3">{d.type}</td>
                <td className="px-4 py-3">{d.type === 'PERCENTAGE' ? `${d.value}%` : formatCurrency(Number(d.value))}</td>
                <td className="px-4 py-3 text-slate-500">{d.reason ?? '—'}</td>
                <td className="px-4 py-3">{d.isActive ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {discounts && discounts.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No discounts defined.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
