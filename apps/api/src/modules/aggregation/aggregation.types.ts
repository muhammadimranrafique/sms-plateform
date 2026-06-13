export interface StudentFeeSummary {
  studentId: number;
  studentName: string;
  admissionNo: string;
  className?: string;
  totalAssigned: number;
  totalPaid: number;
  totalFine: number;
  totalDiscount: number;
  totalConcession: number;
  outstandingBalance: number;
  advanceBalance: number;
  pendingVouchers: number;
  overdueVouchers: number;
  collectionRate: number;
}

export interface ClassFeeSummary {
  classId: number;
  className: string;
  studentCount: number;
  totalAssigned: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  overdueCount: number;
}

export interface InstitutionKPI {
  totalStudents: number;
  totalFeeAssigned: number;
  totalFeeCollected: number;
  totalOutstanding: number;
  totalOverdue: number;
  collectionRate: number;
  overdueRate: number;
  activeDefaulters: number;
}

export interface DailyRegisterEntry {
  date: string;
  cashTotal: number;
  bankTransferTotal: number;
  chequeTotal: number;
  onlineTotal: number;
  advanceTotal: number;
  transactionCount: number;
}

export interface HeadWiseBreakdown {
  feeHeadId: number;
  feeHeadName: string;
  feeHeadCode: string;
  totalAssigned: number;
  totalCollected: number;
  collectionRate: number;
  percentageOfTotal: number;
}

export interface MonthlyRegister {
  month: string;
  year: number;
  totalPayments: number;
  grandTotal: number;
  dailySummary: Array<{ date: string; total: number }>;
}

export interface AggregationRefreshResult {
  refreshed: boolean;
  date: string;
}
