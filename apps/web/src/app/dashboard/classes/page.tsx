'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

interface ClassRow {
  id: number;
  name: string;
  section?: string | null;
  _count?: { students: number };
}

export default function ClassesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get<ClassRow[]>('/classes'),
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-navy-900">Classes</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading && <p className="text-slate-400">Loading…</p>}
        {data?.map((c) => (
          <div key={c.id} className="card">
            <div className="text-lg font-semibold text-navy-900">
              {c.name}
              {c.section ? ` - ${c.section}` : ''}
            </div>
            <div className="text-xs text-slate-500">{c._count?.students ?? 0} students</div>
          </div>
        ))}
      </div>
    </div>
  );
}
