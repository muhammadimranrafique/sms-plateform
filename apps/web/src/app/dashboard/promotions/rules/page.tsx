'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CreatePromotionRuleSchema, type CreatePromotionRuleDto } from '@sms/types';
import { usePromotionRules, useCreatePromotionRule } from '@/lib/hooks/usePromotionRules';
import { useSessions } from '@/lib/hooks/useSessions';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';


export default function PromotionRulesPage() {
  const { data: rules, isLoading } = usePromotionRules();
  const { data: sessions } = useSessions();
  const createRule = useCreatePromotionRule();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<CreatePromotionRuleDto>({
    resolver: zodResolver(CreatePromotionRuleSchema),
    defaultValues: { passPercentage: 40, feeClearanceRequired: true },
  });

  async function onSubmit(values: CreatePromotionRuleDto) {
    try {
      await createRule.mutateAsync(values);
      toast.success('Promotion rule created');
      setShowForm(false);
      form.reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to create rule');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-navy-900">Promotion Rules</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Rule'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl card grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="col-span-full">
            <label className="text-sm font-medium">Rule Name</label>
            <input className="input mt-1" placeholder="e.g. Standard Promotion 2025" {...form.register('name')} />
            {form.formState.errors.name && <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Session</label>
            <select className="input mt-1" {...form.register('sessionId', { valueAsNumber: true })}>
              <option value="">Select session...</option>
              {sessions?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {form.formState.errors.sessionId && <p className="mt-1 text-xs text-red-500">{form.formState.errors.sessionId.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Pass Percentage</label>
            <input className="input mt-1" type="number" {...form.register('passPercentage', { valueAsNumber: true })} />
            {form.formState.errors.passPercentage && <p className="mt-1 text-xs text-red-500">{form.formState.errors.passPercentage.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="feeClearance" className="h-4 w-4" {...form.register('feeClearanceRequired')} />
            <label htmlFor="feeClearance" className="text-sm font-medium">Fee Clearance Required</label>
          </div>
          <div className="col-span-full flex justify-end">
            <Button type="submit" disabled={createRule.isPending}>
              {createRule.isPending ? 'Saving...' : 'Create Rule'}
            </Button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Pass %</th>
              <th className="px-4 py-3">Fee Clearance</th>
              <th className="px-4 py-3">Active</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
            )}
            {rules?.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-slate-500">{r.session?.name ?? '—'}</td>
                <td className="px-4 py-3">{r.passPercentage}%</td>
                <td className="px-4 py-3">{r.feeClearanceRequired ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">{r.isActive ? 'Yes' : 'No'}</td>
              </tr>
            ))}
            {rules && rules.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No rules defined.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
