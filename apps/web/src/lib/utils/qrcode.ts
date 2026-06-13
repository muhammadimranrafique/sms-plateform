import QRCode from 'qrcode';

export interface VoucherQRPayload {
  voucherNo: string;
  studentId: number;
  amount: number;
  dueDate: string;
}

const QR_SECRET = process.env.NEXT_PUBLIC_QR_SECRET ?? 'school-fee-default-secret';

async function generateHMAC(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(QR_SECRET);
  const messageData = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hash;
}

export async function generateVoucherQR(data: VoucherQRPayload): Promise<string> {
  const hash = await generateHMAC(`${data.voucherNo}:${data.studentId}:${data.amount}:${data.dueDate}`);

  const payload = JSON.stringify({
    v: data.voucherNo,
    s: data.studentId,
    a: data.amount,
    d: data.dueDate,
    h: hash,
  });

  return QRCode.toDataURL(payload, {
    width: 200,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

export function getVerificationUrl(voucherNo: string): string {
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/verify?voucherNo=${voucherNo}`;
}
