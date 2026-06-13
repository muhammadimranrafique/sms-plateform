'use client';

import { useInstitutionKPI, useHeadWiseBreakdown, useDailyRegister } from '@/lib/hooks/useAggregation';
import { useDefaulterList, useClassCollectionSummary } from '@/lib/hooks/useReports';
import { FeeKPICards } from './FeeKPICards';
import { CollectionTrendChart } from './CollectionTrendChart';
import { HeadWiseBreakdownChart } from './HeadWiseBreakdownChart';
import { DefaulterAgingChart } from './DefaulterAgingChart';
import { PaymentMethodChart } from './PaymentMethodChart';

export function FeeDashboardClient() {
  const { data: kpi, isLoading } = useInstitutionKPI();
  const { data: headWise } = useHeadWiseBreakdown();
  const { data: daily } = useDailyRegister();
  const { data: defaulterData } = useDefaulterList(1, 1);
  const { data: classData } = useClassCollectionSummary();

  const alerts = Array.isArray(defaulterData) ? defaulterData.slice(0, 50) : [];

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-20 animate-pulse p-4" />
          ))}
        </div>
      ) : (
        <FeeKPICards kpi={kpi} />
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CollectionTrendChart data={daily?.dailySummary} isLoading={isLoading} />
        <HeadWiseBreakdownChart data={headWise} />
        <DefaulterAgingChart alerts={alerts} />
        <PaymentMethodChart entries={daily?.entries} />
      </div>
      {classData && classData.length > 0 && (
        <div className="card overflow-x-auto p-5">
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Class Collection Summary</h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-500">
                <th className="pb-2 font-medium">Class</th>
                <th className="pb-2 font-medium">Students</th>
                <th className="pb-2 font-medium">Assigned</th>
                <th className="pb-2 font-medium">Collected</th>
                <th className="pb-2 font-medium">Outstanding</th>
                <th className="pb-2 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {classData.map((c: any) => (
                <tr key={c.classId} className="border-b border-slate-50 text-navy-900 last:border-0">
                  <td className="py-2.5 font-medium">{c.className}</td>
                  <td className="py-2.5">{c.studentCount}</td>
                  <td className="py-2.5">{c.totalAssigned?.toLocaleString()}</td>
                  <td className="py-2.5 text-emerald-600">{c.totalCollected?.toLocaleString()}</td>
                  <td className="py-2.5 text-amber-600">{c.totalOutstanding?.toLocaleString()}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      Number(c.collectionRate) >= 80 ? 'bg-emerald-50 text-emerald-700' :
                      Number(c.collectionRate) >= 50 ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {c.collectionRate}%
                    </span>
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
