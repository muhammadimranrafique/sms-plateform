-- CreateEnum
CREATE TYPE "ConcessionType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "AlertLevel" AS ENUM ('YELLOW', 'ORANGE', 'RED');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'DISMISSED');

-- CreateTable: fee_concessions
CREATE TABLE "fee_concessions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ConcessionType" NOT NULL DEFAULT 'PERCENTAGE',
    "value" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "criteria" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_concessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: student_concessions
CREATE TABLE "student_concessions" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "concessionId" INTEGER NOT NULL,
    "feeHeadId" INTEGER,
    "startMonth" TEXT NOT NULL,
    "endMonth" TEXT,
    "approvedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,

    CONSTRAINT "student_concessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: fee_aggregation_daily
CREATE TABLE "fee_aggregation_daily" (
    "id" BIGSERIAL NOT NULL,
    "date" DATE NOT NULL,
    "classId" INTEGER,
    "sessionId" INTEGER,
    "feeHeadId" INTEGER,
    "totalAssigned" DECIMAL(14,2) NOT NULL,
    "totalPaid" DECIMAL(14,2) NOT NULL,
    "totalFine" DECIMAL(14,2) NOT NULL,
    "totalDiscount" DECIMAL(14,2) NOT NULL,
    "totalConcession" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalOutstanding" DECIMAL(14,2) NOT NULL,
    "studentCount" INTEGER NOT NULL,
    "paidCount" INTEGER NOT NULL,
    "partialCount" INTEGER NOT NULL,
    "overdueCount" INTEGER NOT NULL,
    "unpaidCount" INTEGER NOT NULL,

    CONSTRAINT "fee_aggregation_daily_pkey" PRIMARY KEY ("id")
);

-- CreateTable: defaulter_alerts
CREATE TABLE "defaulter_alerts" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "overdueDays" INTEGER NOT NULL,
    "amountDue" DECIMAL(10,2) NOT NULL,
    "alertLevel" "AlertLevel" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "notifiedAt" TIMESTAMP(3),
    "notifiedVia" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "defaulter_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: bounce_fee_rules
CREATE TABLE "bounce_fee_rules" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "fee" DECIMAL(10,2) NOT NULL DEFAULT 500,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bounce_fee_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable: voucher_print_logs
CREATE TABLE "voucher_print_logs" (
    "id" BIGSERIAL NOT NULL,
    "voucherId" INTEGER NOT NULL,
    "printedBy" TEXT NOT NULL,
    "printType" TEXT NOT NULL,
    "printedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_print_logs_pkey" PRIMARY KEY ("id")
);

-- Unique: fee_concessions.name
CREATE UNIQUE INDEX "fee_concessions_name_key" ON "fee_concessions"("name");

-- Unique: student_concessions composite
CREATE UNIQUE INDEX "student_concessions_studentId_concessionId_feeHeadId_startMonth_key"
  ON "student_concessions"("studentId", "concessionId", "feeHeadId", "startMonth");

-- Indexes: student_concessions
CREATE INDEX "student_concessions_studentId_idx" ON "student_concessions"("studentId");
CREATE INDEX "student_concessions_concessionId_idx" ON "student_concessions"("concessionId");

-- Indexes: fee_aggregation_daily
CREATE INDEX "fee_aggregation_daily_date_idx" ON "fee_aggregation_daily"("date");
CREATE INDEX "fee_aggregation_daily_date_classId_idx" ON "fee_aggregation_daily"("date", "classId");
CREATE INDEX "fee_aggregation_daily_sessionId_classId_idx" ON "fee_aggregation_daily"("sessionId", "classId");

-- Indexes: defaulter_alerts
CREATE INDEX "defaulter_alerts_studentId_status_idx" ON "defaulter_alerts"("studentId", "status");
CREATE INDEX "defaulter_alerts_sessionId_alertLevel_status_idx" ON "defaulter_alerts"("sessionId", "alertLevel", "status");
CREATE INDEX "defaulter_alerts_status_createdAt_idx" ON "defaulter_alerts"("status", "createdAt");

