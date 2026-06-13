'use client';

interface HeadItem {
  feeHeadName?: string;
  totalAssigned?: number;
  totalCollected?: number;
  collectionRate?: number;
  percentageOfTotal?: number;
}

export function HeadWiseBreakdownChart({ data }: { data: HeadItem[] | undefined }) {
  const items = data ?? [];
  const max = Math.max(...items.map((i) => i.totalAssigned ?? 0), 1);

  if (items.length === 0) {
    return (
      <div className="card p-5">
        <h3 className="mb-1 text-sm font-semibold text-navy-900">Fee Head Breakdown</h3>
        <p className="text-xs text-slate-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold text-navy-900">Fee Head Breakdown</h3>
      <div className="space-y-3">
        {items.map((item, i) => {
          const pct = max > 0 ? ((item.totalAssigned ?? 0) / max) * 100 : 0;
          const collectedPct = item.collectionRate ?? 0;
          return (
            <div key={i}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-navy-900">{item.feeHeadName}</span>
                <span className="text-slate-500">{collectedPct.toFixed(1)}% collected</span>
              </div>
              <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="absolute inset-y-0 left-0 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-emerald-400"
                  style={{ width: `${(collectedPct / 100) * pct}%` }}
                />
              </div>
              <div className="mt-0.5 flex justify-between text-[10px] text-slate-400">
                <span>Assigned: {(item.totalAssigned ?? 0).toLocaleString()}</span>
                <span>Collected: {(item.totalCollected ?? 0).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
