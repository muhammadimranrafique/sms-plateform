'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateClassDto, UpdateClassDto } from '@sms/types';
import { api } from '../api/client';

export interface ClassRow {
  id: number;
  name: string;
  section: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: { students: number };
}

const keys = {
  all: ['classes'] as const,
  detail: (id: number) => ['classes', id] as const,
};

export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: () => api.get<ClassRow[]>('/classes'),
  });
}

export function useClass(id: number) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => api.get<ClassRow>(`/classes/${id}`),
    enabled: !!id,
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateClassDto) => api.post<ClassRow>('/classes', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdateClass(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateClassDto) => api.patch<ClassRow>(`/classes/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/classes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
