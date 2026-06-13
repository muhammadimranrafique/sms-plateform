'use client';

import { useState } from 'react';
import { useDefaulterList } from '@/lib/hooks/useReports';
import { formatCurrency } from '@/lib/utils';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function DefaultersPage() {
  const [minOverdue, setMinOverdue] = useState(1);
  const { data, isLoading } = useDefaulterList(1, minOverdue);

  const list = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Defaulter List</h1>
        <p className="text-sm text-slate-500">Students with overdue fees.</p>
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <span className="text-sm text-slate-600">Min overdue days:</span>
        {[1, 30, 60].map((d) => (
          <button
            key={d}
            onClick={() => setMinOverdue(d)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              minOverdue === d ? 'bg-navy-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {d === 1 ? 'All' : `${d}+ days`}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">{list.length} students</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      ) : list.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <AlertTriangle size={32} className="text-emerald-400" />
          <p className="text-sm text-slate-500">No defaulters found</p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500">
                <th className="pb-3 pr-4 font-medium">Admission No</th>
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Father</th>
                <th className="pb-3 pr-4 font-medium">Class</th>
                <th className="pb-3 pr-4 text-right font-medium">Outstanding</th>
                <th className="pb-3 text-right font-medium">Overdue</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s: any, i: number) => (
                <tr key={i} className="border-b border-slate-50 text-navy-900 last:border-0">
                  <td className="py-3 pr-4 font-mono text-xs">{s.admissionNo}</td>
                  <td className="py-3 pr-4 font-medium">{s.name}</td>
                  <td className="py-3 pr-4 text-slate-600">{s.fatherName}</td>
                  <td className="py-3 pr-4">{s.className}</td>
                  <td className="py-3 pr-4 text-right font-medium text-amber-600">{formatCurrency(s.totalOutstanding ?? 0)}</td>
                  <td className="py-3 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.overdueDays >= 61 ? 'bg-red-50 text-red-700' :
                      s.overdueDays >= 31 ? 'bg-orange-50 text-orange-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>{s.overdueDays}d</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
