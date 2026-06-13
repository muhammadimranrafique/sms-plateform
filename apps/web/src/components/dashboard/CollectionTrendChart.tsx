'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  data?: Array<{ date: string; total: number }>;
  isLoading?: boolean;
}

export function CollectionTrendChart({ data, isLoading }: Props) {
  const bars = data ?? [];
  const max = Math.max(...bars.map((b) => b.total), 1);

  if (isLoading) {
    return (
      <div className="card p-5">
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-slate-100" />
        <div className="flex h-40 items-end gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 animate-pulse rounded-t bg-slate-100" style={{ height: `${30 + Math.random() * 70}%` }} />
          ))}
        </div>
      </div>
    );
  }

  const last = bars[bars.length - 1];
  const prev = bars[bars.length - 2];
  const trend = bars.length >= 2 && last && prev && last.total >= prev.total;
  const change = bars.length >= 2 && last && prev
    ? ((last.total - prev.total) / prev.total * 100).toFixed(1)
    : null;

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-navy-900">Daily Collection Trend</h3>
          <p className="text-xs text-slate-500">Last {bars.length} days</p>
        </div>
        {change && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trend ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {change}%
          </span>
        )}
      </div>
      <div className="flex h-40 items-end gap-1">
        {bars.map((bar, i) => {
          const h = max > 0 ? (bar.total / max) * 100 : 0;
          return (
            <div key={i} className="group relative flex-1">
              <div
                className="rounded-t bg-gradient-to-t from-blue-600 to-blue-400 transition-all hover:from-blue-700"
                style={{ height: `${Math.max(h, 2)}%` }}
              />
              <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-navy-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                {bar.date}: {bar.total.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
