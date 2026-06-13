'use client';

import { formatCurrency, formatDate } from '@/lib/utils';

export interface PaymentReceiptData {
  paymentId: number;
  studentId: number;
  studentName: string;
  admissionNo: string;
  className: string;
  voucherNo: string | null;
  amount: number;
  method: string;
  referenceNo: string | null;
  paidAt: Date;
  isAdvance: boolean;
  advanceBalance: number;
  voucherStatus: string | null;
  allocations: Array<{
    feeChargeId: number;
    amount: number;
    finePaid: number;
  }>;
}

interface Props {
  data: PaymentReceiptData;
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  ONLINE: 'Online',
};

export function PaymentReceipt({ data }: Props) {
  const schoolName = 'School Name';
  const schoolAddress = '123 Education Street, City, State';

  return (
    <div className="receipt-container">
      <div className="receipt-content">
        {/* Header */}
        <div className="receipt-header">
          <h1 className="receipt-school">{schoolName}</h1>
          <p className="receipt-address">{schoolAddress}</p>
          <h2 className="receipt-title">PAYMENT RECEIPT</h2>
        </div>

        {/* Status badge */}
        <div className="receipt-status">
          <span className="receipt-badge-success">PAID</span>
        </div>

        {/* Info rows */}
        <div className="receipt-body">
          <div className="receipt-row">
            <span className="receipt-label">Receipt No</span>
            <span className="receipt-value">{data.paymentId}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Date</span>
            <span className="receipt-value">{formatDate(data.paidAt)}</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Student</span>
            <span className="receipt-value">{data.studentName} ({data.admissionNo})</span>
          </div>
          <div className="receipt-row">
            <span className="receipt-label">Class</span>
            <span className="receipt-value">{data.className}</span>
          </div>
          {data.voucherNo && (
            <div className="receipt-row">
              <span className="receipt-label">Voucher No</span>
              <span className="receipt-value">{data.voucherNo}</span>
            </div>
          )}
          <div className="receipt-divider" />
          <div className="receipt-row">
            <span className="receipt-label">Payment Method</span>
            <span className="receipt-value">{METHOD_LABELS[data.method] ?? data.method}</span>
          </div>
          {data.referenceNo && (
            <div className="receipt-row">
              <span className="receipt-label">Reference</span>
              <span className="receipt-value">{data.referenceNo}</span>
            </div>
          )}
          {data.isAdvance && (
            <div className="receipt-row">
              <span className="receipt-label">Type</span>
              <span className="receipt-value">Advance Payment</span>
            </div>
          )}
          <div className="receipt-divider" />

          {/* Allocations table */}
          {data.allocations.length > 0 && (
            <>
              <p className="receipt-section-title">Allocations</p>
              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>Charge ID</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Fine Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {data.allocations.map((a) => (
                    <tr key={a.feeChargeId}>
                      <td>{a.feeChargeId}</td>
                      <td className="text-right">{formatCurrency(a.amount)}</td>
                      <td className="text-right">{formatCurrency(a.finePaid)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div className="receipt-divider" />
          <div className="receipt-total-row">
            <span className="receipt-total-label">Total Paid</span>
            <span className="receipt-total-value">{formatCurrency(data.amount)}</span>
          </div>

          {data.advanceBalance > 0 && (
            <div className="receipt-row">
              <span className="receipt-label">Advance Balance</span>
              <span className="receipt-value">{formatCurrency(data.advanceBalance)}</span>
            </div>
          )}

          {data.voucherStatus && (
            <div className="receipt-row">
              <span className="receipt-label">Voucher Status</span>
              <span className="receipt-value">
                <span className={`receipt-badge-${data.voucherStatus.toLowerCase()}`}>
                  {data.voucherStatus}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="receipt-footer">
          <p>This is a computer-generated receipt and does not require a signature.</p>
        </div>
      </div>

      <style>{`
        .receipt-container {
          width: 210mm;
          background: white;
          font-family: 'Inter', 'Helvetica', 'Arial', sans-serif;
          padding: 10mm 8mm;
        }
        .receipt-content {
          border: 0.3mm solid #333;
          padding: 6mm;
        }
        .receipt-header {
          text-align: center;
          border-bottom: 0.3mm solid #333;
          padding-bottom: 3mm;
          margin-bottom: 3mm;
        }
        .receipt-school {
          font-size: 14pt;
          font-weight: 700;
          color: #1A3C5E;
          margin: 0;
        }
        .receipt-address {
          font-size: 7pt;
          color: #555;
          margin: 0.5mm 0;
        }
        .receipt-title {
          font-size: 11pt;
          font-weight: 700;
          margin: 1mm 0 0;
          letter-spacing: 2px;
        }
        .receipt-status {
          text-align: center;
          margin-bottom: 3mm;
        }
        .receipt-badge-success {
          display: inline-block;
          font-size: 9pt;
          font-weight: 700;
          color: #fff;
          background: #16a34a;
          padding: 1mm 4mm;
          border-radius: 0.5mm;
        }
        .receipt-body {
          font-size: 8pt;
        }
        .receipt-row {
          display: flex;
          justify-content: space-between;
          padding: 0.8mm 0;
        }
        .receipt-label {
          color: #666;
          font-weight: 500;
        }
        .receipt-value {
          font-weight: 600;
          color: #222;
        }
        .receipt-divider {
          border-top: 0.1mm dashed #ccc;
          margin: 1.5mm 0;
        }
        .receipt-section-title {
          font-size: 7.5pt;
          font-weight: 700;
          margin: 2mm 0 1mm;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .receipt-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 7.5pt;
          margin-bottom: 1mm;
        }
        .receipt-table th {
          background: #f0f2f5;
          font-weight: 600;
          padding: 0.6mm 1mm;
          border: 0.2mm solid #ccc;
          text-align: left;
        }
        .receipt-table td {
          padding: 0.5mm 1mm;
          border: 0.2mm solid #ddd;
        }
        .receipt-table tbody tr:nth-child(even) {
          background: #fafafa;
        }
        .receipt-total-row {
          display: flex;
          justify-content: space-between;
          padding: 1.5mm 0;
          font-size: 10pt;
          font-weight: 700;
          border-top: 0.3mm solid #333;
          border-bottom: 0.3mm double #333;
          margin: 1mm 0;
        }
        .receipt-total-label {
          color: #222;
        }
        .receipt-total-value {
          color: #1A3C5E;
        }
        .receipt-footer {
          text-align: center;
          font-size: 6pt;
          color: #999;
          border-top: 0.2mm solid #ddd;
          padding-top: 2mm;
          margin-top: 3mm;
        }
        .text-right {
          text-align: right;
        }
        .receipt-badge-paid {
          color: #16a34a;
          font-weight: 700;
        }
        .receipt-badge-partial {
          color: #d97706;
          font-weight: 700;
        }
        .receipt-badge-overdue {
          color: #dc2626;
          font-weight: 700;
        }
        .receipt-badge-pending {
          color: #6b7280;
          font-weight: 700;
        }

        @media print {
          .receipt-container {
            padding: 0;
            width: 100%;
          }
          .receipt-content {
            border-color: #000;
          }
        }
      `}</style>
    </div>
  );
}
