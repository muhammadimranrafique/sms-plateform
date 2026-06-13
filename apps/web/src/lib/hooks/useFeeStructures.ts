'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { FeeHeadDto, CreateFeeStructureDto, UpdateFeeStructureDto, FeeStructureQuery } from '@sms/types';
import { api } from '../api/client';

export interface FeeHeadRow {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface FeeStructureRow {
  id: number;
  name: string;
  classId: number;
  sessionId: number;
  isActive: boolean;
  createdAt: string;
  class?: { name: string };
  session?: { name: string };
  items?: FeeStructureItemRow[];
}

export interface FeeStructureItemRow {
  id: number;
  feeHeadId: number;
  amount: string;
  feeHead?: { name: string; code: string };
}

const keys = {
  heads: ['fee-heads'] as const,
  structures: ['fee-structures'] as const,
};

export function useFeeHeads() {
  return useQuery({
    queryKey: keys.heads,
    queryFn: () => api.get<FeeHeadRow[]>('/fee-structures/heads'),
  });
}

export function useCreateFeeHead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: FeeHeadDto) => api.post<FeeHeadRow>('/fee-structures/heads', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.heads }),
  });
}

export function useFeeStructures(query: Partial<FeeStructureQuery> = {}) {
  const params = new URLSearchParams(
    Object.entries(query).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
  ).toString();
  return useQuery({
    queryKey: [...keys.structures, query],
    queryFn: () => api.get<FeeStructureRow[]>(`/fee-structures${params ? `?${params}` : ''}`),
  });
}

export function useFeeStructure(id: number) {
  return useQuery({
    queryKey: [...keys.structures, id],
    queryFn: () => api.get<FeeStructureRow>(`/fee-structures/${id}`),
    enabled: !!id,
  });
}

export function useCreateFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFeeStructureDto) => api.post<FeeStructureRow>('/fee-structures', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.structures }),
  });
}

export function useUpdateFeeStructure(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateFeeStructureDto) => api.patch<FeeStructureRow>(`/fee-structures/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.structures }),
  });
}

export function useDeleteFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/fee-structures/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.structures }),
  });
}
