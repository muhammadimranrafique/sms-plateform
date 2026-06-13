import { prisma } from '../../config/prisma';
import type { PrismaTx } from '../../config/prisma';
import type { Prisma } from '@prisma/client';

export interface LateFineResult {
  fineAmount: number;
  daysOverdue: number;
  ruleApplied: string | null;
}

export async function getApplicableRules(sessionId: number, tx?: PrismaTx) {
  const client = tx ?? prisma;
  return client.lateFineRule.findMany({
    where: { sessionId, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}

export function calculateLateFine(
  chargeAmount: number,
  currentFine: number,
  dueDate: Date,
  paidAt: Date,
  rules: { name: string; type: 'FIXED' | 'PERCENTAGE'; value: Prisma.Decimal; maxFine?: Prisma.Decimal | null; graceDays: number }[],
  existingPaid: number,
): LateFineResult {
  if (paidAt <= dueDate) {
    return { fineAmount: 0, daysOverdue: 0, ruleApplied: null };
  }

  const diffMs = paidAt.getTime() - dueDate.getTime();
  const daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (daysOverdue <= 0) {
    return { fineAmount: 0, daysOverdue: 0, ruleApplied: null };
  }

  if (rules.length === 0) {
    return { fineAmount: currentFine, daysOverdue, ruleApplied: 'existing' };
  }

  const effectiveRule = rules[0]!;
  const overdueAfterGrace = Math.max(0, daysOverdue - effectiveRule.graceDays);
  if (overdueAfterGrace <= 0) {
    return { fineAmount: 0, daysOverdue, ruleApplied: null };
  }

  let fineAmount = 0;
  if (effectiveRule.type === 'FIXED') {
    fineAmount = effectiveRule.value.toNumber() * Math.ceil(overdueAfterGrace / 30);
  } else {
    const outstanding = chargeAmount + currentFine - existingPaid;
    fineAmount = outstanding * effectiveRule.value.toNumber() / 100 * Math.ceil(overdueAfterGrace / 30);
  }

  if (effectiveRule.maxFine) {
    fineAmount = Math.min(fineAmount, effectiveRule.maxFine.toNumber());
  }

  return { fineAmount: Math.round(fineAmount * 100) / 100, daysOverdue, ruleApplied: effectiveRule.name };
}
