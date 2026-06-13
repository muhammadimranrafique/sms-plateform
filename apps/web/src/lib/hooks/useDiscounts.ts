'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateDiscountDto, UpdateDiscountDto, DiscountQuery } from '@sms/types';
import { api } from '../api/client';

export interface DiscountRow {
  id: number;
  studentId: number;
  feeHeadId: number | null;
  type: string;
  value: string;
  reason: string | null;
  approvedBy: string | null;
  isActive: boolean;
  createdAt: string;
  student?: { name: string; admissionNo: string };
  feeHead?: { name: string };
}

const keys = {
  all: ['discounts'] as const,
  list: (q: Partial<DiscountQuery>) => ['discounts', 'list', q] as const,
};

export function useDiscounts(query: Partial<DiscountQuery> = {}) {
  const params = new URLSearchParams(
    Object.entries(query).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
  ).toString();
  return useQuery({
    queryKey: keys.list(query),
    queryFn: () => api.get<DiscountRow[]>(`/discounts${params ? `?${params}` : ''}`),
  });
}

export function useCreateDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDiscountDto) => api.post<DiscountRow>('/discounts', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdateDiscount(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateDiscountDto) => api.patch<DiscountRow>(`/discounts/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useDeleteDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/discounts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
