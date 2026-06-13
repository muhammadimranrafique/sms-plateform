-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('COMPLETED', 'REVERSED');

-- CreateEnum
CREATE TYPE "LateFineType" AS ENUM ('FIXED', 'PERCENTAGE');

-- AlterTable
ALTER TABLE "fee_charges" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "voucherId" INTEGER;

-- CreateTable
CREATE TABLE "late_fine_rules" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "graceDays" INTEGER NOT NULL DEFAULT 0,
    "type" "LateFineType" NOT NULL DEFAULT 'FIXED',
    "value" DECIMAL(10,2) NOT NULL,
    "maxFine" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "late_fine_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "FeePaymentMethod" NOT NULL,
    "referenceNo" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "receivedBy" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "reversedAt" TIMESTAMP(3),
    "reversedBy" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "feeChargeId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "finePaid" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_ledgers" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "advance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "late_fine_rules_sessionId_idx" ON "late_fine_rules"("sessionId");

-- CreateIndex
CREATE INDEX "payments_studentId_idx" ON "payments"("studentId");

-- CreateIndex
CREATE INDEX "payments_studentId_paidAt_idx" ON "payments"("studentId", "paidAt");

-- CreateIndex
CREATE INDEX "payment_allocations_feeChargeId_idx" ON "payment_allocations"("feeChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_allocations_paymentId_feeChargeId_key" ON "payment_allocations"("paymentId", "feeChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "student_ledgers_studentId_key" ON "student_ledgers"("studentId");

-- CreateIndex
CREATE INDEX "fee_charges_voucherId_idx" ON "fee_charges"("voucherId");

-- AddForeignKey
ALTER TABLE "fee_charges" ADD CONSTRAINT "fee_charges_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "vouchers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "late_fine_rules" ADD CONSTRAINT "late_fine_rules_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_feeChargeId_fkey" FOREIGN KEY ("feeChargeId") REFERENCES "fee_charges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_ledgers" ADD CONSTRAINT "student_ledgers_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
