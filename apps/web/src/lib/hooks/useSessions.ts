'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export interface SessionRow {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get<SessionRow[]>('/sessions'),
  });
}
