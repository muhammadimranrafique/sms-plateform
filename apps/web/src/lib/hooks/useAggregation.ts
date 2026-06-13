'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

const keys = {
  kpi: (sessionId?: number) => ['aggregation', 'kpi', sessionId] as const,
  dailyRegister: (date?: string) => ['aggregation', 'daily-register', date] as const,
  monthlyRegister: (month: string) => ['aggregation', 'monthly-register', month] as const,
  headWise: (sessionId?: number) => ['aggregation', 'head-wise', sessionId] as const,
  studentSummary: (studentId: number) => ['aggregation', 'student', studentId] as const,
  classSummary: (classId: number, sessionId?: number) => ['aggregation', 'class', classId, sessionId] as const,
};

export function useInstitutionKPI(sessionId?: number) {
  return useQuery({
    queryKey: keys.kpi(sessionId),
    queryFn: () => api.get<any>(`/aggregation/institution/kpi${sessionId ? `?sessionId=${sessionId}` : ''}`),
  });
}

export function useDailyRegister(date?: string) {
  return useQuery({
    queryKey: keys.dailyRegister(date),
    queryFn: () => api.get<any>(`/aggregation/daily-register?date=${date ?? new Date().toISOString().split('T')[0]}`),
  });
}

export function useMonthlyRegister(month: string) {
  return useQuery({
    queryKey: keys.monthlyRegister(month),
    queryFn: () => api.get<any>(`/aggregation/monthly-register?month=${month}`),
    enabled: !!month,
  });
}

export function useHeadWiseBreakdown(sessionId?: number) {
  return useQuery({
    queryKey: keys.headWise(sessionId),
    queryFn: () => api.get<any>(`/aggregation/head-wise${sessionId ? `?sessionId=${sessionId}` : ''}`),
  });
}

export function useStudentFeeSummary(studentId: number) {
  return useQuery({
    queryKey: keys.studentSummary(studentId),
    queryFn: () => api.get<any>(`/aggregation/student/${studentId}`),
    enabled: !!studentId,
  });
}

export function useClassFeeSummary(classId: number, sessionId?: number) {
  return useQuery({
    queryKey: keys.classSummary(classId, sessionId),
    queryFn: () => api.get<any>(`/aggregation/class/${classId}${sessionId ? `?sessionId=${sessionId}` : ''}`),
    enabled: !!classId,
  });
}
