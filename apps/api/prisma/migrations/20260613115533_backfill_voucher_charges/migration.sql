-- Backfill: link existing fee_charges to their vouchers
-- The relationship is implicit via studentId + feeMonth
UPDATE fee_charges fc
SET "voucherId" = v.id
FROM vouchers v
WHERE fc."studentId" = v."studentId"
  AND fc."feeMonth" = v."feeMonth"
  AND fc."voucherId" IS NULL;
