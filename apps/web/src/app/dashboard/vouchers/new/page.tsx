'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { GenerateVoucherSchema, GenerateBatchVoucherSchema, type GenerateVoucherDto, type GenerateBatchVoucherDto } from '@sms/types';
import { useGenerateVoucher, useGenerateBatchVoucher, useGenerateAllMonthsVoucher } from '@/lib/hooks/useVouchers';
import { useStudents } from '@/lib/hooks/useStudents';
import { useClasses } from '@/lib/hooks/useClasses';
import { useSessions } from '@/lib/hooks/useSessions';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function GenerateVoucherPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [generateAll, setGenerateAll] = useState(false);

  const generateSingle = useGenerateVoucher();
  const generateBatch = useGenerateBatchVoucher();
  const generateAllMonths = useGenerateAllMonthsVoucher();

  const { data: students, isLoading: studentsLoading } = useStudents({ limit: 100 });
  const { data: classes } = useClasses();
  const { data: sessions } = useSessions();

  const singleForm = useForm<GenerateVoucherDto>({
    resolver: zodResolver(GenerateVoucherSchema),
  });

  const batchForm = useForm<GenerateBatchVoucherDto>({
    resolver: zodResolver(GenerateBatchVoucherSchema),
  });

  function getDefaultDueDate(): string {
    const d = new Date();
    d.setDate(10);
    if (d.getDate() > 10) d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0]!;
  }

  async function handleSingle(data: GenerateVoucherDto) {
    try {
      if (generateAll) {
        await generateAllMonths.mutateAsync({
          studentId: data.studentId,
          dueDate: data.dueDate,
          remarks: data.remarks,
        });
        toast.success('Vouchers generated for all 12 months');
      } else {
        await generateSingle.mutateAsync(data);
        toast.success('Voucher generated');
      }
      router.push('/dashboard/vouchers');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to generate voucher');
    }
  }

  function uuid() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  }

  function handleBatchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formEl = e.target as HTMLFormElement;
    const fd = new FormData(formEl);
    const classId = Number(fd.get('classId'));
    const sessionId = Number(fd.get('sessionId'));
    const feeMonth = fd.get('feeMonth') as string;
    const dueDate = fd.get('dueDate') as string;
    const remarks = fd.get('remarks') as string;
    if (!classId || !sessionId || !feeMonth || !dueDate) {
      toast.error('Please fill in class, session, fee month, and due date');
      return;
    }
    generateBatch.mutate(
      { classId, sessionId, dueDate: new Date(dueDate), feeMonth, idempotencyKey: uuid(), remarks: remarks || undefined },
      {
        onSuccess: (result) => {
          toast.success(`Generated ${result.length} voucher(s)`);
          router.push('/dashboard/vouchers');
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : 'Failed to generate vouchers');
        },
      },
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy-900">Generate Vouchers</h1>

      <div className="flex gap-2">
        <Button variant={mode === 'single' ? 'primary' : 'ghost'} onClick={() => setMode('single')}>
          Single Student
        </Button>
        <Button variant={mode === 'batch' ? 'primary' : 'ghost'} onClick={() => setMode('batch')}>
          Whole Class
        </Button>
      </div>

      {mode === 'single' ? (
        <form onSubmit={singleForm.handleSubmit(handleSingle)} className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="col-span-full">
            <label className="text-sm font-medium">Student</label>
            <select className="input mt-1" {...singleForm.register('studentId', { valueAsNumber: true })}>
              <option value="">{studentsLoading ? 'Loading students...' : 'Select student...'}</option>
              {students?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.admissionNo} — {s.name}
                </option>
              ))}
            </select>
            {singleForm.formState.errors.studentId && (
              <p className="mt-1 text-xs text-red-500">{singleForm.formState.errors.studentId.message}</p>
            )}
          </div>

          {!generateAll && (
            <div>
              <label className="text-sm font-medium">Fee Month</label>
              <select
                className="input mt-1"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  if (e.target.value) singleForm.setValue('feeMonth', e.target.value as any);
                  else singleForm.setValue('feeMonth', undefined as any);
                }}
              >
                <option value="">Select month...</option>
                {MONTHS.map((m, i) => {
                  const val = `2025-${String(i + 1).padStart(2, '0')}`;
                  return <option key={val} value={val}>{m}</option>;
                })}
              </select>
              {singleForm.formState.errors.feeMonth && (
                <p className="mt-1 text-xs text-red-500">{singleForm.formState.errors.feeMonth.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Due Date</label>
            <input className="input mt-1" type="date" defaultValue={getDefaultDueDate()} {...singleForm.register('dueDate')} />
            {singleForm.formState.errors.dueDate && (
              <p className="mt-1 text-xs text-red-500">{singleForm.formState.errors.dueDate.message}</p>
            )}
          </div>

          <div className="col-span-full flex items-center gap-2">
            <input
              type="checkbox"
              id="generateAll"
              checked={generateAll}
              onChange={(e) => setGenerateAll(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <label htmlFor="generateAll" className="text-sm">Generate for all 12 months</label>
          </div>

          <div className="col-span-full">
            <label className="text-sm font-medium">Remarks (optional)</label>
            <input className="input mt-1" {...singleForm.register('remarks')} />
          </div>

          <div className="col-span-full flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={generateSingle.isPending || generateAllMonths.isPending}>
              {(generateSingle.isPending || generateAllMonths.isPending) ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleBatchSubmit} className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Class</label>
            <select className="input mt-1" {...batchForm.register('classId', { valueAsNumber: true })}>
              <option value="">Select class...</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>
              ))}
            </select>
            {batchForm.formState.errors.classId && (
              <p className="mt-1 text-xs text-red-500">{batchForm.formState.errors.classId.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Session</label>
            <select className="input mt-1" {...batchForm.register('sessionId', { valueAsNumber: true })}>
              <option value="">Select session...</option>
              {sessions?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (Current)' : ''}</option>
              ))}
            </select>
            {batchForm.formState.errors.sessionId && (
              <p className="mt-1 text-xs text-red-500">{batchForm.formState.errors.sessionId.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Fee Month</label>
            <select className="input mt-1" defaultValue="" {...batchForm.register('feeMonth')}>
              <option value="">Select month...</option>
              {MONTHS.map((m, i) => {
                const val = `2025-${String(i + 1).padStart(2, '0')}`;
                return <option key={val} value={val}>{m}</option>;
              })}
            </select>
            {batchForm.formState.errors.feeMonth && (
              <p className="mt-1 text-xs text-red-500">{batchForm.formState.errors.feeMonth.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Due Date</label>
            <input className="input mt-1" type="date" defaultValue={getDefaultDueDate()} {...batchForm.register('dueDate')} />
            {batchForm.formState.errors.dueDate && (
              <p className="mt-1 text-xs text-red-500">{batchForm.formState.errors.dueDate.message}</p>
            )}
          </div>
          <div className="col-span-full">
            <label className="text-sm font-medium">Remarks (optional)</label>
            <input className="input mt-1" {...batchForm.register('remarks')} />
          </div>
          <div className="col-span-full flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={generateBatch.isPending}>
              {generateBatch.isPending ? 'Generating...' : 'Generate for Class'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
