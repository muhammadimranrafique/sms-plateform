'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

function uuid() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export default function PromotionsPage() {
  const [studentIds, setStudentIds] = useState('');
  const [newClassId, setNewClassId] = useState('');
  const [newSessionId, setNewSessionId] = useState('');

  const promote = useMutation({
    mutationFn: () =>
      api.post('/promotions', {
        studentIds: studentIds
          .split(',')
          .map((s) => Number(s.trim()))
          .filter(Boolean),
        newClassId: Number(newClassId),
        newSessionId: Number(newSessionId),
        // Idempotency key generated per submission — prevents double promotion.
        idempotencyKey: uuid(),
      }),
    onSuccess: (res: unknown) => {
      const r = res as { promoted: number; idempotentReplay: boolean };
      toast.success(
        r.idempotentReplay
          ? 'Batch already processed (idempotent replay)'
          : `Promoted ${r.promoted} student(s)`,
      );
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : 'Promotion failed'),
  });

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Promote Students</h1>
        <p className="text-sm text-slate-500">
          Move students to a new class and session. Safe to retry — promotions are idempotent.
        </p>
      </div>
      <div className="card space-y-4">
        <div>
          <label className="text-sm font-medium">Student IDs (comma-separated)</label>
          <input
            className="input mt-1"
            placeholder="1, 2, 3"
            value={studentIds}
            onChange={(e) => setStudentIds(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">New Class ID</label>
            <input
              className="input mt-1"
              type="number"
              value={newClassId}
              onChange={(e) => setNewClassId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">New Session ID</label>
            <input
              className="input mt-1"
              type="number"
              value={newSessionId}
              onChange={(e) => setNewSessionId(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => promote.mutate()} disabled={promote.isPending}>
            {promote.isPending ? 'Promoting\u2026' : 'Promote'}
          </Button>
        </div>
      </div>
    </div>
  );
}
