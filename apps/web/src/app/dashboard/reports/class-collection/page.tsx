'use client';

import { useClassCollectionSummary } from '@/lib/hooks/useReports';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function ClassCollectionPage() {
  const { data, isLoading } = useClassCollectionSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Class Collection Summary</h1>
        <p className="text-sm text-slate-500">Collection rates and outstanding by class.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="card overflow-x-auto p-5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500">
                <th className="pb-3 pr-4 font-medium">Class</th>
                <th className="pb-3 pr-4 text-right font-medium">Students</th>
                <th className="pb-3 pr-4 text-right font-medium">Assigned</th>
                <th className="pb-3 pr-4 text-right font-medium">Collected</th>
                <th className="pb-3 pr-4 text-right font-medium">Outstanding</th>
                <th className="pb-3 text-right font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((c: any) => (
                <tr key={c.classId} className="border-b border-slate-50 text-navy-900 last:border-0">
                  <td className="py-3 pr-4 font-medium">{c.className}</td>
                  <td className="py-3 pr-4 text-right">{c.studentCount}</td>
                  <td className="py-3 pr-4 text-right">{formatCurrency(c.totalAssigned ?? 0)}</td>
                  <td className="py-3 pr-4 text-right text-emerald-600">{formatCurrency(c.totalCollected ?? 0)}</td>
                  <td className="py-3 pr-4 text-right text-amber-600">{formatCurrency(c.totalOutstanding ?? 0)}</td>
                  <td className="py-3 text-right">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      Number(c.collectionRate) >= 80 ? 'bg-emerald-50 text-emerald-700' :
                      Number(c.collectionRate) >= 50 ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>{c.collectionRate}%</span>
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
