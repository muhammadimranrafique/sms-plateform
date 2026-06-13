'use client';

interface AlertItem {
  alertLevel?: string;
  _count?: number;
}

export function DefaulterAgingChart({ alerts }: { alerts: AlertItem[] | undefined }) {
  const buckets = [
    { level: 'YELLOW', label: '1-30 days', color: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50' },
    { level: 'ORANGE', label: '31-60 days', color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
    { level: 'RED', label: '61+ days', color: 'bg-red-600', text: 'text-red-700', bg: 'bg-red-50' },
  ];

  const counts = buckets.map((b) => ({
    ...b,
    count: alerts?.filter((a) => a.alertLevel === b.level).length ?? 0,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold text-navy-900">Defaulter Aging</h3>
      <div className="space-y-3">
        {counts.map(({ label, count, color, text }) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className={`font-medium ${text}`}>{label}</span>
              <span className="font-bold text-navy-900">{count}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        {buckets.map(({ label, bg, text }) => (
          <span key={label} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${bg} ${text}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
