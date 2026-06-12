'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStudents } from '@/lib/hooks/useStudents';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useStudents({ search: search || undefined, limit: 20 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-navy-900">Students</h1>
        <Link href="/dashboard/students/new">
          <Button>+ New Student</Button>
        </Link>
      </div>

      <input
        className="input max-w-sm"
        placeholder="Search by name or admission no…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Admission No</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Father</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-red-500">
                  Failed to load students.
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
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
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
