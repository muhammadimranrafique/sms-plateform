'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { SinglePromotionSchema, type SinglePromotionDto, type BulkPromotionExecuteDto } from '@sms/types';
import { usePromoteSingle, useBulkPreview, useBulkExecute, usePromotionBatches, useRollbackBatch, usePromotions } from '@/lib/hooks/usePromotions';
import { usePromotionRules } from '@/lib/hooks/usePromotionRules';
import { useStudents } from '@/lib/hooks/useStudents';
import { useClasses } from '@/lib/hooks/useClasses';
import { useSessions } from '@/lib/hooks/useSessions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';

function uuid() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

type Tab = 'single' | 'bulk' | 'history';

export default function PromotionsPage() {
  const [tab, setTab] = useState<Tab>('single');

  const { data: classes } = useClasses();
  const { data: sessions } = useSessions();
  const { data: students, isLoading: studentsLoading } = useStudents({ limit: 100 });
  const { data: rules } = usePromotionRules();
  const { data: batches, isLoading: batchesLoading } = usePromotionBatches();
  const { data: history, isLoading: historyLoading } = usePromotions({ limit: 50 });

  const promoteSingle = usePromoteSingle();
  const bulkPreview = useBulkPreview();
  const bulkExecute = useBulkExecute();
  const rollbackBatch = useRollbackBatch();

  const [fromSessionId, setFromSessionId] = useState<number>();
  const [toSessionId, setToSessionId] = useState<number>();
  const [ruleId, setRuleId] = useState<number>();
  const [preview, setPreview] = useState<{ items: any[]; totalEligible: number; totalDetained: number } | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [newClassId, setNewClassId] = useState<number>();

  const singleForm = useForm<SinglePromotionDto>({
    resolver: zodResolver(SinglePromotionSchema),
  });

  function toggleStudent(id: number) {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function handlePreview() {
    if (!fromSessionId || !toSessionId) {
      toast.error('Select both source and target sessions');
      return;
    }
    try {
      const result = await bulkPreview.mutateAsync({ fromSessionId, toSessionId, ruleId });
      setPreview(result);
      setSelectedStudentIds(result.items.filter((i) => i.eligible).map((i) => i.studentId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Preview failed');
    }
  }

  async function handleBulkExecute() {
    if (!newClassId || !toSessionId || selectedStudentIds.length === 0) {
      toast.error('Select target class, session, and at least one student');
      return;
    }
    try {
      const dto: BulkPromotionExecuteDto = {
        studentIds: selectedStudentIds,
        newClassId,
        newSessionId: toSessionId,
        idempotencyKey: uuid(),
        ruleId,
      };
      const result = await bulkExecute.mutateAsync(dto);
      toast.success(`Promoted ${result.promoted} student(s)`);
      setPreview(null);
      setSelectedStudentIds([]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Bulk promotion failed');
    }
  }

  async function handleSingle(data: SinglePromotionDto) {
    try {
      await promoteSingle.mutateAsync({ ...data, idempotencyKey: uuid() });
      toast.success('Student promoted');
      singleForm.reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Promotion failed');
    }
  }

  async function handleRollback(batchId: string) {
    if (!window.confirm('Rollback this promotion batch? Students will be restored to their previous class/session.')) return;
    try {
      await rollbackBatch.mutateAsync(batchId);
      toast.success('Batch rolled back');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Rollback failed');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-navy-900">Promotions</h1>
        <Link href="/dashboard/promotions/rules" className="btn-ghost text-sm">
          Manage Rules
        </Link>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {(['single', 'bulk', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t ? 'bg-navy-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t === 'single' ? 'Single Promotion' : t === 'bulk' ? 'Bulk Promotion' : 'History'}
          </button>
        ))}
      </div>

      {tab === 'single' && (
        <form onSubmit={singleForm.handleSubmit(handleSingle)} className="max-w-xl card grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="col-span-full">
            <label className="text-sm font-medium">Student</label>
            <select className="input mt-1" {...singleForm.register('studentId', { valueAsNumber: true })}>
              <option value="">{studentsLoading ? 'Loading students...' : 'Select student...'}</option>
              {students?.map((s) => (
                <option key={s.id} value={s.id}>{s.admissionNo} — {s.name}</option>
              ))}
            </select>
            {singleForm.formState.errors.studentId && (
              <p className="mt-1 text-xs text-red-500">{singleForm.formState.errors.studentId.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">New Class</label>
            <select className="input mt-1" {...singleForm.register('newClassId', { valueAsNumber: true })}>
              <option value="">Select class...</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>
              ))}
            </select>
            {singleForm.formState.errors.newClassId && (
              <p className="mt-1 text-xs text-red-500">{singleForm.formState.errors.newClassId.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">New Session</label>
            <select className="input mt-1" {...singleForm.register('newSessionId', { valueAsNumber: true })}>
              <option value="">Select session...</option>
              {sessions?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (Current)' : ''}</option>
              ))}
            </select>
            {singleForm.formState.errors.newSessionId && (
              <p className="mt-1 text-xs text-red-500">{singleForm.formState.errors.newSessionId.message}</p>
            )}
          </div>
          <div className="col-span-full">
            <label className="text-sm font-medium">Remarks (optional)</label>
            <input className="input mt-1" {...singleForm.register('remarks')} />
          </div>
          <div className="col-span-full flex justify-end">
            <Button type="submit" disabled={promoteSingle.isPending}>
              {promoteSingle.isPending ? 'Promoting...' : 'Promote'}
            </Button>
          </div>
        </form>
      )}

      {tab === 'bulk' && (
        <div className="space-y-4">
          <div className="card grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium">From Session</label>
              <select className="input mt-1" value={fromSessionId ?? ''} onChange={(e) => setFromSessionId(e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">Select...</option>
                {sessions?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">To Session</label>
              <select className="input mt-1" value={toSessionId ?? ''} onChange={(e) => setToSessionId(e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">Select...</option>
                {sessions?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Promotion Rule (optional)</label>
              <select className="input mt-1" value={ruleId ?? ''} onChange={(e) => setRuleId(e.target.value ? Number(e.target.value) : undefined)}>
                <option value="">None</option>
                {rules?.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={handlePreview} disabled={bulkPreview.isPending}>
            {bulkPreview.isPending ? 'Loading...' : 'Preview Eligible Students'}
          </Button>

          {preview && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
                  Eligible: {preview.totalEligible}
                </span>
                <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
                  Detained: {preview.totalDetained}
                </span>
              </div>

              <div>
                <label className="text-sm font-medium">Target Class for Promotion</label>
                <select className="input mt-1 max-w-xs" value={newClassId ?? ''} onChange={(e) => setNewClassId(e.target.value ? Number(e.target.value) : undefined)}>
                  <option value="">Select class...</option>
                  {classes?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="card overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.length === preview.items.length}
                          onChange={() => {
                            if (selectedStudentIds.length === preview.items.length) setSelectedStudentIds([]);
                            else setSelectedStudentIds(preview.items.map((i) => i.studentId));
                          }}
                          className="h-4 w-4"
                        />
                      </th>
                      <th className="px-4 py-3">Admission No</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Current Class</th>
                      <th className="px-4 py-3">Eligible</th>
                      <th className="px-4 py-3">Reasons</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.items.map((item) => (
                      <tr key={item.studentId} className={`border-b border-slate-50 hover:bg-slate-50 ${!item.eligible ? 'bg-red-50/50' : ''}`}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(item.studentId)}
                            onChange={() => toggleStudent(item.studentId)}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{item.admissionNo}</td>
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-slate-500">{item.currentClass}</td>
                        <td className="px-4 py-3">
                          {item.eligible
                            ? <span className="text-green-600">Yes</span>
                            : <span className="text-red-600">No</span>
                          }
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {item.reasons?.join(', ') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleBulkExecute} disabled={bulkExecute.isPending || selectedStudentIds.length === 0}>
                  {bulkExecute.isPending
                    ? 'Executing...'
                    : `Promote Selected (${selectedStudentIds.length})`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-lg font-semibold text-navy-900 mb-2">Promotion Batches</h2>
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Batch ID</th>
                    <th className="px-4 py-3">Students</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Reverted At</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batchesLoading && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
                  )}
                  {batches?.map((b) => (
                    <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">{b.id.slice(0, 8)}...</td>
                      <td className="px-4 py-3">{b._count.promotions}</td>
                      <td className="px-4 py-3"><Badge value={b.status} /></td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(b.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-500">{b.revertedAt ? formatDate(b.revertedAt) : '—'}</td>
                      <td className="px-4 py-3">
                        {b.status === 'EXECUTED' && (
                          <button
                            onClick={() => handleRollback(b.id)}
                            className="flex items-center gap-1 rounded p-1 text-sm text-amber-600 hover:bg-amber-50"
                            title="Rollback"
                          >
                            <RotateCcw size={14} /> Rollback
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {batches && batches.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No batches found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="font-display text-lg font-semibold text-navy-900 mb-2">Individual Promotion History</h2>
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">From</th>
                    <th className="px-4 py-3">To</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLoading && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
                  )}
                  {history?.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{p.student?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {p.oldClass?.name ?? '?'} ({p.oldSession?.name ?? '?'})
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {p.newClass?.name ?? '?'} ({p.newSession?.name ?? '?'})
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                  {history && history.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No promotions yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
