'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateSessionDto, UpdateSessionDto } from '@sms/types';
import { api } from '../api/client';

export interface SessionRow {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

const keys = {
  all: ['sessions'] as const,
};

export function useSessions() {
  return useQuery({
    queryKey: keys.all,
    queryFn: () => api.get<SessionRow[]>('/sessions'),
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSessionDto) => api.post<SessionRow>('/sessions', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdateSession(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateSessionDto) => api.patch<SessionRow>(`/sessions/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useRolloverSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post<SessionRow>(`/sessions/${id}/rollover`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
