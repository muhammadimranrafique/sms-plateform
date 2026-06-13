'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CreateFeeStructureSchema, type CreateFeeStructureDto, type FeeStructureItemDto } from '@sms/types';
import { useFeeStructures, useFeeHeads, useCreateFeeStructure, useDeleteFeeStructure } from '@/lib/hooks/useFeeStructures';
import { useClasses } from '@/lib/hooks/useClasses';
import { useSessions } from '@/lib/hooks/useSessions';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { Plus, Trash2 } from 'lucide-react';

export default function FeeStructuresPage() {
  const { data: structures, isLoading } = useFeeStructures();
  const { data: heads } = useFeeHeads();
  const { data: classes } = useClasses();
  const { data: sessions } = useSessions();
  const createStructure = useCreateFeeStructure();
  const deleteStructure = useDeleteFeeStructure();
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState<FeeStructureItemDto[]>([]);

  const form = useForm<CreateFeeStructureDto>({
    resolver: zodResolver(CreateFeeStructureSchema),
  });

  function addItem() {
    setItems([...items, { feeHeadId: 0, amount: 0 }]);
  }

  function updateItem(index: number, field: keyof FeeStructureItemDto, value: number) {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const values = form.getValues();
    const payload = { ...values, items };
    const result = CreateFeeStructureSchema.safeParse(payload);
    if (!result.success) {
      const first = result.error.errors[0];
      toast.error(first?.message ?? 'Validation failed');
      return;
    }
    try {
      await createStructure.mutateAsync(payload);
      toast.success('Fee structure created');
      setShowForm(false);
      form.reset();
      setItems([]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create fee structure');
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this fee structure?')) return;
    try {
      await deleteStructure.mutateAsync(id);
      toast.success('Fee structure deleted');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-navy-900">Fee Structures</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Fee Structure'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleFormSubmit} className="max-w-2xl card grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="col-span-full">
            <label className="text-sm font-medium">Name</label>
            <input className="input mt-1" placeholder="e.g. Standard Fee 2025" {...form.register('name')} />
            {form.formState.errors.name && <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Class</label>
            <select className="input mt-1" {...form.register('classId', { valueAsNumber: true })}>
              <option value="">Select class...</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>
              ))}
            </select>
            {form.formState.errors.classId && <p className="mt-1 text-xs text-red-500">{form.formState.errors.classId.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Session</label>
            <select className="input mt-1" {...form.register('sessionId', { valueAsNumber: true })}>
              <option value="">Select session...</option>
              {sessions?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {form.formState.errors.sessionId && <p className="mt-1 text-xs text-red-500">{form.formState.errors.sessionId.message}</p>}
          </div>

          <div className="col-span-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Fee Heads</span>
              <button type="button" onClick={addItem} className="btn-ghost text-xs flex items-center gap-1">
                <Plus size={14} /> Add Fee Head
              </button>
            </div>
            {items.map((item, i) => (
              <div key={i} className="mb-2 flex items-center gap-2">
                <select
                  className="input flex-1"
                  value={item.feeHeadId || ''}
                  onChange={(e) => updateItem(i, 'feeHeadId', Number(e.target.value))}
                >
                  <option value="">Select head...</option>
                  {heads?.map((h) => (
                    <option key={h.id} value={h.id}>{h.name} ({h.code})</option>
                  ))}
                </select>
                <input
                  className="input w-32"
                  type="number"
                  placeholder="Amount"
                  value={item.amount || ''}
                  onChange={(e) => updateItem(i, 'amount', Number(e.target.value))}
                />
                <button type="button" onClick={() => removeItem(i)} className="rounded p-1 text-red-500 hover:bg-red-50">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="col-span-full flex justify-end">
            <Button type="submit" disabled={createStructure.isPending || items.length === 0}>
              {createStructure.isPending ? 'Saving...' : 'Create'}
            </Button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            )}
            {structures?.map((s) => (
              <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-slate-500">{s.class?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{s.session?.name ?? '—'}</td>
                <td className="px-4 py-3">{s.items?.length ?? 0}</td>
                <td className="px-4 py-3">{s.isActive ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {structures && structures.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No fee structures defined.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
