'use client';

import { Wallet, Building2, FileText, Globe } from 'lucide-react';

interface PaymentEntry {
  method?: string;
  amount?: number;
}

const methodConfig: Record<string, { label: string; icon: typeof Wallet; color: string }> = {
  CASH: { label: 'Cash', icon: Wallet, color: 'text-emerald-600 bg-emerald-50' },
  BANK_TRANSFER: { label: 'Bank Transfer', icon: Building2, color: 'text-blue-600 bg-blue-50' },
  CHEQUE: { label: 'Cheque', icon: FileText, color: 'text-amber-600 bg-amber-50' },
  ONLINE: { label: 'Online', icon: Globe, color: 'text-purple-600 bg-purple-50' },
};

export function PaymentMethodChart({ entries }: { entries: PaymentEntry[] | undefined }) {
  const totals: Record<string, number> = {};
  for (const e of entries ?? []) {
    const m = e.method ?? 'OTHER';
    totals[m] = (totals[m] ?? 0) + (e.amount ?? 0);
  }
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0) || 1;

  const methods = Object.entries(methodConfig).map(([key, cfg]) => ({
    key,
    ...cfg,
    total: totals[key] ?? 0,
    pct: Math.round(((totals[key] ?? 0) / grandTotal) * 100),
  }));

  if (methods.every((m) => m.total === 0)) {
    return (
      <div className="card p-5">
        <h3 className="mb-1 text-sm font-semibold text-navy-900">Payment Methods</h3>
        <p className="text-xs text-slate-400">No payment data</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold text-navy-900">Payment Methods</h3>
      <div className="mb-4 flex gap-1">
        {methods.map(({ key, pct, color }) => {
          const bgClass = color.split(' ')[0]?.replace('text-', 'bg-').replace('-600', '-500') ?? 'bg-slate-200';
          return <div key={key} className={`h-2.5 rounded-full ${bgClass}`} style={{ width: `${pct}%` }} />;
        })}
      </div>
      <div className="space-y-2.5">
        {methods.map(({ key, label, icon: Icon, pct, color }) => {
          const barColor = color.split(' ')[0]?.replace('text-', 'bg-') ?? 'bg-blue-500';
          return (
            <div key={key} className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${color}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-navy-900">{label}</span>
                  <span className="text-xs text-slate-500">{pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
