'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GenerateVoucherDto, GenerateBatchVoucherDto, GenerateAllMonthsVoucherDto, UpdateVoucherStatusDto, VoucherQuery } from '@sms/types';
import { api } from '../api/client';

export interface VoucherRow {
  id: number;
  voucherNo: string;
  amount: string;
  netAmount: string;
  dueDate: string;
  status: string;
  feeMonth?: string | null;
  lateFine: string;
  discount: string;
  arrears: string;
  student?: { id: number; name: string; admissionNo: string };
  lines?: VoucherLineRow[];
}

export interface VoucherLineRow {
  id: number;
  feeHeadId: number;
  description: string | null;
  amount: string;
  feeHead?: { name: string; code: string };
}

const keys = {
  all: ['vouchers'] as const,
  list: (q: Partial<VoucherQuery>) => ['vouchers', 'list', q] as const,
  detail: (id: number) => ['vouchers', id] as const,
};

export function useVouchers(query: Partial<VoucherQuery> = {}) {
  const params = new URLSearchParams(
    Object.entries(query).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
  ).toString();
  return useQuery({
    queryKey: keys.list(query),
    queryFn: () => api.get<VoucherRow[]>(`/vouchers${params ? `?${params}` : ''}`),
  });
}

export function useVoucher(id: number) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => api.get<VoucherRow>(`/vouchers/${id}`),
    enabled: !!id,
  });
}

export function useGenerateVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: GenerateVoucherDto) => api.post<VoucherRow>('/vouchers/generate', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useGenerateBatchVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: GenerateBatchVoucherDto) => api.post<VoucherRow[]>('/vouchers/generate/batch', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useGenerateAllMonthsVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: GenerateAllMonthsVoucherDto) => api.post<VoucherRow[]>('/vouchers/generate/all-months', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdateVoucherStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateVoucherStatusDto) => api.patch<VoucherRow>(`/vouchers/${id}/status`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
