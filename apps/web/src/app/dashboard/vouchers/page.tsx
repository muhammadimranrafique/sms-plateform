'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVouchers } from '@/lib/hooks/useVouchers';
import { useClasses } from '@/lib/hooks/useClasses';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Eye } from 'lucide-react';

export default function VouchersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [classFilter, setClassFilter] = useState<number | undefined>();
  const { data: classes } = useClasses();
  const { data, isLoading } = useVouchers({
    limit: 50,
    status: statusFilter as any,
    classId: classFilter,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-navy-900">Vouchers</h1>
        <Link href="/dashboard/vouchers/new">
          <Button>+ Generate Voucher</Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <select className="input max-w-48" value={statusFilter ?? ''} onChange={(e) => setStatusFilter(e.target.value || undefined)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select className="input max-w-48" value={classFilter ?? ''} onChange={(e) => setClassFilter(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">All classes</option>
          {classes?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Voucher No</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Net</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
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
                <td className="px-4 py-3 font-medium">{formatCurrency(Number(v.netAmount))}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(v.dueDate)}</td>
                <td className="px-4 py-3">
                  <Badge value={v.status} />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => router.push(`/dashboard/vouchers/${v.id}`)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-navy-700"
                    title="View details"
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  No vouchers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
