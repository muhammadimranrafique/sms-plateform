-- AlterTable
ALTER TABLE "fee_aggregation_daily" ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3);

-- RenameIndex
ALTER INDEX "student_concessions_studentId_concessionId_feeHeadId_startMonth" RENAME TO "student_concessions_studentId_concessionId_feeHeadId_startM_key";
