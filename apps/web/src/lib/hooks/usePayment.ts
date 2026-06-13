'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReceivePaymentDto, PaymentHistoryResponse, ReversePaymentDto } from '@sms/types';
import { api } from '../api/client';

const keys = {
  all: ['payments'] as const,
  history: (studentId: number) => ['payments', 'history', studentId] as const,
};

export function usePaymentHistory(studentId: number) {
  return useQuery({
    queryKey: keys.history(studentId),
    queryFn: () => api.get<PaymentHistoryResponse>(`/payments/student/${studentId}`),
    enabled: !!studentId,
  });
}

export function useReceivePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: ReceivePaymentDto) => api.post('/payments/receive', dto),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: keys.history(variables.studentId) });
      qc.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });
}

export function useReversePayment(studentId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: number } & ReversePaymentDto) =>
      api.patch(`/payments/${paymentId}/reverse`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.history(studentId) });
      qc.invalidateQueries({ queryKey: ['vouchers'] });
    },
  });
}