-- Indexes: voucher_print_logs
CREATE INDEX "voucher_print_logs_voucherId_idx" ON "voucher_print_logs"("voucherId");

-- Foreign Keys: student_concessions
ALTER TABLE "student_concessions" ADD CONSTRAINT "student_concessions_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_concessions" ADD CONSTRAINT "student_concessions_concessionId_fkey"
  FOREIGN KEY ("concessionId") REFERENCES "fee_concessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_concessions" ADD CONSTRAINT "student_concessions_feeHeadId_fkey"
  FOREIGN KEY ("feeHeadId") REFERENCES "fee_heads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys: defaulter_alerts
ALTER TABLE "defaulter_alerts" ADD CONSTRAINT "defaulter_alerts_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "defaulter_alerts" ADD CONSTRAINT "defaulter_alerts_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Keys: voucher_print_logs
ALTER TABLE "voucher_print_logs" ADD CONSTRAINT "voucher_print_logs_voucherId_fkey"
  FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- =================================================================
-- Aggregation Refresh Function
-- =================================================================
-- ACCOUNTANT NOTE — True Collection Rate Formula:
--   Gross Collection Rate = total_paid / total_assigned × 100
--   Net Collection Rate  = (total_paid + advance) / (total_assigned - discount - concession) × 100
--   Effective Outstanding = total_assigned + fine - paid - advance - discount - concession
-- =================================================================

CREATE OR REPLACE FUNCTION refresh_daily_aggregation(target_date DATE)
RETURNS void AS $$
BEGIN
  DELETE FROM fee_aggregation_daily WHERE date = target_date;

  INSERT INTO fee_aggregation_daily (
    date, class_id, session_id, fee_head_id,
    total_assigned, total_paid, total_fine, total_discount,
    total_concession, total_outstanding,
    student_count, paid_count, partial_count, overdue_count, unpaid_count
  )
  SELECT
    target_date,
    s.class_id,
    fc.session_id,
    fc.fee_head_id,
    COALESCE(SUM(fc.amount), 0) as total_assigned,
    COALESCE(SUM(fc.paid_amount), 0) as total_paid,
    COALESCE(SUM(fc.fine), 0) as total_fine,
    COALESCE(SUM(v.discount), 0) as total_discount,
    COALESCE(SUM(
      CASE
        WHEN sc.concession_id IS NOT NULL AND fc2.type = 'FIXED'
        THEN fc2.value
        WHEN sc.concession_id IS NOT NULL AND fc2.type = 'PERCENTAGE'
        THEN fc.amount * fc2.value / 100
        ELSE 0
      END
    ), 0) as total_concession,
    COALESCE(SUM(fc.amount + fc.fine - fc.paid_amount), 0) as total_outstanding,
    COUNT(DISTINCT fc.student_id)::int as student_count,
    COUNT(DISTINCT CASE WHEN fc.status = 'PAID' THEN fc.student_id END)::int as paid_count,
    COUNT(DISTINCT CASE WHEN fc.status = 'PARTIAL' THEN fc.student_id END)::int as partial_count,
    COUNT(DISTINCT CASE WHEN fc.status = 'OVERDUE' THEN fc.student_id END)::int as overdue_count,
    COUNT(DISTINCT CASE WHEN fc.status = 'UNPAID' THEN fc.student_id END)::int as unpaid_count
  FROM fee_charges fc
  JOIN students s ON s.id = fc.student_id
  LEFT JOIN vouchers v ON v.id = fc.voucher_id
  LEFT JOIN student_concessions sc ON sc.student_id = s.id
    AND (sc.fee_head_id IS NULL OR sc.fee_head_id = fc.fee_head_id)
    AND sc.start_month <= to_char(target_date, 'YYYY-MM')
    AND (sc.end_month IS NULL OR sc.end_month >= to_char(target_date, 'YYYY-MM'))
  LEFT JOIN fee_concessions fc2 ON fc2.id = sc.concession_id
  WHERE fc.created_at::date <= target_date
  GROUP BY s.class_id, fc.session_id, fc.fee_head_id;
END;
$$ LANGUAGE plpgsql;
