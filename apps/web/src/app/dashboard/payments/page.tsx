'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePaymentHistory } from '@/lib/hooks/usePayment';
import { useStudents } from '@/lib/hooks/useStudents';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditCard } from 'lucide-react';

export default function PaymentsPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const { data: students } = useStudents({ limit: 200 });
  const { data: historyData, isLoading } = usePaymentHistory(selectedStudentId!);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-navy-900">Payments</h1>
        <Link href="/dashboard/payments/new">
          <Button><CreditCard size={16} /> Record Payment</Button>
        </Link>
      </div>

      <div className="card flex items-center gap-3">
        <label className="text-sm font-medium text-nowrap">Filter by Student:</label>
        <select
          className="input max-w-80"
          value={selectedStudentId ?? ''}
          onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Select a student...</option>
          {students?.map((s) => (
            <option key={s.id} value={s.id}>{s.admissionNo} — {s.name}</option>
          ))}
        </select>
      </div>

      {!selectedStudentId && (
        <div className="card flex flex-col items-center gap-3 py-12 text-slate-400">
          <CreditCard size={48} className="text-slate-200" />
          <p>Select a student to view payment history</p>
        </div>
      )}

      {selectedStudentId && isLoading && (
        <p className="text-slate-400">Loading payments...</p>
      )}

      {selectedStudentId && historyData && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-xs text-slate-500">Total Paid</p>
              <p className="mt-1 text-xl font-bold text-green-700">{formatCurrency(historyData.totalPaid)}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-slate-500">Total Reversed</p>
              <p className="mt-1 text-xl font-bold text-red-600">{formatCurrency(historyData.totalReversed)}</p>
            </div>
            <div className="card text-center">
              <p className="text-xs text-slate-500">Advance Balance</p>
              <p className="mt-1 text-xl font-bold text-navy-700">{formatCurrency(historyData.advanceBalance)}</p>
            </div>
          </div>

          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Charges</th>
                </tr>
              </thead>
              <tbody>
                {historyData.payments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No payments recorded for this student.
                    </td>
                  </tr>
                )}
                {historyData.payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{p.id}</td>
                    <td className="px-4 py-3">{formatDate(p.paidAt)}</td>
                    <td className="px-4 py-3">
                      <Badge value={p.method} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.referenceNo ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge value={p.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {p.allocations.length} charge(s)
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
