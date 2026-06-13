'use client';

import { useConcessionReport } from '@/lib/hooks/useReports';
import { formatCurrency } from '@/lib/utils';
import { Loader2, PercentCircle } from 'lucide-react';

export default function ConcessionsPage() {
  const { data, isLoading } = useConcessionReport();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Concessions Report</h1>
        <p className="text-sm text-slate-500">Scholarships, concessions, and discounts summary.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
                <PercentCircle size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-navy-900">{data?.totalConcessions ?? 0}</div>
                <div className="text-xs text-slate-500">Total Concessions Granted</div>
              </div>
            </div>
          </div>

          {data?.summaryByType && data.summaryByType.length > 0 && (
            <div className="card overflow-x-auto p-5">
              <h3 className="mb-3 text-sm font-semibold text-navy-900">By Concession Type</h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3 pr-4 text-right font-medium">Students</th>
                    <th className="pb-3 text-right font-medium">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.summaryByType.map((item: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 text-navy-900 last:border-0">
                      <td className="py-3 pr-4 font-medium">{item.name}</td>
                      <td className="py-3 pr-4 text-right">{item.count}</td>
                      <td className="py-3 text-right">{formatCurrency(item.totalValue ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data?.details && data.details.length > 0 && (
            <div className="card overflow-x-auto p-5">
              <h3 className="mb-3 text-sm font-semibold text-navy-900">All Concessions</h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Student</th>
                    <th className="pb-3 pr-4 font-medium">Admission No</th>
                    <th className="pb-3 pr-4 font-medium">Concession</th>
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3 pr-4 font-medium">Head</th>
                    <th className="pb-3 text-right font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.details.map((d: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 text-navy-900 last:border-0">
                      <td className="py-3 pr-4 font-medium">{d.student?.name}</td>
                      <td className="py-3 pr-4 font-mono text-xs">{d.student?.admissionNo}</td>
                      <td className="py-3 pr-4">{d.concession?.name}</td>
                      <td className="py-3 pr-4">{d.concession?.type}</td>
                      <td className="py-3 pr-4 text-slate-600">{d.feeHead?.name ?? 'All Heads'}</td>
                      <td className="py-3 text-right font-medium">
                        {d.concession?.type === 'PERCENTAGE' ? `${d.concession.value}%` : formatCurrency(Number(d.concession.value))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
