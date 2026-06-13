'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useReceivePayment } from '@/lib/hooks/usePayment';
import { useStudents } from '@/lib/hooks/useStudents';
import { useVouchers } from '@/lib/hooks/useVouchers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApiError } from '@/lib/api/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PaymentReceipt, type PaymentReceiptData } from '@/components/payments/PaymentReceipt';
import { Printer, Receipt, Plus, ArrowLeft, CheckCircle2 } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ONLINE', label: 'Online' },
] as const;

export default function RecordPaymentPage() {
  const router = useRouter();
  const receiptRef = useRef<HTMLDivElement>(null);
  const receivePayment = useReceivePayment();

  const [studentId, setStudentId] = useState<number | null>(null);
  const [selectedVoucherNo, setSelectedVoucherNo] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<string>('CASH');
  const [referenceNo, setReferenceNo] = useState('');
  const [isAdvance, setIsAdvance] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [successData, setSuccessData] = useState<{
    result: any;
    studentName: string;
    admissionNo: string;
    className: string;
  } | null>(null);

  const { data: students } = useStudents({ limit: 200 });

  const { data: vouchers } = useVouchers({
    studentId: studentId ?? undefined,
    limit: 50,
  });

  const openVouchers = useMemo(() => {
    if (!vouchers) return [];
    return vouchers.filter((v) => ['PENDING', 'PARTIAL', 'OVERDUE'].includes(v.status));
  }, [vouchers]);

  const selectedVoucher = useMemo(() => {
    if (!selectedVoucherNo || !vouchers) return null;
    return vouchers.find((v) => v.voucherNo === selectedVoucherNo) ?? null;
  }, [selectedVoucherNo, vouchers]);

  const outstandingTotal = useMemo(() => {
    if (!selectedVoucher) return 0;
    return Math.max(0, Number(selectedVoucher.netAmount));
  }, [selectedVoucher]);

  const parsedAmount = useMemo(() => {
    const val = parseFloat(amount);
    return isNaN(val) ? 0 : val;
  }, [amount]);

  const excessAmount = useMemo(() => {
    if (isAdvance || !selectedVoucher) return 0;
    return Math.max(0, parsedAmount - outstandingTotal);
  }, [parsedAmount, outstandingTotal, isAdvance, selectedVoucher]);

  const selectedStudent = useMemo(() => {
    if (!studentId || !students) return null;
    return students.find((s) => s.id === studentId) ?? null;
  }, [studentId, students]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) { toast.error('Please select a student'); return; }
    if (!selectedVoucherNo && !isAdvance) { toast.error('Please select a voucher or mark as advance'); return; }
    if (!amount || parsedAmount <= 0) { toast.error('Please enter a valid amount'); return; }

    try {
      const result = await receivePayment.mutateAsync({
        studentId,
        voucherNo: isAdvance ? undefined : selectedVoucherNo,
        amount: parsedAmount,
        method: method as 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE',
        referenceNo: referenceNo || undefined,
        paidAt: new Date(),
        isAdvance,
        remarks: remarks || undefined,
      });

      setSuccessData({
        result,
        studentName: selectedStudent?.name ?? '—',
        admissionNo: selectedStudent?.admissionNo ?? '—',
        className: selectedStudent?.class
          ? `${selectedStudent.class.name}${selectedStudent.class.section ? ` - ${selectedStudent.class.section}` : ''}`
          : '—',
      });

      toast.success('Payment recorded successfully');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to record payment');
    }
  }

  function handlePrintReceipt() {
    window.print();
  }

  function handleReset() {
    setSuccessData(null);
    setAmount('');
    setReferenceNo('');
    setRemarks('');
    setSelectedVoucherNo('');
  }

  if (successData) {
    const { result, studentName, admissionNo, className } = successData;
    const receiptData: PaymentReceiptData = {
      paymentId: result.paymentId,
      studentId: studentId!,
      studentName,
      admissionNo,
      className,
      voucherNo: selectedVoucherNo || null,
      amount: parsedAmount,
      method,
      referenceNo: referenceNo || null,
      paidAt: new Date(),
      isAdvance,
      advanceBalance: result.advanceBalance ?? 0,
      voucherStatus: result.voucherStatus?.status ?? null,
      allocations: result.allocations ?? [],
    };

    return (
      <div className="max-w-2xl space-y-6">
        {/* Success banner */}
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 size={24} className="text-green-600" />
          <div className="flex-1">
            <h2 className="font-bold text-green-800">Payment Recorded Successfully</h2>
            <p className="text-sm text-green-700">
              PKR {formatCurrency(parsedAmount)} received from {studentName}
              {result.voucherStatus?.status && (
                <> &mdash; Voucher status: <Badge value={result.voucherStatus.status} /></>
              )}
            </p>
          </div>
        </div>

        {/* Payment summary card */}
        <div className="card grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-500">Receipt #</span>
            <p className="font-mono font-bold">{result.paymentId}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Date & Time</span>
            <p className="font-medium">{formatDate(new Date())}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Method</span>
            <p className="font-medium">{PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Reference</span>
            <p className="font-mono text-xs">{referenceNo || '—'}</p>
          </div>
          {selectedVoucherNo && (
            <div>
              <span className="text-xs text-slate-500">Voucher</span>
              <p className="font-mono text-xs font-medium text-navy-700">{selectedVoucherNo}</p>
            </div>
          )}
          <div>
            <span className="text-xs text-slate-500">Advance Balance</span>
            <p className="font-medium text-amber-700">{formatCurrency(result.advanceBalance ?? 0)}</p>
          </div>
        </div>

        {/* Allocations breakdown */}
        {result.allocations && result.allocations.length > 0 && (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3">Charge ID</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Fine Paid</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {result.allocations.map((a: any) => (
                  <tr key={a.feeChargeId} className="border-b border-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{a.feeChargeId}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(a.amount)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(a.finePaid)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(a.amount + a.finePaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handlePrintReceipt}>
            <Printer size={16} /> Print Receipt
          </Button>
          {selectedVoucherNo && (
            <Button variant="ghost" onClick={() => window.open(`/dashboard/vouchers/by-voucher-no/${selectedVoucherNo}/print`, '_blank')}>
              <Receipt size={16} /> Print Voucher
            </Button>
          )}
          <Button variant="ghost" onClick={handleReset}>
            <Plus size={16} /> Record Another
          </Button>
          <Button variant="ghost" onClick={() => router.push('/dashboard/payments')}>
            <ArrowLeft size={16} /> Go to Payments
          </Button>
        </div>

        {/* Hidden receipt for printing */}
        <div ref={receiptRef} className="print-only">
          <PaymentReceipt data={receiptData} />
        </div>

        <style>{`
          @media print {
            body * { visibility: hidden; }
            .print-only, .print-only * { visibility: visible; }
            .print-only { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
            .card, .flex-wrap { display: none !important; }
            .rounded-xl.border-green-200 { display: none !important; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded p-1 text-slate-400 hover:text-navy-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-2xl font-bold text-navy-900">Record Payment</h1>
      </div>

      <form onSubmit={handleSubmit} className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="col-span-full">
          <label className="text-sm font-medium">Student</label>
          <select
            className="input mt-1"
            value={studentId ?? ''}
            onChange={(e) => {
              setStudentId(e.target.value ? Number(e.target.value) : null);
              setSelectedVoucherNo('');
            }}
            required
          >
            <option value="">Select student...</option>
            {students?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.admissionNo} — {s.name}
              </option>
            ))}
          </select>
        </div>

        {!isAdvance && (
          <div className="col-span-full">
            <label className="text-sm font-medium">Voucher (select outstanding)</label>
            <select
              className="input mt-1"
              value={selectedVoucherNo}
              onChange={(e) => setSelectedVoucherNo(e.target.value)}
              disabled={!studentId}
            >
              <option value="">{studentId ? 'Select a voucher...' : 'Select a student first'}</option>
              {openVouchers.map((v) => (
                <option key={v.voucherNo} value={v.voucherNo}>
                  {v.voucherNo} — {formatDate(v.dueDate)} — {formatCurrency(Number(v.netAmount))} [{v.status}]
                </option>
              ))}
            </select>
            {openVouchers.length === 0 && studentId && (
              <p className="mt-1 text-xs text-amber-600">No outstanding vouchers for this student.</p>
            )}
          </div>
        )}

        {selectedVoucher && !isAdvance && (
          <div className="col-span-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Status</span>
                <p className="font-medium"><Badge value={selectedVoucher.status} /></p>
              </div>
              <div>
                <span className="text-slate-500">Due Date</span>
                <p className="font-medium">{formatDate(selectedVoucher.dueDate)}</p>
              </div>
              <div>
                <span className="text-slate-500">Fee Month</span>
                <p className="font-medium">{selectedVoucher.feeMonth ?? '—'}</p>
              </div>
              <div>
                <span className="text-slate-500">Total Due</span>
                <p className="font-bold text-navy-700">{formatCurrency(outstandingTotal)}</p>
              </div>
            </div>
            {selectedVoucher.lines && selectedVoucher.lines.length > 0 && (
              <div className="mt-2 border-t border-slate-200 pt-2 text-xs">
                <p className="mb-1 text-slate-500">Line items:</p>
                {selectedVoucher.lines.map((line) => (
                  <div key={line.id} className="flex justify-between">
                    <span>{line.feeHead?.name ?? line.description ?? 'Fee'}</span>
                    <span className="font-medium">{formatCurrency(Number(line.amount))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="col-span-full flex items-center gap-2">
          <input
            type="checkbox"
            id="isAdvance"
            checked={isAdvance}
            onChange={(e) => {
              setIsAdvance(e.target.checked);
              if (e.target.checked) setSelectedVoucherNo('');
            }}
            className="h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="isAdvance" className="text-sm">Mark as advance payment (no voucher required)</label>
        </div>

        <div className="col-span-full sm:col-span-1">
          <label className="text-sm font-medium">Amount</label>
          <input
            className="input mt-1"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          {excessAmount > 0 && (
            <p className="mt-1 text-xs text-amber-600">
              PKR {excessAmount.toFixed(2)} exceeds voucher total — will be recorded as advance.
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium">Payment Method</label>
          <select className="input mt-1" value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="col-span-full sm:col-span-1">
          <label className="text-sm font-medium">Reference / Transaction ID</label>
          <input
            className="input mt-1"
            placeholder="Optional"
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
          />
        </div>

        <div className="col-span-full">
          <label className="text-sm font-medium">Remarks (optional)</label>
          <input
            className="input mt-1"
            placeholder="Any notes"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <div className="col-span-full flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={receivePayment.isPending}>
            {receivePayment.isPending ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
