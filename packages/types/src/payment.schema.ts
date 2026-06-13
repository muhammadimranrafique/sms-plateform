import { z } from 'zod';
import { FeePaymentMethodSchema } from './fee-payment.schema';

export const PaymentStatusSchema = z.enum(['COMPLETED', 'REVERSED']);

export const ReceivePaymentSchema = z.object({
  studentId: z.number().int().positive(),
  voucherNo: z.string().max(50).optional(),
  chargeIds: z.array(z.number().int().positive()).min(1).optional(),
  amount: z.coerce.number().positive().max(999_999_999),
  method: FeePaymentMethodSchema.default('CASH'),
  referenceNo: z.string().max(100).optional(),
  paidAt: z.coerce.date().optional(),
  isAdvance: z.boolean().default(false),
  remarks: z.string().max(500).optional(),
}).refine(
  (data) => data.voucherNo || data.chargeIds,
  { message: 'Either voucherNo or chargeIds must be provided' },
);

export const ReverseReasonSchema = z.enum(['CHEQUE_BOUNCE', 'OTHER']);

export const ReversePaymentSchema = z.object({
  reason: z.string().max(500).optional(),
  reverseReason: ReverseReasonSchema.optional(),
});

export const PaymentQuerySchema = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  method: FeePaymentMethodSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const LateFineRuleSchema = z.object({
  sessionId: z.number().int().positive(),
  name: z.string().min(1).max(100),
  graceDays: z.number().int().min(0).default(0),
  type: z.enum(['FIXED', 'PERCENTAGE']).default('FIXED'),
  value: z.coerce.number().positive().max(999_999_999),
  maxFine: z.coerce.number().positive().max(999_999_999).optional(),
  isActive: z.boolean().default(true),
});

export const PaymentAllocationResponseSchema = z.object({
  feeChargeId: z.number(),
  feeHeadName: z.string(),
  feeMonth: z.string(),
  originalAmount: z.number(),
  fineApplied: z.number(),
  allocatedAmount: z.number(),
  outstandingBefore: z.number(),
  outstandingAfter: z.number(),
});

export const VoucherLineItemStatusSchema = z.object({
  feeChargeId: z.number(),
  feeHeadName: z.string(),
  feeMonth: z.string(),
  originalAmount: z.number(),
  discountApplied: z.number(),
  fine: z.number(),
  paidAmount: z.number(),
  outstanding: z.number(),
  dueDate: z.string(),
  status: z.enum(['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE']),
});

export const VoucherStatusResponseSchema = z.object({
  voucherNo: z.string(),
  studentId: z.number(),
  studentName: z.string(),
  className: z.string().optional(),
  totalCharged: z.number(),
  totalPaid: z.number(),
  totalFine: z.number(),
  totalDiscount: z.number(),
  balance: z.number(),
  status: z.enum(['PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED']),
  lineItems: z.array(VoucherLineItemStatusSchema),
  generatedAt: z.string(),
});

export const PaymentHistoryResponseSchema = z.object({
  studentId: z.number(),
  studentName: z.string(),
  advanceBalance: z.number(),
  payments: z.array(z.object({
    id: z.number(),
    amount: z.number(),
    method: FeePaymentMethodSchema,
    referenceNo: z.string().nullable(),
    paidAt: z.string(),
    status: PaymentStatusSchema,
    reversedAt: z.string().nullable(),
    allocations: z.array(PaymentAllocationResponseSchema),
    createdAt: z.string(),
  })),
  totalPaid: z.number(),
  totalReversed: z.number(),
});

export type ReceivePaymentDto = z.infer<typeof ReceivePaymentSchema>;
export type ReversePaymentDto = z.infer<typeof ReversePaymentSchema>;
export type PaymentQuery = z.infer<typeof PaymentQuerySchema>;
export type LateFineRuleInput = z.infer<typeof LateFineRuleSchema>;
export type PaymentAllocationResponse = z.infer<typeof PaymentAllocationResponseSchema>;
export type VoucherLineItemStatus = z.infer<typeof VoucherLineItemStatusSchema>;
export type VoucherStatusResponse = z.infer<typeof VoucherStatusResponseSchema>;
export type PaymentHistoryResponse = z.infer<typeof PaymentHistoryResponseSchema>;
