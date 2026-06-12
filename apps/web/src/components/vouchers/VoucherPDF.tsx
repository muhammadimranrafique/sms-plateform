import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface VoucherData {
  voucherNo: string;
  studentName: string;
  admissionNo: string;
  className: string;
  amount: number;
  dueDate: string;
  feeMonth?: string;
  schoolName: string;
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 16 },
  schoolName: { fontSize: 18, fontWeight: 'bold', color: '#1A3C5E' },
  title: { fontSize: 12, marginTop: 4, color: '#555' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#666' },
  value: { fontWeight: 'bold' },
  amountBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#EFF3F8',
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: { marginTop: 32, fontSize: 9, textAlign: 'center', color: '#999' },
});

export function VoucherPDF({ voucher }: { voucher: VoucherData }) {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.schoolName}>{voucher.schoolName}</Text>
          <Text style={styles.title}>Fee Voucher</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Voucher No</Text>
          <Text style={styles.value}>{voucher.voucherNo}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Student</Text>
          <Text style={styles.value}>{voucher.studentName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Admission No</Text>
          <Text style={styles.value}>{voucher.admissionNo}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Class</Text>
          <Text style={styles.value}>{voucher.className}</Text>
        </View>
        {voucher.feeMonth ? (
          <View style={styles.row}>
            <Text style={styles.label}>Fee Month</Text>
            <Text style={styles.value}>{voucher.feeMonth}</Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.label}>Due Date</Text>
          <Text style={styles.value}>{voucher.dueDate}</Text>
        </View>
        <View style={styles.amountBox}>
          <Text style={styles.value}>Total Payable</Text>
          <Text style={styles.value}>Rs. {voucher.amount.toLocaleString('en-PK')}</Text>
        </View>
        <Text style={styles.footer}>
          This is a computer-generated voucher and does not require a signature.
        </Text>
      </Page>
    </Document>
  );
}
