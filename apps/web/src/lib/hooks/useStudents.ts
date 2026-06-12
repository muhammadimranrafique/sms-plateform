'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateStudentDto, StudentQuery } from '@sms/types';
import { api } from '../api/client';

export interface StudentRow {
  id: number;
  admissionNo: string;
  name: string;
  fatherName: string;
  status: string;
  updatedAt: string;
  class?: { id: number; name: string; section?: string | null };
  session?: { id: number; name: string };
}

const keys = {
  all: ['students'] as const,
  list: (q: Partial<StudentQuery>) => ['students', 'list', q] as const,
};

export function useStudents(query: Partial<StudentQuery> = {}) {
  const params = new URLSearchParams(
    Object.entries(query).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
  ).toString();
  return useQuery({
    queryKey: keys.list(query),
    queryFn: () => api.get<StudentRow[]>(`/students${params ? `?${params}` : ''}`),
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateStudentDto) => api.post<StudentRow>('/students', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
