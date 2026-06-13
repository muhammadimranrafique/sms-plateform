'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateStudentDto, UpdateStudentDto, StudentQuery } from '@sms/types';
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
  detail: (id: number) => ['students', id] as const,
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

export function useStudent(id: number) {
  return useQuery({
    queryKey: keys.detail(id),
    queryFn: () => api.get<StudentRow>(`/students/${id}`),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateStudentDto) => api.post<StudentRow>('/students', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useUpdateStudent(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateStudentDto) => api.patch<StudentRow>(`/students/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/students/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
}
