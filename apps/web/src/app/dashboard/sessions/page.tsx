'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CreateSessionSchema, type CreateSessionDto } from '@sms/types';
import { useSessions, useCreateSession, useUpdateSession, useRolloverSession } from '@/lib/hooks/useSessions';

import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import { Plus, Pencil, RotateCcw } from 'lucide-react';

export default function SessionsPage() {
  const { data: sessions, isLoading } = useSessions();
  const create = useCreateSession();
  const rollover = useRolloverSession();
  const [editingId, setEditingId] = useState<number | null>(null);
  const update = useUpdateSession(editingId ?? 0);
  const [showForm, setShowForm] = useState(false);

  const form = useForm<CreateSessionDto>({
    resolver: zodResolver(CreateSessionSchema),
    defaultValues: { isCurrent: false },
  });

  const editForm = useForm<CreateSessionDto>({
    resolver: zodResolver(CreateSessionSchema),
  });

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    form.reset({ isCurrent: false });
    editForm.reset();
  }

  async function handleCreate(data: CreateSessionDto) {
    try {
      await create.mutateAsync(data);
      toast.success('Session created');
      resetForm();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create session');
    }
  }

  function startEdit(s: { id: number; name: string; startDate: string; endDate: string; isCurrent: boolean }) {
    setEditingId(s.id);
    editForm.reset({
      name: s.name,
      startDate: new Date(s.startDate),
      endDate: new Date(s.endDate),
      isCurrent: s.isCurrent,
    });
  }

  async function handleEdit(data: CreateSessionDto) {
    if (!editingId) return;
    try {
      await update.mutateAsync(data);
      toast.success('Session updated');
      resetForm();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update session');
    }
  }

  async function handleRollover(id: number, name: string) {
    if (!window.confirm(`Create next academic year from "${name}"?`)) return;
    try {
      await rollover.mutateAsync(id);
      toast.success('Next session created via rollover');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Rollover failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-navy-900">Academic Sessions</h1>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <Plus size={16} />
          {showForm ? 'Cancel' : 'New Session'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={form.handleSubmit(handleCreate)} className="max-w-xl card grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="col-span-full">
            <label className="text-sm font-medium">Session Name</label>
            <input className="input mt-1" placeholder="e.g. 2025-2026" {...form.register('name')} />
            {form.formState.errors.name && <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Start Date</label>
            <input className="input mt-1" type="date" {...form.register('startDate')} />
            {form.formState.errors.startDate && <p className="mt-1 text-xs text-red-500">{form.formState.errors.startDate.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">End Date</label>
            <input className="input mt-1" type="date" {...form.register('endDate')} />
            {form.formState.errors.endDate && <p className="mt-1 text-xs text-red-500">{form.formState.errors.endDate.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isCurrent" className="h-4 w-4" {...form.register('isCurrent')} />
            <label htmlFor="isCurrent" className="text-sm font-medium">Set as current session</label>
          </div>
          <div className="col-span-full flex justify-end">
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Saving...' : 'Create Session'}
            </Button>
          </div>
        </form>
      )}

      {editingId && (
        <form onSubmit={editForm.handleSubmit(handleEdit)} className="max-w-xl card grid grid-cols-1 gap-4 sm:grid-cols-2 border-2 border-amber-200">
          <div className="col-span-full text-sm text-amber-600 font-medium">Editing Session</div>
          <div className="col-span-full">
            <label className="text-sm font-medium">Session Name</label>
            <input className="input mt-1" {...editForm.register('name')} />
            {editForm.formState.errors.name && <p className="mt-1 text-xs text-red-500">{editForm.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Start Date</label>
            <input className="input mt-1" type="date" {...editForm.register('startDate')} />
          </div>
          <div>
            <label className="text-sm font-medium">End Date</label>
            <input className="input mt-1" type="date" {...editForm.register('endDate')} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="editIsCurrent" className="h-4 w-4" {...editForm.register('isCurrent')} />
            <label htmlFor="editIsCurrent" className="text-sm font-medium">Set as current session</label>
          </div>
          <div className="col-span-full flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Start Date</th>
              <th className="px-4 py-3">End Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            )}
            {sessions?.map((s) => (
              <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(s.startDate)}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(s.endDate)}</td>
                <td className="px-4 py-3">
                  {s.isCurrent
                    ? <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Current</span>
                    : <span className="text-xs text-slate-400">Archived</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(s)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-navy-700"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleRollover(s.id, s.name)}
                      className="rounded p-1 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                      title="Rollover to next year"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sessions && sessions.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No sessions defined.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
