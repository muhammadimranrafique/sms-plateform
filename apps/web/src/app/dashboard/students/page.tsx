'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useStudents, useDeleteStudent } from '@/lib/hooks/useStudents';
import { useClasses } from '@/lib/hooks/useClasses';
import { useSessions } from '@/lib/hooks/useSessions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { Pencil, Trash2 } from 'lucide-react';

export default function StudentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<number | undefined>();
  const [sessionFilter, setSessionFilter] = useState<number | undefined>();
  const { data, isLoading, isError, error } = useStudents({ search: search || undefined, classId: classFilter, sessionId: sessionFilter, limit: 50 });
  const { data: classes } = useClasses();
  const { data: sessions } = useSessions();
  const deleteStudent = useDeleteStudent();

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete student "${name}"? This will soft-deactivate their record.`)) return;
    try {
      await deleteStudent.mutateAsync(id);
      toast.success('Student deleted');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete student');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-navy-900">Students</h1>
        <Link href="/dashboard/students/new">
          <Button>+ New Student</Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <input
          className="input max-w-sm"
          placeholder="Search by name or admission no…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input max-w-48" value={classFilter ?? ''} onChange={(e) => setClassFilter(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">All classes</option>
          {classes?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>
          ))}
        </select>
        <select className="input max-w-48" value={sessionFilter ?? ''} onChange={(e) => setSessionFilter(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">All sessions</option>
          {sessions?.map((s) => (
            <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (Current)' : ''}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Admission No</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Father</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-red-500">
                  Failed to load students. {error instanceof Error ? `(${error.message})` : ''}
                </td>
              </tr>
            )}
            {data?.map((s) => (
              <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{s.admissionNo}</td>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-slate-500">{s.fatherName}</td>
                <td className="px-4 py-3">
                  {s.class ? `${s.class.name}${s.class.section ? ` - ${s.class.section}` : ''}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge value={s.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/students/${s.id}/edit`)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-navy-700"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
