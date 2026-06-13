'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

const keys = {
  studentLedger: (studentId: number, sessionId?: number) => ['reports', 'student-ledger', studentId, sessionId] as const,
  defaulterList: (sessionId: number, minOverdue?: number) => ['reports', 'defaulters', sessionId, minOverdue] as const,
  classCollection: (sessionId?: number) => ['reports', 'class-collection', sessionId] as const,
  comparative: (s1: number, s2: number) => ['reports', 'comparative', s1, s2] as const,
  concessions: (sessionId?: number) => ['reports', 'concessions', sessionId] as const,
};

export function useStudentLedger(studentId: number, sessionId?: number) {
  return useQuery({
    queryKey: keys.studentLedger(studentId, sessionId),
    queryFn: () =>
      api.get<any>(`/reports/v2/student-ledger/${studentId}${sessionId ? `?sessionId=${sessionId}` : ''}`),
    enabled: !!studentId,
  });
}

export function useDefaulterList(sessionId: number, minOverdue = 1) {
  return useQuery({
    queryKey: keys.defaulterList(sessionId, minOverdue),
    queryFn: () => api.get<any>(`/reports/v2/defaulters?sessionId=${sessionId}&minOverdue=${minOverdue}`),
    enabled: !!sessionId,
  });
}

export function useClassCollectionSummary(sessionId?: number) {
  return useQuery({
    queryKey: keys.classCollection(sessionId),
    queryFn: () => api.get<any>(`/reports/v2/class-collection${sessionId ? `?sessionId=${sessionId}` : ''}`),
  });
}

export function useComparativeReport(session1Id: number, session2Id: number) {
  return useQuery({
    queryKey: keys.comparative(session1Id, session2Id),
    queryFn: () => api.get<any>(`/reports/v2/comparative?session1Id=${session1Id}&session2Id=${session2Id}`),
    enabled: !!session1Id && !!session2Id,
  });
}

export function useConcessionReport(sessionId?: number) {
  return useQuery({
    queryKey: keys.concessions(sessionId),
    queryFn: () => api.get<any>(`/reports/v2/concessions${sessionId ? `?sessionId=${sessionId}` : ''}`),
  });
}
