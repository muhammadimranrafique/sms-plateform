'use client';

import { Banknote, TrendingUp, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface KPI {
  totalStudents?: number;
  totalFeeAssigned?: number;
  totalFeeCollected?: number;
  totalOutstanding?: number;
  totalOverdue?: number;
  collectionRate?: number;
  overdueRate?: number;
  activeDefaulters?: number;
}

export function FeeKPICards({ kpi }: { kpi: KPI | undefined }) {
  const cards = [
    {
      label: 'Collection Rate',
      value: kpi?.collectionRate != null ? `${kpi.collectionRate}%` : '—',
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Total Collected',
      value: kpi?.totalFeeCollected != null ? formatCurrency(kpi.totalFeeCollected) : '—',
      icon: Banknote,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Outstanding',
      value: kpi?.totalOutstanding != null ? formatCurrency(kpi.totalOutstanding) : '—',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Overdue',
      value: kpi?.totalOverdue != null ? formatCurrency(kpi.totalOverdue) : '—',
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50',
    },
    {
      label: 'Active Defaulters',
      value: kpi?.activeDefaulters ?? '—',
      icon: DollarSign,
      color: 'text-rose-600 bg-rose-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="card flex items-center gap-3 p-4">
          <div className={`rounded-lg p-2.5 ${color}`}>
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-lg font-bold text-navy-900">{value}</div>
            <div className="truncate text-xs text-slate-500">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
