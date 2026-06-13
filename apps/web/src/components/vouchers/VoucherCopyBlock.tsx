'use client';

import type { VoucherLineItemStatus } from '@sms/types';

export type CopyLabel = 'BANK COPY' | 'SCHOOL COPY' | 'STUDENT COPY';

export interface VoucherCopyBlockProps {
  copyLabel: CopyLabel;
  voucherNo: string;
  studentName: string;
  className: string | undefined;
  rollNumber?: string;
  issueDate: string;
  dueDate: string;
  session: string;
  schoolName: string;
  schoolAddress: string;
  schoolContact: string;
  lineItems: VoucherLineItemStatus[];
  totalCharged: number;
  totalFine: number;
  totalDiscount: number;
  grandTotal: number;
  isPaid: boolean;
  isOverdue: boolean;
  qrDataUrl: string | null;
  paidAtDate?: string;
}

function formatCurrency(n: number): string {
  return n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function VoucherCopyBlock({
  copyLabel,
  voucherNo,
  studentName,
  className,
  rollNumber,
  issueDate,
  dueDate,
  session,
  schoolName,
  schoolAddress,
  schoolContact,
  lineItems,
  totalCharged,
  totalFine,
  totalDiscount,
  grandTotal,
  isPaid,
  isOverdue,
  qrDataUrl,
  paidAtDate,
}: VoucherCopyBlockProps) {
  return (
    <div className="voucher-copy">
      {/* Perforation indicator for top/middle copies */}
      <div className="perforation-line" aria-hidden="true">
        <span className="perforation-text">{'•'.repeat(80)}</span>
      </div>

      <div className="voucher-content">
        {/* Header */}
        <div className="voucher-header">
          <div className="school-logo-placeholder" />
          <div className="school-info">
            <h1 className="school-name">{schoolName}</h1>
            <p className="school-address">{schoolAddress}</p>
            <p className="school-contact">{schoolContact}</p>
            <p className="session-label">Session: {session}</p>
          </div>
          <div className="copy-label-badge">{copyLabel}</div>
        </div>

        {/* Voucher Metadata */}
        <div className="voucher-meta">
          <div className="meta-row">
            <span className="meta-label">Voucher No:</span>
            <span className="meta-value">{voucherNo}</span>
            <span className="meta-label">Issue Date:</span>
            <span className="meta-value">{issueDate}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Student Name:</span>
            <span className="meta-value">{studentName}</span>
            <span className="meta-label">Due Date:</span>
            <span className="meta-value">{dueDate}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">Class:</span>
            <span className="meta-value">{className ?? '—'}</span>
            <span className="meta-label">Roll No:</span>
            <span className="meta-value">{rollNumber ?? '—'}</span>
          </div>
        </div>

        {/* Fee Table */}
        <table className="fee-table">
          <thead>
            <tr>
              <th className="col-sr">#</th>
              <th className="col-desc">Fee Head</th>
              <th className="col-amount">Amount</th>
              <th className="col-discount">Discount</th>
              <th className="col-fine">Fine</th>
              <th className="col-net">Net Payable</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={item.feeChargeId}>
                <td className="col-sr">{idx + 1}</td>
                <td className="col-desc">{item.feeHeadName}</td>
                <td className="col-amount">{formatCurrency(item.originalAmount)}</td>
                <td className="col-discount">{formatCurrency(item.discountApplied)}</td>
                <td className="col-fine">{formatCurrency(item.fine)}</td>
                <td className="col-net">{formatCurrency(item.originalAmount + item.fine - item.discountApplied)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td colSpan={2} className="totals-label">Total</td>
              <td className="col-amount">{formatCurrency(totalCharged)}</td>
              <td className="col-discount">{formatCurrency(totalDiscount)}</td>
              <td className="col-fine">{formatCurrency(totalFine)}</td>
              <td className="col-net grand-total">{formatCurrency(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Amount in words */}
        <p className="amount-in-words">
          Rupees {numberToWords(grandTotal)} only
        </p>

        {/* QR Code */}
        <div className="qr-section">
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR Code" className="qr-code" />
          )}
          <div className="verification-text">
            Scan to verify
          </div>
        </div>

        {/* Watermark */}
        {isPaid && (
          <div className="watermark watermark-paid">
            PAID{paidAtDate ? `\n${paidAtDate}` : ''}
          </div>
        )}
        {isOverdue && !isPaid && (
          <div className="watermark watermark-overdue">OVERDUE</div>
        )}

        {/* Footer */}
        <div className="voucher-footer">
          <p>This is a computer-generated voucher and does not require a signature.</p>
        </div>
      </div>
    </div>
  );
}

function numberToWords(n: number): string {
  if (n === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const convertBelow1000 = (num: number): string => {
    if (num === 0) return '';
    if (num < 20) return ones[num] + ' ';
    if (num < 100) return tens[Math.floor(num / 10)] + ' ' + (num % 10 ? ones[num % 10] : '') + ' ';
    return ones[Math.floor(num / 100)] + ' Hundred ' + convertBelow1000(num % 100);
  };
  const convert = (num: number): string => {
    if (num === 0) return '';
    const billion = Math.floor(num / 1000000000);
    const million = Math.floor((num % 1000000000) / 1000000);
    const thousand = Math.floor((num % 1000000) / 1000);
    const remainder = num % 1000;
    let result = '';
    if (billion) result += convertBelow1000(billion) + 'Billion ';
    if (million) result += convertBelow1000(million) + 'Million ';
    if (thousand) result += convertBelow1000(thousand) + 'Thousand ';
    if (remainder) result += convertBelow1000(remainder);
    return result.trim();
  };
  return convert(Math.round(n));
}
