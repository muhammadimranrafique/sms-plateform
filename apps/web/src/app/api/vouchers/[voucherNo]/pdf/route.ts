import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  _req: NextRequest,
  { params }: { params: { voucherNo: string } },
) {
  const { voucherNo } = params;

  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    },
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  const voucherRes = await fetch(
    `${apiUrl}/api/v1/vouchers/by-voucher-no/${voucherNo}/status`,
    {
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  );

  if (!voucherRes.ok) {
    return NextResponse.json(
      { error: 'Voucher not found' },
      { status: 404 },
    );
  }

  const voucherBody = await voucherRes.json();
  const voucher = voucherBody.data;

  const pdfData = {
    voucherNo: voucher.voucherNo,
    studentName: voucher.studentName,
    admissionNo: '',
    className: voucher.className ?? '',
    amount: voucher.totalCharged,
    dueDate: voucher.lineItems[0]?.dueDate ?? '',
    feeMonth: voucher.lineItems[0]?.feeMonth ?? '',
    schoolName: 'School Name',
    lineItems: voucher.lineItems.map((item: any) => ({
      feeHead: item.feeHeadName,
      amount: item.originalAmount,
    })),
    isPaid: voucher.status === 'PAID',
    isOverdue: voucher.status === 'OVERDUE',
    discount: voucher.totalDiscount,
    fine: voucher.totalFine,
  };

  try {
    const React = await import('react');
    const ReactPDF = await import('@react-pdf/renderer');
    const { VoucherPDFThreeCopies } = await import(
      '@/components/vouchers/VoucherPDFThreeCopies'
    );

    const element = React.createElement(VoucherPDFThreeCopies, { data: pdfData });
    const pdfStream = await ReactPDF.renderToStream(element as any);

    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="voucher-${voucherNo}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json(
      { error: 'PDF generation failed' },
      { status: 500 },
    );
  }
}
