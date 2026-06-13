'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePromotionRuleDto, UpdatePromotionRuleDto, PromotionRuleQuery } from '@sms/types';
import { api } from '../api/client';

export interface PromotionRuleRow {
  id: number;
  name: string;
  sessionId: number;
  passPercentage: number;
  feeClearanceRequired: boolean;
  isActive: boolean;
  createdAt: string;
  session?: { name: string };
}

const keys = {
  all: ['promotion-rules'] as const,
  list: (q: Partial<PromotionRuleQuery>) => ['promotion-rules', 'list', q] as const,
};

export function usePromotionRules(query: Partial<PromotionRuleQuery> = {}) {
  const params = new URLSearchParams(
    Object.entries(query).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
  ).toString();
  return useQuery({
    queryKey: keys.list(query),
    queryFn: () => api.get<PromotionRuleRow[]>(`/promotions/rules${params ? `?${params}` : ''}`),
  });
}

export function useCreatePromotionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePromotionRuleDto) => api.post<PromotionRuleRow>('/promotions/rules', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdatePromotionRule(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdatePromotionRuleDto) => api.patch<PromotionRuleRow>(`/promotions/rules/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
