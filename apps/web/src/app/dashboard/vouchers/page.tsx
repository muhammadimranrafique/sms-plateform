'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface VoucherRow {
  id: number;
  voucherNo: string;
  amount: string;
  dueDate: string;
  status: string;
  feeMonth?: string | null;
  student?: { name: string; admissionNo: string };
}

export default function VouchersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['vouchers'],
    queryFn: () => api.get<VoucherRow[]>('/vouchers?limit=20'),
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-navy-900">Vouchers</h1>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Voucher No</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
            {data?.map((v) => (
              <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{v.voucherNo}</td>
                <td className="px-4 py-3 font-medium">{v.student?.name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{v.feeMonth ?? '—'}</td>
                <td className="px-4 py-3">{formatCurrency(Number(v.amount))}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(v.dueDate)}</td>
                <td className="px-4 py-3">
                  <Badge value={v.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
