'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useVoucher, useUpdateVoucherStatus } from '@/lib/hooks/useVouchers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

export default function VoucherDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data: voucher, isLoading } = useVoucher(id);
  const updateStatus = useUpdateVoucherStatus(id);
  const [selectedStatus, setSelectedStatus] = useState('');

  async function handleStatusUpdate() {
    if (!selectedStatus) return;
    try {
      await updateStatus.mutateAsync({ status: selectedStatus as any });
      toast.success('Status updated');
      setSelectedStatus('');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update status');
    }
  }

  if (isLoading) return <p className="text-slate-400">Loading voucher...</p>;
  if (!voucher) return <p className="text-red-500">Voucher not found</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded p-1 text-slate-400 hover:text-navy-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-2xl font-bold text-navy-900">
          Voucher {voucher.voucherNo}
        </h1>
        <Badge value={voucher.status} />
      </div>

      <div className="card grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-slate-500">Student</span>
          <p className="font-medium">{voucher.student?.name ?? '—'}</p>
          <p className="text-xs text-slate-400">{voucher.student?.admissionNo}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Fee Month</span>
          <p className="font-medium">{voucher.feeMonth ?? '—'}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Due Date</span>
          <p className="font-medium">{formatDate(voucher.dueDate)}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Total Amount</span>
          <p className="font-medium">{formatCurrency(Number(voucher.amount))}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Discount</span>
          <p className="font-medium">{formatCurrency(Number(voucher.discount))}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Late Fine</span>
          <p className="font-medium">{formatCurrency(Number(voucher.lateFine))}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Arrears</span>
          <p className="font-medium">{formatCurrency(Number(voucher.arrears))}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500">Net Amount</span>
          <p className="font-medium text-lg">{formatCurrency(Number(voucher.netAmount))}</p>
        </div>
      </div>

      {voucher.lines && voucher.lines.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">Fee Head</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {voucher.lines.map((line) => (
                <tr key={line.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-medium">{line.feeHead?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{line.description ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(Number(line.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card flex items-center gap-3">
        <span className="text-sm font-medium">Update Status:</span>
        <select className="input max-w-40" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option value="">Select...</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="OVERDUE">Overdue</option>
        </select>
        <Button onClick={handleStatusUpdate} disabled={!selectedStatus || updateStatus.isPending}>
          {updateStatus.isPending ? 'Updating...' : 'Update'}
        </Button>
      </div>
    </div>
  );
}
