'use client';

import { useState } from 'react';
import { useComparativeReport } from '@/lib/hooks/useReports';
import { useSessions } from '@/lib/hooks/useSessions';
import { formatCurrency } from '@/lib/utils';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';

export default function ComparativePage() {
  const { data: sessions } = useSessions();
  const [s1, setS1] = useState<number>(0);
  const [s2, setS2] = useState<number>(0);
  const { data, isLoading } = useComparativeReport(s1, s2);

  const sessionList = Array.isArray(sessions) ? sessions : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Comparative Report</h1>
        <p className="text-sm text-slate-500">Compare fee performance across sessions.</p>
      </div>

      <div className="card flex flex-wrap items-end gap-4 p-5">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">Session 1</label>
          <select className="input w-full" value={s1} onChange={(e) => setS1(Number(e.target.value))}>
            <option value={0}>Select session...</option>
            {sessionList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">Session 2</label>
          <select className="input w-full" value={s2} onChange={(e) => setS2(Number(e.target.value))}>
            <option value={0}>Select session...</option>
            {sessionList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[data.session1, data.session2].map((s: any, i: number) => (
              <div key={i} className="card p-5">
                <h3 className="mb-3 text-sm font-semibold text-navy-900">Session {i + 1}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Assigned</span><span className="font-medium">{formatCurrency(s.totalAssigned ?? 0)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Collected</span><span className="font-medium text-emerald-600">{formatCurrency(s.totalCollected ?? 0)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Fine</span><span className="font-medium">{formatCurrency(s.totalFine ?? 0)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Outstanding</span><span className="font-medium text-amber-600">{formatCurrency(s.totalOutstanding ?? 0)}</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy-900">Variance</h3>
            <div className="space-y-3">
              {[{ label: 'Assigned Change', value: data.variance?.assignedChange, pct: data.variance?.assignedPercent },
                { label: 'Collected Change', value: data.variance?.collectedChange, pct: data.variance?.collectedPercent },
              ].map(({ label, value, pct }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className={`flex items-center gap-1.5 text-sm font-medium ${
                    (value ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {(value ?? 0) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {formatCurrency(Math.abs(value ?? 0))} ({pct != null ? `${pct >= 0 ? '+' : ''}${pct}%` : '—'})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
