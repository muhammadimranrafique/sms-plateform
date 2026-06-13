'use client';

import { VoucherCopyBlock } from './VoucherCopyBlock';
import type { VoucherPrintData } from '@/lib/hooks/useVoucherPrint';

export interface VoucherPrintA4ThreeCopiesProps {
  data: VoucherPrintData;
}

export function VoucherPrintA4ThreeCopies({ data }: VoucherPrintA4ThreeCopiesProps) {
  const { voucher, qrDataUrl, schoolName, schoolAddress, schoolContact, session } = data;

  if (!voucher) return null;

  const totalDiscount = voucher.lineItems.reduce((s, i) => s + i.discountApplied, 0);
  const grandTotal = voucher.totalCharged + voucher.totalFine - totalDiscount;

  const copyProps = {
    voucherNo: voucher.voucherNo,
    studentName: voucher.studentName,
    className: voucher.className,
    issueDate: voucher.generatedAt,
    dueDate: voucher.lineItems[0]?.dueDate ?? new Date().toISOString(),
    session,
    schoolName,
    schoolAddress,
    schoolContact,
    lineItems: voucher.lineItems,
    totalCharged: voucher.totalCharged,
    totalFine: voucher.totalFine,
    totalDiscount,
    grandTotal,
    isPaid: voucher.status === 'PAID',
    isOverdue: voucher.status === 'OVERDUE',
    qrDataUrl,
  };

  return (
    <div className="print-container">
      <VoucherCopyBlock copyLabel="BANK COPY" {...copyProps} />
      <VoucherCopyBlock copyLabel="SCHOOL COPY" {...copyProps} />
      <VoucherCopyBlock copyLabel="STUDENT COPY" {...copyProps} />
    </div>
  );
}
