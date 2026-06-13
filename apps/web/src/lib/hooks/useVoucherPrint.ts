'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { VoucherStatusResponse } from '@sms/types';
import { api } from '../api/client';
import { generateVoucherQR } from '../utils/qrcode';

export interface VoucherPrintData {
  voucher: VoucherStatusResponse | null;
  qrDataUrl: string | null;
  schoolName: string;
  schoolAddress: string;
  schoolContact: string;
  session: string;
  isLoading: boolean;
  error: Error | null;
}

const SCHOOL_INFO = {
  name: 'School Name',
  address: '123 Education Street, City, State',
  contact: 'Phone: +92-XXX-XXXXXXX | Email: info@school.edu.pk',
};

export function useVoucherPrint(voucherNo: string | undefined): VoucherPrintData {
  const { data: voucher, isLoading, error } = useQuery({
    queryKey: ['voucher-print', voucherNo],
    queryFn: () => api.get<VoucherStatusResponse>(`/vouchers/by-voucher-no/${voucherNo}/status`),
    enabled: !!voucherNo,
  });

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!voucher) return;
    let cancelled = false;
    generateVoucherQR({
      voucherNo: voucher.voucherNo,
      studentId: voucher.studentId,
      amount: voucher.totalCharged,
      dueDate: voucher.lineItems[0]?.dueDate ?? new Date().toISOString(),
    })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(null); });
    return () => { cancelled = true; };
  }, [voucher]);

  const year = new Date().getFullYear().toString();

  return {
    voucher: voucher ?? null,
    qrDataUrl,
    schoolName: SCHOOL_INFO.name,
    schoolAddress: SCHOOL_INFO.address,
    schoolContact: SCHOOL_INFO.contact,
    session: year,
    isLoading,
    error: error as Error | null,
  };
}
