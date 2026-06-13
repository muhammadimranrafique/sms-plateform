'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PromotionQuery, SinglePromotionDto, BulkPromotionPreviewDto, BulkPromotionExecuteDto } from '@sms/types';
import { api } from '../api/client';

export interface PromotionRow {
  id: number;
  studentId: number;
  oldClassId: number;
  oldSessionId: number;
  newClassId: number;
  newSessionId: number;
  batchId: string | null;
  promotedAt: string;
  student?: { name: string; admissionNo: string };
  oldClass?: { name: string };
  newClass?: { name: string };
  oldSession?: { name: string };
  newSession?: { name: string };
}

export interface PromotionBatchRow {
  id: string;
  status: string;
  executedAt: string;
  revertedAt: string | null;
  _count: { promotions: number };
}

export interface BulkPreviewItem {
  studentId: number;
  studentName: string;
  admissionNo: string;
  currentClass: string;
  eligible: boolean;
  reasons: string[];
}

const keys = {
  all: ['promotions'] as const,
  list: (q: Partial<PromotionQuery>) => ['promotions', 'list', q] as const,
  batches: ['promotions', 'batches'] as const,
};

export function usePromotions(query: Partial<PromotionQuery> = {}) {
  const params = new URLSearchParams(
    Object.entries(query).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
  ).toString();
  return useQuery({
    queryKey: keys.list(query),
    queryFn: () => api.get<PromotionRow[]>(`/promotions${params ? `?${params}` : ''}`),
  });
}

export function usePromoteSingle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SinglePromotionDto) => api.post<PromotionRow>('/promotions/single', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useBulkPreview() {
  return useMutation({
    mutationFn: (dto: BulkPromotionPreviewDto) => api.post<BulkPreviewItem[]>('/promotions/bulk/preview', dto),
  });
}

export function useBulkExecute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkPromotionExecuteDto) => api.post<{ promoted: number; idempotentReplay: boolean }>('/promotions/bulk/execute', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useRollbackBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => api.post<unknown>(`/promotions/${batchId}/rollback`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function usePromotionBatches() {
  return useQuery({
    queryKey: keys.batches,
    queryFn: () => api.get<PromotionBatchRow[]>('/promotions?groupBy=batch'),
  });
}
