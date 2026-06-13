import { z } from 'zod';

export const FeePaymentMethodSchema = z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE']);

export const CreateFeePaymentSchema = z.object({
  feeChargeId: z.number().int().positive(),
  amount: z.coerce.number().positive().max(999_999_999),
  paidAt: z.coerce.date().optional(),
  method: FeePaymentMethodSchema.default('CASH'),
  referenceNo: z.string().max(100).optional(),
  receivedBy: z.string().max(100).optional(),
});

export const FeePaymentQuerySchema = z.object({
  feeChargeId: z.coerce.number().int().positive().optional(),
  method: FeePaymentMethodSchema.optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type FeePaymentMethod = z.infer<typeof FeePaymentMethodSchema>;
export type CreateFeePaymentDto = z.infer<typeof CreateFeePaymentSchema>;
export type FeePaymentQuery = z.infer<typeof FeePaymentQuerySchema>;
