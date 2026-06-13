'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useStudentLedger } from '@/lib/hooks/useReports';
import { formatCurrency } from '@/lib/utils';

export default function StudentLedgerPage() {
  const [studentId, setStudentId] = useState<number>(0);
  const [inputVal, setInputVal] = useState('');
  const { data, isLoading } = useStudentLedger(studentId);

  const handleSearch = () => {
    const id = parseInt(inputVal);
    if (!isNaN(id) && id > 0) setStudentId(id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Student Fee Ledger</h1>
        <p className="text-sm text-slate-500">Complete fee history for a student.</p>
      </div>

      <div className="card flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input w-full pl-9"
            placeholder="Enter Student ID..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button className="btn-primary" onClick={handleSearch} disabled={isLoading}>
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
        </button>
      </div>

      {data && (
        <>
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy-900">Student Info</h3>
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div><span className="text-xs text-slate-500">Name</span><p className="font-medium text-navy-900">{data.student?.name}</p></div>
              <div><span className="text-xs text-slate-500">Admission No</span><p className="font-medium text-navy-900">{data.student?.admissionNo}</p></div>
              <div><span className="text-xs text-slate-500">Class</span><p className="font-medium text-navy-900">{data.student?.class?.name}</p></div>
              <div><span className="text-xs text-slate-500">Session</span><p className="font-medium text-navy-900">{data.student?.session?.name}</p></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[{ label: 'Total Charged', value: data.summary?.totalCharged, color: 'text-navy-900' },
              { label: 'Total Paid', value: data.summary?.totalPaid, color: 'text-emerald-600' },
              { label: 'Outstanding', value: data.summary?.outstandingBalance, color: 'text-amber-600' },
              { label: 'Advance Balance', value: data.summary?.advanceBalance, color: 'text-blue-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-4">
                <div className="text-xs text-slate-500">{label}</div>
                <div className={`text-xl font-bold ${color}`}>{formatCurrency(value ?? 0)}</div>
              </div>
            ))}
          </div>

          <div className="card overflow-x-auto p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy-900">Charge History</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500">
                  <th className="pb-2 pr-4 font-medium">Month</th>
                  <th className="pb-2 pr-4 font-medium">Head</th>
                  <th className="pb-2 pr-4 font-medium">Amount</th>
                  <th className="pb-2 pr-4 font-medium">Fine</th>
                  <th className="pb-2 pr-4 font-medium">Paid</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data.charges ?? []).map((c: any) => (
                  <tr key={c.id} className="border-b border-slate-50 text-navy-900 last:border-0">
                    <td className="py-2.5 pr-4">{c.feeMonth}</td>
                    <td className="py-2.5 pr-4 font-medium">{c.feeHead?.name}</td>
                    <td className="py-2.5 pr-4">{formatCurrency(Number(c.amount))}</td>
                    <td className="py-2.5 pr-4">{formatCurrency(Number(c.fine))}</td>
                    <td className="py-2.5 pr-4 text-emerald-600">{formatCurrency(Number(c.paidAmount))}</td>
                    <td className="py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                        c.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700' :
                        c.status === 'OVERDUE' ? 'bg-red-50 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
