'use client';

import { useState } from 'react';
import { VoucherPrintA4ThreeCopies } from './VoucherPrintA4ThreeCopies';
import type { VoucherPrintData } from '@/lib/hooks/useVoucherPrint';

export interface VoucherPreviewProps {
  data: VoucherPrintData;
  voucherNo: string;
}

export function VoucherPreview({ data, voucherNo }: VoucherPreviewProps) {
  const [zoom, setZoom] = useState(75);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await fetch(`/api/vouchers/${voucherNo}/pdf`);
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voucher-${voucherNo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('PDF download failed:', err);
    }
  };

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        Loading voucher...
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="flex items-center justify-center p-12 text-red-500">
        Failed to load voucher: {data.error.message}
      </div>
    );
  }

  if (!data.voucher) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        Voucher not found
      </div>
    );
  }

  return (
    <div className="preview-container">
      {/* Controls bar */}
      <div className="preview-controls no-print">
        <div className="control-group">
          <label htmlFor="zoom-slider" className="control-label">Zoom:</label>
          <input
            id="zoom-slider"
            type="range"
            min={50}
            max={150}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="zoom-slider"
          />
          <span className="zoom-value">{zoom}%</span>
        </div>
        <div className="control-group">
          <button onClick={handlePrint} className="btn btn-primary">
            Print
          </button>
          <button onClick={handleDownloadPdf} className="btn btn-ghost">
            Download PDF
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div
        className="preview-area"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
        }}
      >
        <VoucherPrintA4ThreeCopies data={data} />
      </div>

      <style>{`
        .preview-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
        }
        .preview-controls {
          display: flex;
          align-items: center;
          gap: 2rem;
          padding: 0.75rem 1.5rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          position: sticky;
          top: 1rem;
          z-index: 50;
        }
        .control-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .control-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #475569;
        }
        .zoom-slider {
          width: 160px;
          accent-color: #1A3C5E;
        }
        .zoom-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1A3C5E;
          min-width: 3rem;
        }
        .preview-area {
          background: white;
          box-shadow: 0 4px 24px rgba(0,0,0,0.12);
          border-radius: 4px;
          overflow: hidden;
        }
        @media print {
          .no-print { display: none !important; }
          .preview-area {
            transform: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .preview-container {
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
