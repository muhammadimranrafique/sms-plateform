import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

export interface VoucherPDFThreeCopiesData {
  voucherNo: string;
  studentName: string;
  admissionNo: string;
  className: string;
  amount: number;
  dueDate: string;
  feeMonth?: string;
  schoolName: string;
  lineItems: Array<{ feeHead: string; amount: number }>;
  isPaid: boolean;
  isOverdue: boolean;
  discount: number;
  fine: number;
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Helvetica',
    fontSize: 8,
  },
  copy: {
    height: '33.33%',
    padding: 16,
    borderBottom: '0.5 solid #999',
    position: 'relative',
  },
  copyLabel: {
    position: 'absolute',
    top: 4,
    right: 8,
    fontSize: 7,
    color: '#666',
    fontWeight: 'bold',
  },
  header: {
    textAlign: 'center',
    marginBottom: 6,
  },
  schoolName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A3C5E',
  },
  session: {
    fontSize: 7,
    color: '#555',
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    marginBottom: 2,
  },
  label: { color: '#666', width: '20%' },
  value: { fontWeight: 'bold', width: '30%' },
  table: {
    marginTop: 4,
    borderTop: '0.5 solid #333',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '0.5 solid #333',
    paddingVertical: 2,
    fontSize: 6.5,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.3 solid #ccc',
    paddingVertical: 1.5,
    fontSize: 6.5,
  },
  colSr: { width: '8%', textAlign: 'center' },
  colDesc: { width: '42%' },
  colAmount: { width: '17%', textAlign: 'right' },
  colFine: { width: '15%', textAlign: 'right' },
  colNet: { width: '18%', textAlign: 'right', fontWeight: 'bold' },
  totRow: {
    flexDirection: 'row',
    borderBottom: '0.5 solid #333',
    paddingVertical: 2,
    fontSize: 7,
    fontWeight: 'bold',
  },
  watermark: {
    position: 'absolute',
    top: '30%',
    left: '25%',
    transform: 'rotate(-30deg)',
    fontSize: 28,
    opacity: 0.15,
    color: '#000',
  },
  watermarkOverdue: {
    position: 'absolute',
    top: '30%',
    left: '25%',
    transform: 'rotate(-30deg)',
    fontSize: 28,
    opacity: 0.15,
    color: '#cc0000',
  },
  footer: {
    position: 'absolute',
    bottom: 8,
    left: 16,
    right: 16,
    textAlign: 'center',
    fontSize: 6,
    color: '#999',
  },
});

function CopySection({
  label,
  data,
}: {
  label: string;
  data: VoucherPDFThreeCopiesData;
}) {
  const totalNet = data.lineItems.reduce((s, l) => s + l.amount, 0) + data.fine - data.discount;
  return (
    <View style={styles.copy}>
      <Text style={styles.copyLabel}>{label}</Text>
      <View style={styles.header}>
        <Text style={styles.schoolName}>{data.schoolName}</Text>
        <Text style={styles.session}>Session {data.feeMonth ?? ''}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.label}>Voucher No</Text>
        <Text style={styles.value}>{data.voucherNo}</Text>
        <Text style={styles.label}>Due Date</Text>
        <Text style={styles.value}>{data.dueDate}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.label}>Student</Text>
        <Text style={styles.value}>{data.studentName}</Text>
        <Text style={styles.label}>Class</Text>
        <Text style={styles.value}>{data.className}</Text>
      </View>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colSr}>#</Text>
          <Text style={styles.colDesc}>Fee Head</Text>
          <Text style={styles.colAmount}>Amount</Text>
          <Text style={styles.colFine}>Fine</Text>
          <Text style={styles.colNet}>Net</Text>
        </View>
        {data.lineItems.map((item, idx) => (
          <View key={idx} style={styles.tableRow}>
            <Text style={styles.colSr}>{idx + 1}</Text>
            <Text style={styles.colDesc}>{item.feeHead}</Text>
            <Text style={styles.colAmount}>{item.amount.toFixed(2)}</Text>
            <Text style={styles.colFine}>{data.fine.toFixed(2)}</Text>
            <Text style={styles.colNet}>{(item.amount + data.fine / data.lineItems.length).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totRow}>
          <Text style={styles.colSr} />
          <Text style={styles.colDesc}>Total</Text>
          <Text style={styles.colAmount}>{data.lineItems.reduce((s, l) => s + l.amount, 0).toFixed(2)}</Text>
          <Text style={styles.colFine}>{data.fine.toFixed(2)}</Text>
          <Text style={styles.colNet}>{totalNet.toFixed(2)}</Text>
        </View>
      </View>
      {data.isPaid && <Text style={styles.watermark}>PAID</Text>}
      {data.isOverdue && <Text style={styles.watermarkOverdue}>OVERDUE</Text>}
      <Text style={styles.footer}>Computer-generated voucher - no signature required</Text>
    </View>
  );
}

export function VoucherPDFThreeCopies({ data }: { data: VoucherPDFThreeCopiesData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <CopySection label="BANK COPY" data={data} />
        <CopySection label="SCHOOL COPY" data={data} />
        <CopySection label="STUDENT COPY" data={data} />
      </Page>
    </Document>
  );
}

export async function generatePdfBuffer(data: VoucherPDFThreeCopiesData): Promise<Buffer> {
  const ReactPDF = await import('@react-pdf/renderer');
  return ReactPDF.renderToBuffer(<VoucherPDFThreeCopies data={data} />);
}
