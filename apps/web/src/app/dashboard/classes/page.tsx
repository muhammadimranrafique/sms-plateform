'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useClasses, useDeleteClass } from '@/lib/hooks/useClasses';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { Pencil, Trash2 } from 'lucide-react';

export default function ClassesPage() {
  const router = useRouter();
  const { data, isLoading } = useClasses();
  const deleteClass = useDeleteClass();

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Deactivate class "${name}"?`)) return;
    try {
      await deleteClass.mutateAsync(id);
      toast.success('Class deactivated');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to deactivate class');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-navy-900">Classes</h1>
        <Link href="/dashboard/classes/new">
          <Button>+ New Class</Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading && <p className="text-slate-400">Loading…</p>}
        {data?.map((c) => (
          <div key={c.id} className="card flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-navy-900">
                {c.name}
                {c.section ? ` - ${c.section}` : ''}
              </div>
              <div className="text-xs text-slate-500">{c._count?.students ?? 0} students</div>
              {!c.isActive && (
                <span className="mt-1 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  Inactive
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/dashboard/classes/${c.id}/edit`)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-navy-700"
                title="Edit"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(c.id, c.name)}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
