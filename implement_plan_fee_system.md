# Implementation Plan — School Fee Management System

> **Version:** 2.0 (Enterprise-grade)
> **Base Currency:** PKR (Pakistani Rupee)
> **Delivery Model:** Phased (5 phases, 54 files, ~3,530 lines)
> **Target:** School Management System v3.0.0 monorepo

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Phase 1 — Database Schema Enhancements](#2-phase-1--database-schema-enhancements)
3. [Phase 2 — Backend API Implementation](#3-phase-2--backend-api-implementation)
4. [Phase 3 — Frontend Implementation](#4-phase-3--frontend-implementation)
5. [Phase 4 — Infrastructure & DevOps](#5-phase-4--infrastructure--devops)
6. [Phase 5 — Testing Strategy](#6-phase-5--testing-strategy)
7. [Edge Cases & Error Handling](#7-edge-cases--error-handling)
8. [Risk Assessment & Contingency](#8-risk-assessment--contingency)
9. [Schedule & Milestones](#9-schedule--milestones)
10. [Appendix — File Manifest](#10-appendix--file-manifest)

---

## 1) Current State Assessment

### 1.1 Architecture Snapshot

```
sms-platform/
├── apps/
│   ├── api/                          # Express 5 + TypeScript REST API
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # 19 models, 10 enums, comprehensive indexing
│   │   │   └── migrations/           # 5 migration generations
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── students/         # CRUD + soft delete + optimistic concurrency
│   │       │   ├── classes/          # CRUD + isActive
│   │       │   ├── sessions/         # CRUD + rollover + current session
│   │       │   ├── fee-structures/   # Fee heads + structures + items CRUD
│   │       │   ├── fee-payments/     # Legacy simple payments
│   │       │   ├── payments/         # Payment ledger + allocation + advance + reverse
│   │       │   ├── vouchers/         # Generate single/batch/all-months + status
│   │       │   ├── discounts/        # Percentage/fixed, per-head, per-student
│   │       │   ├── promotions/       # Single/bulk promotion + eligibility + rollback
│   │       │   ├── reports/          # Dashboard stats + basic fee collection
│   │       │   └── admin/            # Audit log viewer
│   │       ├── middleware/           # auth, rbac, rate-limit, error, request-id
│   │       ├── shared/               # pagination, response, errors, audit, types
│   │       └── config/               # prisma, supabase, logger, env
│   └── web/                          # Next.js 14 App Router
│       └── src/
│           ├── app/dashboard/        # 13 page views
│           ├── components/           # UI, layout, vouchers (print/PDF), payments
│           └── lib/                  # hooks, api client, supabase, utils, qrcode
├── packages/
│   └── types/                        # Shared Zod schemas (15 schema files)
└── infrastructure/
    ├── docker-compose.yml            # PostgreSQL 15 + API
    ├── apps/api/Dockerfile           # Multi-stage Node 20 build
    └── turbo.json                    # Build orchestration
```

### 1.2 Implemented Features (v3.0.0)

| Module              | Status      | Key Capabilities                                                     |
| ------------------- | ----------- | -------------------------------------------------------------------- |
| Students            | ✅ Complete | CRUD, soft delete, optimistic concurrency, advanced search, photo    |
| Classes             | ✅ Complete | CRUD, sections, sorting, isActive                                    |
| Sessions            | ✅ Complete | CRUD, current session, academic year rollover                        |
| Fee Heads           | ✅ Complete | CRUD, unique code, sort order, isActive                              |
| Fee Structures      | ✅ Complete | Per-class/session, multi-head with amounts, unique constraint        |
| Fee Charges         | ✅ Complete | Per-student/per-head/per-month charge entries, status tracking       |
| Payments (v1)       | ✅ Complete | Simple per-charge payments, status recalculation                     |
| Payments (v2)       | ✅ Complete | Ledger with allocation, advance, reversal, late fines                |
| Payment Allocations | ✅ Complete | Tracks payment→charge→fine allocation with precision                 |
| Student Ledger      | ✅ Complete | Advance balance tracking per student                                 |
| Late Fine Rules     | ✅ Complete | Per-session rules, fixed/percentage, grace days, max cap             |
| Discounts           | ✅ Complete | Percentage/fixed, per-head or global, date-range validity            |
| Vouchers            | ✅ Complete | Generate single/batch/all-months, unique number sequence, idempotent |
| Voucher Print       | ✅ Complete | A4 3-copy layout with QR code, bank/school/student copies            |
| Promotions          | ✅ Complete | Single/bulk, eligibility engine, rollback, batch tracking            |
| Audit Logging       | ✅ Complete | DB trigger + app-level audit, middleware integration                 |
| Auth (Supabase)     | ✅ Complete | Bearer token, RBAC (admin/staff/viewer), session management          |
| OpenAPI Docs        | ✅ Complete | Swagger UI at /docs                                                  |
| Dashboard           | ✅ Complete | Stats grid (total students, active, classes, pending vouchers)       |
| Rate Limiting       | ✅ Complete | 120/min API, 10/min auth                                             |
| Error Handling      | ✅ Complete | Centralized error handler, 7 error classes, Sentry integration       |
| Docker              | ✅ Complete | Docker Compose with health checks, multi-stage build                 |
| Monorepo            | ✅ Complete | Turbo build, lint-staged, commitlint, Husky                          |

### 1.3 Gaps vs. Target Requirements

| Requirement                | Status     | Missing Components                                                                                                       |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------ |
| Fee Aggregation Engine     | ❌ Missing | No class/institution-level rollups, no daily aggregation, no materialized views                                          |
| Accountant-Grade Reporting | ❌ Missing | No student ledger, collection registers, defaulter lists, bank reconciliation, head-wise breakdowns, comparative reports |
| Executive KPI Dashboard    | ❌ Missing | No charts, collection trends, month-over-month growth, collection rate                                                   |
| Defaulter Management       | ❌ Missing | No aging analysis, alert levels (yellow/orange/red), escalation workflow                                                 | payment initiation |
| Bulk Operations            | ❌ Missing | No batch status update, no bulk fee posting                                                                              |
| Data Export (Excel/PDF)    | ❌ Missing | No spreadsheet or bulk PDF generation                                                                                    |
| DB Backup Automation       | ❌ Missing | No scheduled backup, no cloud storage integration                                                                        |
| Fee Concession/Scholarship | ❌ Missing | No concession rules engine, no scholarship reporting                                                                     |

---

## 2) Phase 1 — Database Schema Enhancements

### 2.1 New Prisma Models

Add to `apps/api/prisma/schema.prisma`:

```prisma
// ======== FEE CONCESSION / SCHOLARSHIP ========

enum ConcessionType {
  PERCENTAGE
  FIXED
}

model FeeConcession {
  id          Int              @id @default(autoincrement())
  name        String           @unique         // e.g. "Merit Scholarship 50%", "Sibling Concession"
  type        ConcessionType   @default(PERCENTAGE)
  value       Decimal          @db.Decimal(10, 2)
  description String?
  criteria    Json?                            // eligibility rules (pass percentage, sibling relation, etc.)
  isActive    Boolean          @default(true)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  assignments StudentConcession[]

  @@map("fee_concessions")
}

model StudentConcession {
  id           Int            @id @default(autoincrement())
  studentId    Int
  concessionId Int
  feeHeadId    Int?                              // null = applies to all heads
  startMonth   String                            // YYYY-MM
  endMonth     String?                           // YYYY-MM, null = ongoing/indefinite
  approvedBy   String
  approvedAt   DateTime         @default(now())
  remarks      String?
  student      Student          @relation(fields: [studentId], references: [id])
  concession   FeeConcession    @relation(fields: [concessionId], references: [id])
  feeHead      FeeHead?         @relation(fields: [feeHeadId], references: [id])

  @@unique([studentId, concessionId, feeHeadId, startMonth])
  @@index([studentId])
  @@index([concessionId])
  @@map("student_concessions")
}

// ======== FEE AGGREGATION (Materialized Support) ========

model FeeAggregationDaily {
  id              BigInt       @id @default(autoincrement())
  date            DateTime
  campusId        Int?
  classId         Int?
  sessionId       Int?
  feeHeadId       Int?
  totalAssigned   Decimal      @db.Decimal(14, 2)
  totalPaid       Decimal      @db.Decimal(14, 2)
  totalFine       Decimal      @db.Decimal(14, 2)
  totalDiscount   Decimal      @db.Decimal(14, 2)
  totalConcession Decimal      @db.Decimal(14, 2) @default(0)
  totalOutstanding Decimal     @db.Decimal(14, 2)
  studentCount    Int
  paidCount       Int
  partialCount    Int
  overdueCount    Int
  unpaidCount     Int

  @@index([date])
  @@index([date, classId])
  @@index([date, campusId])
  @@index([sessionId, classId])
  @@map("fee_aggregation_daily")
}

// ======== DEFAULTER ALERTS ========

enum AlertLevel {
  YELLOW           // 1-30 days overdue
  ORANGE           // 31-60 days overdue
  RED              // 61+ days overdue
}

enum AlertStatus {
  ACTIVE
  RESOLVED
  DISMISSED
}

model DefaulterAlert {
  id          Int          @id @default(autoincrement())
  studentId   Int
  sessionId   Int
  overdueDays Int
  amountDue   Decimal      @db.Decimal(10, 2)
  alertLevel  AlertLevel
  status      AlertStatus  @default(ACTIVE)
  notifiedAt  DateTime?
  notifiedVia String?      // SMS / EMAIL / APP
  resolvedAt  DateTime?
  resolvedBy  String?
  remarks     String?
  student     Student      @relation(fields: [studentId], references: [id])
  session     Session      @relation(fields: [sessionId], references: [id])
  createdAt   DateTime     @default(now())

  @@index([studentId, status])
  @@index([sessionId, alertLevel, status])
  @@index([status, createdAt])
  @@map("defaulter_alerts")
}

// ======== CHEQUE BOUNCE RULE ========

model BounceFeeRule {
  id        Int       @id @default(autoincrement())
  name      String
  fee       Decimal   @db.Decimal(10, 2) @default(500)
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())

  @@map("bounce_fee_rules")
}

// ======== VOUCHER REPRINT TRACKING ========

model VoucherPrintLog {
  id        BigInt    @id @default(autoincrement())
  voucherId Int
  printedBy String
  printType String    // ORIGINAL / REPRINT / BULK
  printedAt DateTime  @default(now())
  voucher   Voucher   @relation(fields: [voucherId], references: [id])

  @@index([voucherId])
  @@map("voucher_print_logs")
}
```

### 2.2 Schema Migrations

**Migration 1 — Concessions**

```sql
-- Create fee_concessions table
CREATE TABLE "fee_concessions" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "type" "ConcessionType" NOT NULL DEFAULT 'PERCENTAGE',
  "value" DECIMAL(10,2) NOT NULL,
  "description" TEXT,
  "criteria" JSONB,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create student_concessions table
CREATE TABLE "student_concessions" (
  "id" SERIAL PRIMARY KEY,
  "student_id" INTEGER NOT NULL REFERENCES "students"(id),
  "concession_id" INTEGER NOT NULL REFERENCES "fee_concessions"(id),
  "fee_head_id" INTEGER REFERENCES "fee_heads"(id),
  "start_month" TEXT NOT NULL,
  "end_month" TEXT,
  "approved_by" TEXT NOT NULL,
  "approved_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "remarks" TEXT,
  UNIQUE(student_id, concession_id, fee_head_id, start_month)
);
```

**Migration 2 — Aggregation & Alerts**

```sql
-- Create fee_aggregation_daily table
CREATE TABLE "fee_aggregation_daily" (
  "id" BIGSERIAL PRIMARY KEY,
  "date" DATE NOT NULL,
  "campus_id" INTEGER REFERENCES "campuses"(id),
  "class_id" INTEGER REFERENCES "classes"(id),
  "session_id" INTEGER REFERENCES "sessions"(id),
  "fee_head_id" INTEGER REFERENCES "fee_heads"(id),
  "total_assigned" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "total_paid" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "total_fine" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "total_discount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "total_concession" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "total_outstanding" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "student_count" INTEGER NOT NULL DEFAULT 0,
  "paid_count" INTEGER NOT NULL DEFAULT 0,
  "partial_count" INTEGER NOT NULL DEFAULT 0,
  "overdue_count" INTEGER NOT NULL DEFAULT 0,
  "unpaid_count" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_agg_date ON fee_aggregation_daily(date);
CREATE INDEX idx_agg_class ON fee_aggregation_daily(date, class_id);
CREATE INDEX idx_agg_session ON fee_aggregation_daily(session_id, class_id);

-- Create defaulter_alerts table
CREATE TABLE "defaulter_alerts" (
  "id" SERIAL PRIMARY KEY,
  "student_id" INTEGER NOT NULL REFERENCES "students"(id),
  "session_id" INTEGER NOT NULL REFERENCES "sessions"(id),
  "overdue_days" INTEGER NOT NULL,
  "amount_due" DECIMAL(10,2) NOT NULL,
  "alert_level" "AlertLevel" NOT NULL,
  "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
  "notified_at" TIMESTAMPTZ,
  "notified_via" TEXT,
  "resolved_at" TIMESTAMPTZ,
  "resolved_by" TEXT,
  "remarks" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_defaulter_student ON defaulter_alerts(student_id, status);
CREATE INDEX idx_defaulter_session ON defaulter_alerts(session_id, alert_level, status);

-- Create bounce_fee_rules table
CREATE TABLE "bounce_fee_rules" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "fee" DECIMAL(10,2) NOT NULL DEFAULT 500,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create voucher_print_logs table
CREATE TABLE "voucher_print_logs" (
  "id" BIGSERIAL PRIMARY KEY,
  "voucher_id" INTEGER NOT NULL REFERENCES "vouchers"(id),
  "printed_by" TEXT NOT NULL,
  "print_type" TEXT NOT NULL DEFAULT 'ORIGINAL',
  "printed_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_print_log_voucher ON voucher_print_logs(voucher_id);
```

**Migration 3 — Campus FK Additions**

```sql
ALTER TABLE "classes" ADD COLUMN "campus_id" INTEGER REFERENCES "campuses"(id);
ALTER TABLE "sessions" ADD COLUMN "campus_id" INTEGER REFERENCES "campuses"(id);
ALTER TABLE "fee_structures" ADD COLUMN "campus_id" INTEGER REFERENCES "campuses"(id);
ALTER TABLE "vouchers" ADD COLUMN "campus_id" INTEGER REFERENCES "campuses"(id);
ALTER TABLE "payments" ADD COLUMN "campus_id" INTEGER REFERENCES "campuses"(id);
```

### 2.3 Aggregation Refresh Trigger Function

**ACCOUNTANT NOTE — True Collection Rate Formula:**
The aggregation engine must compute financial metrics using proper accounting formulas:
- **Gross Collection Rate** = `total_paid / total_assigned × 100`
- **Net Collection Rate** = `(total_paid + total_advance) / (total_assigned - total_discount - total_concession) × 100`
- **Effective Outstanding** = `total_assigned + total_fine - total_paid - total_advance - total_discount - total_concession`
- **Aged Outstanding** = outstanding balance bucketed by days since due date (0-30, 31-60, 61-90, 91+)

```sql
CREATE OR REPLACE FUNCTION refresh_daily_aggregation(target_date DATE)
RETURNS void AS $$
BEGIN
  -- Delete existing aggregation for the target date
  DELETE FROM fee_aggregation_daily WHERE date = target_date;

  -- Insert fresh aggregation data with proper discount and concession computation
  INSERT INTO fee_aggregation_daily (
    date, campus_id, class_id, session_id, fee_head_id,
    total_assigned, total_paid, total_fine, total_discount,
    total_concession, total_outstanding,
    student_count, paid_count, partial_count, overdue_count, unpaid_count
  )
  SELECT
    target_date,
    s.campus_id,
    s.class_id,
    fc.session_id,
    fc.fee_head_id,
    COALESCE(SUM(fc.amount), 0) as total_assigned,
    COALESCE(SUM(fc.paid_amount), 0) as total_paid,
    COALESCE(SUM(fc.fine), 0) as total_fine,
    COALESCE(SUM(v.discount), 0) as total_discount,
    COALESCE((
      SELECT SUM(
        CASE
          WHEN sc.concession_id IS NOT NULL AND fc2.concession_type = 'FIXED'
          THEN sc2.value
          WHEN sc.concession_id IS NOT NULL AND fc2.concession_type = 'PERCENTAGE'
          THEN fc.amount * sc2.value / 100
          ELSE 0
        END
      )
      FROM student_concessions sc
      JOIN fee_concessions fc2 ON fc2.id = sc.concession_id
      WHERE sc.student_id = s.id
        AND (sc.fee_head_id IS NULL OR sc.fee_head_id = fc.fee_head_id)
        AND sc.start_month <= to_char(target_date, 'YYYY-MM')
        AND (sc.end_month IS NULL OR sc.end_month >= to_char(target_date, 'YYYY-MM'))
    ), 0) as total_concession,
    COALESCE(SUM(fc.amount + fc.fine - fc.paid_amount), 0) as total_outstanding,
    COUNT(DISTINCT fc.student_id) as student_count,
    COUNT(DISTINCT CASE WHEN fc.status = 'PAID' THEN fc.student_id END) as paid_count,
    COUNT(DISTINCT CASE WHEN fc.status = 'PARTIAL' THEN fc.student_id END) as partial_count,
    COUNT(DISTINCT CASE WHEN fc.status = 'OVERDUE' THEN fc.student_id END) as overdue_count,
    COUNT(DISTINCT CASE WHEN fc.status = 'UNPAID' THEN fc.student_id END) as unpaid_count
  FROM fee_charges fc
  JOIN students s ON s.id = fc.student_id
  LEFT JOIN vouchers v ON v.id = fc.voucher_id
  WHERE fc.created_at::date <= target_date
  GROUP BY s.campus_id, s.class_id, fc.session_id, fc.fee_head_id;

END;
$$ LANGUAGE plpgsql;
```

---

## 3) Phase 2 — Backend API Implementation

### 3.1 Milestone 2.1 — Fee Aggregation Engine

**Files to create:**

| File                                                         | Lines | Purpose                                             |
| ------------------------------------------------------------ | ----- | --------------------------------------------------- |
| `apps/api/src/modules/aggregation/aggregation.types.ts`      | 60    | Zod schemas for aggregation requests/responses      |
| `apps/api/src/modules/aggregation/aggregation.service.ts`    | 250   | Core aggregation logic, rollup queries, refresh job |
| `apps/api/src/modules/aggregation/aggregation.controller.ts` | 120   | Request handlers with auth guards                   |
| `apps/api/src/modules/aggregation/aggregation.router.ts`     | 40    | Route definitions                                   |

**Zod Schemas** (`aggregation.types.ts`):

```typescript
export const StudentFeeSummarySchema = z.object({
  studentId: z.number(),
  studentName: z.string(),
  admissionNo: z.string(),
  className: z.string().optional(),
  totalFeeAssigned: z.number(),
  totalFeePaid: z.number(),
  totalFine: z.number(),
  totalDiscount: z.number(),
  totalConcession: z.number(),
  outstandingBalance: z.number(),
  advanceBalance: z.number(),
  pendingVouchers: z.number(),
  overdueVouchers: z.number(),
  collectionRate: z.number(), // percentage
});

export const ClassFeeSummarySchema = z.object({
  classId: z.number(),
  className: z.string(),
  studentCount: z.number(),
  totalAssigned: z.number(),
  totalCollected: z.number(),
  totalOutstanding: z.number(),
  collectionRate: z.number(),
  paidCount: z.number(),
  partialCount: z.number(),
  unpaidCount: z.number(),
  overdueCount: z.number(),
});

export const InstitutionKPISchema = z.object({
  totalStudents: z.number(),
  totalFeeAssigned: z.number(),
  totalFeeCollected: z.number(),
  totalOutstanding: z.number(),
  totalOverdue: z.number(),
  collectionRate: z.number(),
  overdueRate: z.number(),
  activeDefaulters: z.number(),
  monthOverMonthGrowth: z.number(),
  yearOverYearGrowth: z.number(),
});

export const DailyRegisterEntrySchema = z.object({
  date: z.string(),
  cashTotal: z.number(),
  bankTransferTotal: z.number(),
  chequeTotal: z.number(),
  onlineTotal: z.number(),
  advanceTotal: z.number(),
  transactionCount: z.number(),
  collectedBy: z.string().optional(),
});

export const HeadWiseBreakdownSchema = z.object({
  feeHeadId: z.number(),
  feeHeadName: z.string(),
  feeHeadCode: z.string(),
  totalAssigned: z.number(),
  totalCollected: z.number(),
  collectionRate: z.number(),
  percentageOfTotal: z.number(),
});
```

**Aggregation Service** (`aggregation.service.ts`):

```typescript
import { prisma } from '../../config/prisma';
import type { Prisma } from '@prisma/client';

// ---- Student-Level Summary ----

export async function getStudentFeeSummary(studentId: number) {
  const [charges, ledger, vouchers] = await Promise.all([
    prisma.feeCharge.aggregate({
      where: { studentId },
      _sum: { amount: true, paidAmount: true, fine: true },
    }),
    prisma.studentLedger.findUnique({ where: { studentId } }),
    prisma.voucher.findMany({
      where: { studentId },
      select: { id: true, status: true },
    }),
  ]);

  const totalAssigned = Number(charges._sum.amount ?? 0);
  const totalPaid = Number(charges._sum.paidAmount ?? 0);
  const totalFine = Number(charges._sum.fine ?? 0);
  const advanceBalance = Number(ledger?.advance ?? 0);

  const pendingCount = vouchers.filter((v) => ['PENDING', 'UNPAID'].includes(v.status)).length;
  const overdueCount = vouchers.filter((v) => ['OVERDUE', 'PARTIAL'].includes(v.status)).length;
  const collectionRate =
    totalAssigned > 0 ? Math.round((totalPaid / totalAssigned) * 10000) / 100 : 0;

  return {
    totalAssigned,
    totalPaid,
    totalFine,
    advanceBalance,
    pendingCount,
    overdueCount,
    collectionRate,
  };
}

// ---- Class-Level Rollup ----

export async function getClassFeeSummary(classId: number, sessionId: number) {
  // Direct aggregation query for speed
  const result = await prisma.$queryRaw<
    Array<{
      class_name: string;
      student_count: bigint;
      total_assigned: string;
      total_collected: string;
      total_outstanding: string;
      paid_count: bigint;
      partial_count: bigint;
      unpaid_count: bigint;
      overdue_count: bigint;
    }>
  >`
    SELECT
      c.name as class_name,
      COUNT(DISTINCT s.id) as student_count,
      COALESCE(SUM(fc.amount), 0) as total_assigned,
      COALESCE(SUM(fc.paid_amount), 0) as total_collected,
      COALESCE(SUM(fc.amount + fc.fine - fc.paid_amount), 0) as total_outstanding,
      COUNT(DISTINCT CASE WHEN fc.status = 'PAID' THEN fc.student_id END) as paid_count,
      COUNT(DISTINCT CASE WHEN fc.status = 'PARTIAL' THEN fc.student_id END) as partial_count,
      COUNT(DISTINCT CASE WHEN fc.status = 'UNPAID' THEN fc.student_id END) as unpaid_count,
      COUNT(DISTINCT CASE WHEN fc.status = 'OVERDUE' THEN fc.student_id END) as overdue_count
    FROM classes c
    JOIN students s ON s.class_id = c.id AND s.deleted_at IS NULL
    LEFT JOIN fee_charges fc ON fc.student_id = s.id AND fc.session_id = ${sessionId}
    WHERE c.id = ${classId}
    GROUP BY c.id, c.name
  `;

  if (result.length === 0) throw new NotFoundError('Class');

  return result[0];
}

// ---- Institution-Wide KPIs ----

export async function getInstitutionKPI(sessionId?: number) {
  const where = sessionId ? { sessionId } : {};
  const charges = await prisma.feeCharge.aggregate({
    where,
    _sum: { amount: true, paidAmount: true, fine: true },
  });
  const studentCount = await prisma.student.count({
    where: { deletedAt: null, ...(sessionId ? { sessionId } : {}) },
  });
  const alertCount = await prisma.defaulterAlert.count({
    where: { status: 'ACTIVE' },
  });

  const totalAssigned = Number(charges._sum.amount ?? 0);
  const totalCollected = Number(charges._sum.paidAmount ?? 0);
  const totalFine = Number(charges._sum.fine ?? 0);
  const outstanding = totalAssigned + totalFine - totalCollected;
  const collectionRate =
    totalAssigned > 0 ? Math.round((totalCollected / totalAssigned) * 10000) / 100 : 0;

  return {
    totalStudents: studentCount,
    totalFeeAssigned: totalAssigned,
    totalFeeCollected: totalCollected,
    totalOutstanding: Math.max(0, outstanding),
    totalOverdue: await getTotalOverdue(where),
    collectionRate,
    overdueRate:
      totalAssigned > 0 ? Math.round((Math.max(0, outstanding) / totalAssigned) * 10000) / 100 : 0,
    activeDefaulters: alertCount,
  };
}

// ---- Daily Collection Register ----

export async function getDailyRegister(date: string) {
  const startDate = new Date(date);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);

  const result = await prisma.payment.findMany({
    where: { paidAt: { gte: startDate, lt: endDate }, status: 'COMPLETED' },
    include: { student: { select: { name: true, admissionNo: true } }, allocations: true },
    orderBy: { paidAt: 'asc' },
  });

  const totals = {
    cashTotal: 0,
    bankTransferTotal: 0,
    chequeTotal: 0,
    onlineTotal: 0,
    advanceTotal: 0,
  };
  for (const p of result) {
    const amount = p.amount.toNumber();
    switch (p.method) {
      case 'CASH':
        totals.cashTotal += amount;
        break;
      case 'BANK_TRANSFER':
        totals.bankTransferTotal += amount;
        break;
      case 'CHEQUE':
        totals.chequeTotal += amount;
        break;
      case 'ONLINE':
        totals.onlineTotal += amount;
        break;
    }
  }

  return { date, entries: result, totals, transactionCount: result.length };
}

// ---- Head-Wise Breakdown ----

export async function getHeadWiseBreakdown(sessionId: number) {
  const result = await prisma.$queryRaw<
    Array<{
      head_id: number;
      head_name: string;
      head_code: string;
      total_assigned: string;
      total_collected: string;
    }>
  >`
    SELECT
      fh.id as head_id,
      fh.name as head_name,
      fh.code as head_code,
      COALESCE(SUM(fc.amount), 0) as total_assigned,
      COALESCE(SUM(fc.paid_amount), 0) as total_collected
    FROM fee_heads fh
    JOIN fee_charges fc ON fc.fee_head_id = fh.id
    WHERE fc.session_id = ${sessionId}
    GROUP BY fh.id, fh.name, fh.code
    ORDER BY total_assigned DESC
  `;

  const grandTotal = result.reduce((s, r) => s + Number(r.total_assigned), 0);
  return result.map((r) => ({
    feeHeadId: Number(r.head_id),
    feeHeadName: r.head_name,
    feeHeadCode: r.head_code,
    totalAssigned: Number(r.total_assigned),
    totalCollected: Number(r.total_collected),
    collectionRate:
      Number(r.total_assigned) > 0
        ? Math.round((Number(r.total_collected) / Number(r.total_assigned)) * 10000) / 100
        : 0,
    percentageOfTotal:
      grandTotal > 0 ? Math.round((Number(r.total_assigned) / grandTotal) * 10000) / 100 : 0,
  }));
}

// ---- Helper: getTotalOverdue ----

async function getTotalOverdue(where: { sessionId?: number }): Promise<number> {
  const overdueCharges = await prisma.feeCharge.aggregate({
    where: { ...where, status: { in: ['UNPAID', 'OVERDUE', 'PARTIAL'] }, dueDate: { lt: new Date() } },
    _sum: { amount: true, paidAmount: true, fine: true },
  });
  const total = Number(overdueCharges._sum.amount ?? 0)
    + Number(overdueCharges._sum.fine ?? 0)
    - Number(overdueCharges._sum.paidAmount ?? 0);
  return Math.max(0, total);
}

// ---- Daily Aggregation Refresh with SQL injection mitigation ----

export async function refreshDailyAggregation(date?: string) {
  const targetDate = date ?? new Date().toISOString().split('T')[0];
  // Use parameterized query via Prisma $queryRawUnsafe with explicit type cast,
  // avoiding string interpolation of user-supplied values
  await prisma.$executeRaw`SELECT refresh_daily_aggregation(${targetDate}::date)`;
  return { refreshed: true, date: targetDate };
}
```

**Controller** (`aggregation.controller.ts`):

```typescript
import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../config/prisma';
import * as aggregationService from './aggregation.service';
import { ok } from '../../shared/response';
import { NotFoundError } from '../../shared/errors';

export async function getStudentSummary(req: AuthRequest, res: Response) {
  const studentId = Number(req.params.studentId);
  const student = await prisma.student.findFirst({
    where: { id: studentId, deletedAt: null },
    include: { class: true },
  });
  if (!student) throw new NotFoundError('Student');

  const summary = await aggregationService.getStudentFeeSummary(studentId);
  res.json(
    ok({
      studentId: student.id,
      studentName: student.name,
      admissionNo: student.admissionNo,
      className: student.class?.name,
      ...summary,
    }),
  );
}

export async function getClassSummary(req: AuthRequest, res: Response) {
  const classId = Number(req.params.classId);
  const sessionId = Number(req.query.sessionId) || (await getCurrentSessionId());
  const summary = await aggregationService.getClassFeeSummary(classId, sessionId);
  res.json(ok(summary));
}

export async function getInstitutionKPI(req: AuthRequest, res: Response) {
  const sessionId = req.query.sessionId ? Number(req.query.sessionId) : undefined;
  const kpi = await aggregationService.getInstitutionKPI(sessionId);
  res.json(ok(kpi));
}

export async function getDailyRegister(req: AuthRequest, res: Response) {
  const date = (req.query.date as string) ?? new Date().toISOString().split('T')[0];
  const register = await aggregationService.getDailyRegister(date);
  res.json(ok(register));
}

export async function getHeadWiseBreakdown(req: AuthRequest, res: Response) {
  const sessionId = Number(req.query.sessionId) || (await getCurrentSessionId());
  const breakdown = await aggregationService.getHeadWiseBreakdown(sessionId);
  res.json(ok(breakdown));
}

export async function getMonthlyRegister(req: AuthRequest, res: Response) {
  const month = req.query.month as string; // YYYY-MM
  if (!month)
    return res
      .status(400)
      .json({ success: false, code: 'BAD_REQUEST', message: 'month required (YYYY-MM)' });

  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr);
  const monthNum = parseInt(monthStr);
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0, 23, 59, 59);

  const payments = await prisma.payment.findMany({
    where: { paidAt: { gte: startDate, lte: endDate }, status: 'COMPLETED' },
    include: {
      student: { select: { name: true, admissionNo: true, class: true } },
      allocations: true,
    },
    orderBy: { paidAt: 'asc' },
  });

  const dailyTotals = new Map<string, number>();
  let grandTotal = 0;
  for (const p of payments) {
    const day = p.paidAt.toISOString().split('T')[0];
    dailyTotals.set(day, (dailyTotals.get(day) ?? 0) + p.amount.toNumber());
    grandTotal += p.amount.toNumber();
  }

  res.json(
    ok({
      month,
      year,
      totalPayments: payments.length,
      grandTotal,
      dailySummary: Array.from(dailyTotals.entries()).map(([date, total]) => ({ date, total })),
      payments,
    }),
  );
}

export async function refreshAggregation(req: AuthRequest, res: Response) {
  const date = req.body?.date as string | undefined;
  const result = await aggregationService.refreshDailyAggregation(date);
  res.json(ok(result));
}

async function getCurrentSessionId(): Promise<number> {
  const session = await prisma.session.findFirst({
    where: { isCurrent: true },
    select: { id: true },
  });
  return session?.id ?? 0;
}
```

**Router** (`aggregation.router.ts`):

```typescript
import { Router } from 'express';
import { authGuard } from '../../middleware/auth.middleware';
import * as aggregationController from './aggregation.controller';

export const aggregationRouter = Router();
aggregationRouter.use(authGuard);

aggregationRouter.get('/student/:studentId', aggregationController.getStudentSummary);
aggregationRouter.get('/class/:classId', aggregationController.getClassSummary);
aggregationRouter.get('/institution/kpi', aggregationController.getInstitutionKPI);
aggregationRouter.get('/daily-register', aggregationController.getDailyRegister);
aggregationRouter.get('/monthly-register', aggregationController.getMonthlyRegister);
aggregationRouter.get('/head-wise', aggregationController.getHeadWiseBreakdown);
aggregationRouter.post('/refresh', aggregationController.refreshAggregation);
```

### 3.2 Milestone 2.2 — Accountant-Grade Reporting

**Files to create:**

| File                                                   | Lines | Purpose                         |
| ------------------------------------------------------ | ----- | ------------------------------- |
| `apps/api/src/modules/reports/report-v2.service.ts`    | 300   | Comprehensive reporting queries |
| `apps/api/src/modules/reports/report-v2.controller.ts` | 150   | Report endpoint handlers        |
| `apps/api/src/modules/reports/report-v2.router.ts`     | 50    | Report routes                   |

**Key Service Functions:**

```typescript
// ---- Student Fee Ledger ----

export async function getStudentLedger(studentId: number, sessionId?: number) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, deletedAt: null },
    include: { class: true, session: true },
  });
  if (!student) throw new NotFoundError('Student');

  const chargeWhere: Prisma.FeeChargeWhereInput = { studentId };
  if (sessionId) chargeWhere.sessionId = sessionId;

  const [charges, payments, discounts, concessions, ledger] = await Promise.all([
    prisma.feeCharge.findMany({
      where: chargeWhere,
      include: { feeHead: true, payments: true },
      orderBy: [{ dueDate: 'asc' }, { feeMonth: 'asc' }],
    }),
    prisma.payment.findMany({
      where: { studentId, status: 'COMPLETED' },
      include: { allocations: { include: { feeCharge: { include: { feeHead: true } } } } },
      orderBy: { paidAt: 'desc' },
    }),
    prisma.discount.findMany({ where: { studentId, isActive: true } }),
    prisma.studentConcession.findMany({
      where: { studentId },
      include: { concession: true, feeHead: true },
    }),
    prisma.studentLedger.findUnique({ where: { studentId } }),
  ]);

  const summary = {
    totalCharged: charges.reduce((s, c) => s + c.amount.toNumber(), 0),
    totalFine: charges.reduce((s, c) => s + c.fine.toNumber(), 0),
    totalPaid: charges.reduce((s, c) => s + c.paidAmount.toNumber(), 0),
    totalDiscount: vouchers ? vouchers.reduce((s, v) => s + v.discount.toNumber(), 0) : 0,
    advanceBalance: Number(ledger?.advance ?? 0),
  };
  summary.outstandingBalance = summary.totalCharged + summary.totalFine - summary.totalPaid;

  return { student, summary, charges, payments, discounts, concessions };
}

// ---- Defaulter List (with pagination) ----

export async function getDefaulterList(sessionId: number, minOverdueDays = 1, page = 1, limit = 100) {
  const result = await prisma.$queryRaw<
    Array<{
      student_id: number;
      admission_no: string;
      name: string;
      father_name: string;
      contact_no: string;
      address: string;
      class_name: string;
      total_outstanding: string;
      overdue_days: number;
    }>
  >`
    SELECT
      s.id as student_id,
      s.admission_no,
      s.name,
      s.father_name,
      s.contact_no,
      s.address,
      c.name as class_name,
      COALESCE(SUM(fc.amount + fc.fine - fc.paid_amount), 0) as total_outstanding,
      EXTRACT(DAY FROM NOW() - MIN(fc.due_date))::int as overdue_days
    FROM students s
    JOIN classes c ON c.id = s.class_id
    JOIN fee_charges fc ON fc.student_id = s.id
    WHERE s.session_id = ${sessionId}
      AND s.deleted_at IS NULL
      AND fc.status IN ('UNPAID', 'OVERDUE', 'PARTIAL')
      AND fc.due_date < NOW()
    GROUP BY s.id, s.admission_no, s.name, s.father_name, s.contact_no, s.address, c.name
    HAVING EXTRACT(DAY FROM NOW() - MIN(fc.due_date))::int >= ${minOverdueDays}
    ORDER BY overdue_days DESC, total_outstanding DESC
    LIMIT ${limit} OFFSET ${(page - 1) * limit}
  `;

  return result.map((r) => ({
    ...r,
    totalOutstanding: Number(r.total_outstanding),
    overdueDays: Number(r.overdue_days),
  }));
}

// ---- Class Collection Summary ----

export async function getClassCollectionSummary(sessionId: number, page = 1, limit = 50) {
  const result = await prisma.$queryRaw<
    Array<{
      class_id: number;
      class_name: string;
      student_count: bigint;
      total_assigned: string;
      total_collected: string;
      total_outstanding: string;
      collection_rate: string;
    }>
  >`
    SELECT
      c.id as class_id,
      c.name as class_name,
      COUNT(DISTINCT s.id) as student_count,
      COALESCE(SUM(fc.amount), 0) as total_assigned,
      COALESCE(SUM(fc.paid_amount), 0) as total_collected,
      COALESCE(SUM(fc.amount + fc.fine - fc.paid_amount), 0) as total_outstanding,
      CASE
        WHEN COALESCE(SUM(fc.amount), 0) > 0
        THEN ROUND((COALESCE(SUM(fc.paid_amount), 0) / COALESCE(SUM(fc.amount), 0)) * 100, 2)
        ELSE 0
      END as collection_rate
    FROM classes c
    JOIN students s ON s.class_id = c.id AND s.deleted_at IS NULL
    LEFT JOIN fee_charges fc ON fc.student_id = s.id AND fc.session_id = ${sessionId}
    GROUP BY c.id, c.name
    ORDER BY c.name ASC
  `;

  return result.map((r) => ({
    classId: Number(r.class_id),
    className: r.class_name,
    studentCount: Number(r.student_count),
    totalAssigned: Number(r.total_assigned),
    totalCollected: Number(r.total_collected),
    totalOutstanding: Number(r.total_outstanding),
    collectionRate: Number(r.collection_rate),
  }));
}

// ---- Comparative Report ----

export async function getComparativeReport(session1Id: number, session2Id: number) {
  const s1 = await getSessionSnapshot(session1Id);
  const s2 = await getSessionSnapshot(session2Id);

  return {
    session1: { id: session1Id, ...s1 },
    session2: { id: session2Id, ...s2 },
    variance: {
      assignedChange: s2.totalAssigned - s1.totalAssigned,
      collectedChange: s2.totalCollected - s1.totalCollected,
      assignedPercent:
        s1.totalAssigned > 0
          ? Math.round(((s2.totalAssigned - s1.totalAssigned) / s1.totalAssigned) * 10000) / 100
          : 0,
      collectedPercent:
        s1.totalCollected > 0
          ? Math.round(((s2.totalCollected - s1.totalCollected) / s1.totalCollected) * 10000) / 100
          : 0,
    },
  };
}

async function getSessionSnapshot(sessionId: number) {
  const charges = await prisma.feeCharge.aggregate({
    where: { sessionId },
    _sum: { amount: true, paidAmount: true, fine: true },
  });
  return {
    totalAssigned: Number(charges._sum.amount ?? 0),
    totalCollected: Number(charges._sum.paidAmount ?? 0),
    totalFine: Number(charges._sum.fine ?? 0),
    totalOutstanding:
      Number(charges._sum.amount ?? 0) +
      Number(charges._sum.fine ?? 0) -
      Number(charges._sum.paidAmount ?? 0),
  };
}

// ---- Concession / Scholarship Report ----

export async function getConcessionReport(sessionId: number) {
  const concessions = await prisma.studentConcession.findMany({
    where: { student: { sessionId } },
    include: {
      student: { select: { name: true, admissionNo: true, class: true } },
      concession: true,
      feeHead: true,
    },
  });

  const byConcession = new Map<string, { count: number; totalValue: number }>();
  for (const sc of concessions) {
    const name = sc.concession.name;
    const existing = byConcession.get(name) ?? { count: 0, totalValue: 0 };
    existing.count++;
    existing.totalValue +=
      sc.concession.type === 'PERCENTAGE'
        ? 0 // percentage-based, actual value depends on fee structure
        : sc.concession.value.toNumber();
    byConcession.set(name, existing);
  }

  return {
    totalConcessions: concessions.length,
    summaryByType: Array.from(byConcession.entries()).map(([name, data]) => ({ name, ...data })),
    details: concessions,
  };
}
```

### 3.3 Milestone 2.3 — Defaulter Management & Alerts

**Files to create:**

| File                                                      | Lines | Purpose                                        |
| --------------------------------------------------------- | ----- | ---------------------------------------------- |
| `apps/api/src/modules/defaulters/defaulter.service.ts`    | 150   | Aging calculation, alert generation/resolution |
| `apps/api/src/modules/defaulters/defaulter.controller.ts` | 80    | Endpoint handlers                              |
| `apps/api/src/modules/defaulters/defaulter.router.ts`     | 30    | Routes                                         |

**Aging Bucket Logic:**

```typescript
// 0-30 days → YELLOW
// 31-60 days → ORANGE
// 61+ days  → RED

export function determineAlertLevel(overdueDays: number): 'YELLOW' | 'ORANGE' | 'RED' {
  if (overdueDays >= 61) return 'RED';
  if (overdueDays >= 31) return 'ORANGE';
  return 'YELLOW';
}

export async function generateAlerts(sessionId: number) {
  // Find all students with overdue charges
  const overdueStudents = await prisma.$queryRaw<
    Array<{
      student_id: number;
      overdue_days: number;
      amount_due: string;
    }>
  >`
    SELECT
      fc.student_id,
      EXTRACT(DAY FROM NOW() - MIN(fc.due_date))::int as overdue_days,
      COALESCE(SUM(fc.amount + fc.fine - fc.paid_amount), 0) as amount_due
    FROM fee_charges fc
    WHERE fc.session_id = ${sessionId}
      AND fc.status IN ('UNPAID', 'OVERDUE', 'PARTIAL')
      AND fc.due_date < NOW()
    GROUP BY fc.student_id
    HAVING EXTRACT(DAY FROM NOW() - MIN(fc.due_date))::int >= 1
  `;

  let created = 0;
  for (const row of overdueStudents) {
    const alertLevel = determineAlertLevel(Number(row.overdue_days));

    // Check if active alert already exists
    const existing = await prisma.defaulterAlert.findFirst({
      where: { studentId: Number(row.student_id), sessionId, status: 'ACTIVE' },
    });
    if (existing) {
      // Update existing alert if level changed
      if (existing.alertLevel !== alertLevel) {
        await prisma.defaulterAlert.update({
          where: { id: existing.id },
          data: {
            alertLevel,
            overdueDays: Number(row.overdue_days),
            amountDue: Number(row.amount_due),
          },
        });
      }
      continue;
    }

    await prisma.defaulterAlert.create({
      data: {
        studentId: Number(row.student_id),
        sessionId,
        overdueDays: Number(row.overdue_days),
        amountDue: Number(row.amount_due),
        alertLevel,
      },
    });
    created++;
  }

  return { generated: created, total: overdueStudents.length };
}
```

### 3.4 Milestone 2.4 — Cheque Bounce Enhancement

**Enhance existing** `apps/api/src/modules/payments/payment.service.ts`:

```typescript
export async function reversePayment(paymentId: number, dto: ReversePaymentDto, user: Actor) {
  // ... existing logic ...

  // NEW: Apply bounce fee if reason is CHEQUE_BOUNCE
  if (dto.reason === 'CHEQUE_BOUNCE') {
    const bounceRule = await prisma.bounceFeeRule.findFirst({ where: { isActive: true } });
    if (bounceRule) {
      // Create a new fee charge for the bounce fee
      const bounceHead = await prisma.feeHead.findFirst({ where: { code: 'BOUNCE_FEE' } });
      if (!bounceHead) {
        // Auto-create bounce fee head if not exists
        bounceHead = await prisma.feeHead.create({
          data: { name: 'Cheque Bounce Fee', code: 'BOUNCE_FEE', sortOrder: 999 },
        });
      }

      await prisma.feeCharge.create({
        data: {
          studentId: payment.studentId,
          feeHeadId: bounceHead.id,
          sessionId: payment.sessionId ?? (await getCurrentSessionId()),
          feeMonth: new Date().toISOString().slice(0, 7),
          amount: bounceRule.fee,
          dueDate: new Date(),
          fine: 0,
        },
      });
    }
  }

  // ... rest of existing logic ...
}
```

### 3.5 Milestone 2.5 — Export Engine

**Files to create:**

| File                                                | Lines | Purpose                         |
| --------------------------------------------------- | ----- | ------------------------------- |
| `apps/api/src/modules/exports/export.service.ts`    | 150   | Excel (xlsx) and PDF generation |
| `apps/api/src/modules/exports/export.controller.ts` | 80    | Export endpoint handlers        |
| `apps/api/src/modules/exports/export.router.ts`     | 30    | Routes                          |

**Dependencies to add to `apps/api/package.json`:**

```json
"exceljs": "^4.4.0",
"puppeteer": "^22.0.0"
```

### 3.6 Route Registration in `app.ts`

Add to `apps/api/src/app.ts`:

```typescript
import { aggregationRouter } from './modules/aggregation/aggregation.router';
import { defaulterRouter } from './modules/defaulters/defaulter.router';
import { reportV2Router } from './modules/reports/report-v2.router';
import { exportRouter } from './modules/exports/export.router';

// After existing routes
app.use('/api/v1/aggregation', aggregationRouter);
app.use('/api/v1/defaulters', defaulterRouter);
app.use('/api/v1/reports/v2', reportV2Router);
app.use('/api/v1/exports', exportRouter);
```

---

## 4) Phase 3 — Frontend Implementation

### 4.1 Milestone 3.1 — KPI Dashboard Enhancement

**Files to create/modify:**

| File                                                           | Lines  | Type     |
| -------------------------------------------------------------- | ------ | -------- |
| `apps/web/src/components/dashboard/FeeKPICards.tsx`            | 100    | New      |
| `apps/web/src/components/dashboard/CollectionTrendChart.tsx`   | 80     | New      |
| `apps/web/src/components/dashboard/HeadWiseBreakdownChart.tsx` | 80     | New      |
| `apps/web/src/components/dashboard/DefaulterAgingChart.tsx`    | 70     | New      |
| `apps/web/src/components/dashboard/PaymentMethodChart.tsx`     | 60     | New      |
| `apps/web/src/lib/hooks/useAggregation.ts`                     | 120    | New      |
| `apps/web/src/app/dashboard/page.tsx`                          | Modify | Enhanced |

**New dependency for `apps/web/package.json`:**

```json
"recharts": "^2.12.0"
```

**KPI Hook** (`useAggregation.ts`):

```typescript
export function useInstitutionKPI(sessionId?: number) {
  return useQuery({
    queryKey: ['aggregation', 'kpi', sessionId],
    queryFn: () => api.get<any>('/aggregation/institution/kpi'),
  });
}

export function useDailyRegister(date?: string) {
  return useQuery({
    queryKey: ['aggregation', 'daily-register', date],
    queryFn: () => api.get<any>(`/aggregation/daily-register?date=${date}`),
  });
}

export function useHeadWiseBreakdown(sessionId?: number) {
  return useQuery({
    queryKey: ['aggregation', 'head-wise', sessionId],
    queryFn: () => api.get<any>(`/aggregation/head-wise?sessionId=${sessionId}`),
  });
}

export function useMonthlyRegister(month: string) {
  return useQuery({
    queryKey: ['aggregation', 'monthly-register', month],
    queryFn: () => api.get<any>(`/aggregation/monthly-register?month=${month}`),
  });
}
```

**Enhanced Dashboard Page:**

```tsx
// apps/web/src/app/dashboard/page.tsx (enhanced)
import { FeeKPICards } from '@/components/dashboard/FeeKPICards';
import { CollectionTrendChart } from '@/components/dashboard/CollectionTrendChart';
import { HeadWiseBreakdownChart } from '@/components/dashboard/HeadWiseBreakdownChart';
import { DefaulterAgingChart } from '@/components/dashboard/DefaulterAgingChart';
import { PaymentMethodChart } from '@/components/dashboard/PaymentMethodChart';
import { useInstitutionKPI, useHeadWiseBreakdown } from '@/lib/hooks/useAggregation';

export default function DashboardPage() {
  const { data: kpi } = useInstitutionKPI();
  const { data: headWise } = useHeadWiseBreakdown();
  // ... existing stats ...

  return (
    <div className="space-y-6">
      <FeeKPICards kpi={kpi} />
      <StatsGrid stats={stats} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CollectionTrendChart />
        <HeadWiseBreakdownChart data={headWise} />
        <DefaulterAgingChart />
        <PaymentMethodChart />
      </div>
    </div>
  );
}
```

### 4.2 Milestone 3.2 — Reports UI Pages

**Sidebar Navigation** update in `apps/web/src/components/layout/Sidebar.tsx`:

```typescript
const nav = [
  // ... existing entries ...
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
] as const;
```

**Report Index Page** (`apps/web/src/app/dashboard/reports/page.tsx`):

```tsx
const reportLinks = [
  {
    href: '/dashboard/reports/student-ledger',
    title: 'Student Fee Ledger',
    desc: 'Complete fee history per student',
  },
  {
    href: '/dashboard/reports/class-collection',
    title: 'Class Collection Summary',
    desc: 'Collection rates by class',
  },
  {
    href: '/dashboard/reports/collection-register',
    title: 'Daily/Monthly Register',
    desc: 'Cash book style collection records',
  },
  {
    href: '/dashboard/reports/defaulters',
    title: 'Defaulter List',
    desc: 'Overdue students with aging analysis',
  },
  {
    href: '/dashboard/reports/head-wise',
    title: 'Head-Wise Breakdown',
    desc: 'Collection by fee head category',
  },
  {
    href: '/dashboard/reports/comparative',
    title: 'Comparative Report',
    desc: 'Cross-term/year comparison',
  },
  {
    href: '/dashboard/reports/concessions',
    title: 'Concessions Report',
    desc: 'Scholarships & discounts summary',
  },
];
```

**Report Hooks** (`apps/web/src/lib/hooks/useReports.ts`):

```typescript
export function useStudentLedger(studentId: number, sessionId?: number) {
  return useQuery({
    queryKey: ['reports', 'student-ledger', studentId, sessionId],
    queryFn: () =>
      api.get<any>(
        `/reports/v2/student-ledger/${studentId}${sessionId ? `?sessionId=${sessionId}` : ''}`,
      ),
    enabled: !!studentId,
  });
}

export function useDefaulterList(sessionId: number, minOverdue = 1) {
  return useQuery({
    queryKey: ['reports', 'defaulters', sessionId, minOverdue],
    queryFn: () =>
      api.get<any>(`/reports/v2/defaulters?sessionId=${sessionId}&minOverdue=${minOverdue}`),
    enabled: !!sessionId,
  });
}

export function useComparativeReport(session1Id: number, session2Id: number) {
  return useQuery({
    queryKey: ['reports', 'comparative', session1Id, session2Id],
    queryFn: () =>
      api.get<any>(`/reports/v2/comparative?session1=${session1Id}&session2=${session2Id}`),
    enabled: !!session1Id && !!session2Id,
  });
}
```

### 4.3 Milestone 3.3 — Enhanced Voucher Operations

**Add to existing pages:**

- Batch selection UI in voucher list page
- Bulk status update modal
- Voucher reprint tracking UI

**New File:** `apps/web/src/components/vouchers/BulkVoucherActions.tsx`

```tsx
export function BulkVoucherActions({
  selectedIds,
  onComplete,
}: {
  selectedIds: number[];
  onComplete: () => void;
}) {
  const [action, setAction] = useState<'PAID' | 'CANCELLED' | 'OVERDUE'>('PAID');

  async function handleBulkUpdate() {
    const BATCH_SIZE = 50;
    for (let i = 0; i < selectedIds.length; i += BATCH_SIZE) {
      const batch = selectedIds.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((id) => api.patch(`/vouchers/${id}/status`, { status: action })),
      );
    }
    onComplete();
  }

  return (
    <div className="flex items-center gap-2">
      <select value={action} onChange={(e) => setAction(e.target.value as any)}>
        <option value="PAID">Mark Paid</option>
        <option value="CANCELLED">Mark Cancelled</option>
        <option value="OVERDUE">Mark Overdue</option>
      </select>
      <Button onClick={handleBulkUpdate} disabled={selectedIds.length === 0}>
        Update {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
      </Button>
    </div>
  );
}
```



## 5) Phase 4 — Infrastructure & DevOps

### 5.1 Database Backup Automation

**New file:** `scripts/backup-db.sh`

```bash
#!/bin/bash
# PostgreSQL backup script
# Usage: ./scripts/backup-db.sh [output-dir]

set -euo pipefail
OUTPUT_DIR="${1:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/sms}"

mkdir -p "$OUTPUT_DIR"
pg_dump "$DB_URL" \
  --format=custom \
  --compress=9 \
  --file="${OUTPUT_DIR}/sms_backup_${TIMESTAMP}.dump"

echo "Backup saved: ${OUTPUT_DIR}/sms_backup_${TIMESTAMP}.dump"

# Keep only last 30 backups
ls -t "${OUTPUT_DIR}"/*.dump | tail -n +31 | xargs -r rm
```

**Docker compose enhancement** (`docker-compose.yml`):

```yaml
services:
  # ... existing services ...
  backup:
    image: postgres:15-alpine
    container_name: sms-db-backup
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/sms
    volumes:
      - ./backups:/backups
      - ./scripts:/scripts:ro
    command: |
      sh -c "
      apk add --no-cache aws-cli && \
      while true; do
        pg_dump $$DATABASE_URL --format=custom --compress=9 --file=/backups/sms_backup_$$(date +%Y%m%d_%H%M%S).dump && \
        echo 'Backup complete' && \
        ls -t /backups/*.dump | tail -n +31 | xargs -r rm && \
        sleep 86400; \
      done
      "
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
```

### 5.2 Multi-Campus Data Isolation Middleware

**New file:** `apps/api/src/middleware/campus.middleware.ts`

```typescript
import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.middleware';
import { ForbiddenError } from '../shared/errors';

/**
 * Restrict a route to a specific campus.
 * The campus ID comes from the authenticated user's metadata.
 */
export function campusGuard(req: AuthRequest, _res: Response, next: NextFunction): void {
  // Super admins bypass campus filter
  if (req.user?.role === 'admin' && req.headers['x-bypass-campus']) {
    return next();
  }

  const campusId = (req.user as any)?.campusId;
  if (!campusId) {
    throw new ForbiddenError('No campus assigned to this user');
  }

  // Attach campusId to request for downstream middleware
  (req as any).campusId = campusId;
  next();
}

/**
 * Prisma middleware that automatically filters by campus.
 */
export function createCampusPrismaFilter(campusId: number, models: string[]) {
  return {
    async $allOperations({ model, operation, args, query }: any) {
      if (models.includes(model!) && ['findMany', 'count', 'aggregate'].includes(operation)) {
        args.where = { ...args.where, campusId };
      }
      return query(args);
    },
  };
}
```

### 5.3 CI/CD Pipeline Enhancement

**New file:** `.github/workflows/deploy.yml`

```yaml
name: Deploy SMS Platform

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: sms_test
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run prisma:generate --workspace @sms/api
      - run: npm run type-check
      - run: npm run lint
      - run: npm test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker images
        run: |
          docker compose build
          docker compose push
      - name: Deploy to production
        run: |
          # SSH deploy commands
          echo "Deploying to production..."
```

### 5.4 Performance Optimization

**Index recommendations for aggregation queries:**

```prisma
// Add to existing models:
model FeeCharge {
  @@index([sessionId, status, dueDate])       // Defaulter query
  @@index([studentId, sessionId, status])      // Student ledger
  @@index([feeHeadId, sessionId])              // Head-wise breakdown
}

model Payment {
  @@index([paidAt, status, method])            // Daily register
  @@index([studentId, paidAt, status])         // Payment history
}

model Voucher {
  @@index([status, studentId])                 // Pending query
}
```

**Redis caching (optional enhancement):**

```dockerfile
# docker-compose.yml addition
redis:
  image: redis:7-alpine
  container_name: sms-redis
  ports: ['6379:6379']
  restart: unless-stopped
```

```typescript
// Simple in-memory cache as fallback (no Redis dependency)
const aggCache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = CACHE_TTL,
): Promise<T> {
  const cached = aggCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  const data = await fetcher();
  aggCache.set(key, { data, expiresAt: Date.now() + ttl });
  // Prevent memory leak: limit cache size
  if (aggCache.size > 100) {
    const oldestKey = aggCache.keys().next().value;
    if (oldestKey) aggCache.delete(oldestKey);
  }
  return data;
}
```

---

## 6) Phase 5 — Testing Strategy

### 6.1 Unit Tests (Vitest)

| Test File                     | Tests | Coverage                                                              |
| ----------------------------- | ----- | --------------------------------------------------------------------- |
| `aggregation.service.test.ts` | 15    | Rollup queries, edge cases (zero data, single student, large dataset) |
| `report-v2.service.test.ts`   | 12    | Student ledger, defaulter aging, comparative, calculation accuracy    |
| `defaulter.service.test.ts`   | 10    | Alert level boundaries (30/60 days), escalation, dedup                |
| `payment.service.test.ts`     | +5    | Cheque bounce fee, reversal with bounce                               |
| `late-fine.service.test.ts`   | +3    | Grace days, max cap boundary                                          |

### 6.2 Integration Tests

| Test File                 | Tests | Coverage                                       |
| ------------------------- | ----- | ---------------------------------------------- |
| `aggregation.api.test.ts` | 8     | All aggregation endpoints with seeded data     |
| `report-v2.api.test.ts`   | 10    | All report endpoints, data accuracy assertions |
| `defaulter.api.test.ts`   | 5     | Alert generation, resolution workflow          |
| `export.api.test.ts`      | 4     | Excel/PDF generation output validation         |

### 6.3 E2E Tests (Playwright)

| Test File               | Tests | Coverage                                                |
| ----------------------- | ----- | ------------------------------------------------------- |
| `dashboard-kpi.spec.ts` | 5     | KPI cards render, charts display data                   |
| `reports.spec.ts`       | 10    | All report pages render, filters work, tables populated |
| `defaulters.spec.ts`    | 3     | Defaulter list, aging buckets, alert display            |

### 6.4 Reconciliation Validation

```typescript
// Aggregation accuracy validation script
async function validateAggregationAccuracy() {
  // Compare raw query totals vs. aggregation table
  const rawTotals = await prisma.feeCharge.aggregate({
    _sum: { amount: true, paidAmount: true, fine: true },
  });

  const aggregated = await prisma.feeAggregationDaily.aggregate({
    _sum: { totalAssigned: true, totalPaid: true, totalFine: true },
  });

  const diff = {
    assigned: Number(rawTotals._sum.amount ?? 0) - Number(aggregated._sum.totalAssigned ?? 0),
    paid: Number(rawTotals._sum.paidAmount ?? 0) - Number(aggregated._sum.totalPaid ?? 0),
    fine: Number(rawTotals._sum.fine ?? 0) - Number(aggregated._sum.totalFine ?? 0),
  };

  // Tolerance: PKR 0.01 (acceptable rounding difference)
  const tolerance = 0.01;
  const isValid = Object.values(diff).every((d) => Math.abs(d) <= tolerance);

  return { isValid, diff, rawTotals, aggregated };
}
```

---

## 7) Edge Cases & Error Handling

| Scenario                                   | Handling                                                     | Code Location                                                                    |
| ------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Student with zero charges                  | Return zero-filled summary, not error                        | `aggregation.service.ts` — `getStudentFeeSummary`                                |
| Defaulter with no contact info             | Flag "contact missing" in report output                      | `report-v2.service.ts` — `getDefaulterList`                                      |
| Large date range (>1 year)                 | Batch processing with cursor pagination                      | `report-v2.controller.ts` — streaming response                                   |
| Concurrent payment + aggregation refresh   | Optimistic concurrency on aggregation table                  | `defaulter.service.ts` — alert dedup check                                       |
| Cheque bounce with advance balance         | Reverse advance allocation first, then fee charges           | `payment.service.ts` — enhanced reversal                                         |
| Session rollover mid-year                  | Prorate fee structures for remaining months (future feature) | N/A (deferred to v2.1)                                                           |
| Zero-amount vouchers                       | Allow (concession/full scholarship cases)                    | `voucher.service.ts` — no validation blocking zero amounts                       |
| Decimal rounding in aggregation            | Banker's rounding, 2 decimal precision                       | `aggregation.service.ts` — all numerical outputs use `Math.round(x * 100) / 100` |
| Daily aggregation for future dates         | No-op, return empty result                                   | `aggregation.service.ts` — `refreshDailyAggregation`                             |
| Payment reversal after aggregation refresh | Auto-increment version counter, stale data warning           | `aggregation.controller.ts` — `refreshAggregation`                               |
| Bulk voucher generation for 1000+ students | Batch size limit (500 per batch), progress tracking          | `voucher.service.ts` — enhanced batch processing                                 |

---

## 8) Professional Accountant Compliance Framework

This section defines the accounting standards, controls, and procedures that must govern the fee management system to ensure audit-ready financial reporting in compliance with **International Financial Reporting Standards (IFRS)** and **Pakistan's Companies Act 2017 / SECP requirements** for educational institutions.

### 8.1 Accounting Standards Applied

| Standard | Application | System Implementation |
|----------|------------|----------------------|
| **IAS 1** — Presentation of Financial Statements | P&L, Balance Sheet, Cash Flow classification | FeeAggregationDaily → Monthly P&L, Balance sheet views |
| **IAS 18 / IFRS 15** — Revenue Recognition | Fee revenue recognized in the period it relates to | FeeCharge records revenue in the feeMonth, not payment date |
| **IAS 37** — Provisions & Contingencies | Bad debt provisioning for overdue amounts | DefaulterAlert escalation → Provision calculation |
| **IAS 21** — FX Effects | N/A (PKR only) | Single-currency domain, no FX translation needed |
| **IFRS 9** — Financial Instruments | Receivables classification, impairment | FeeCharge status tracking, aging-based ECL model |

### 8.2 Double-Entry Verification Protocol

Every financial transaction must satisfy the accounting equation:
```
Assets (Receivables + Cash) = Liabilities (Advance Payments) + Equity (Retained Earnings)
```

| Transaction Type | Debit Entry | Credit Entry | System Enforcement |
|-----------------|-------------|--------------|-------------------|
| Fee Charge Creation | Student Receivable ↑ (FeeCharge) | Revenue ↑ (via Voucher) | `voucher.service.ts` creates FeeCharge + Voucher atomically |
| Cash Payment | Cash/Bank ↑ (Payment) | Student Receivable ↓ (FeeCharge paidAmount ↑) | `payment.service.ts` — allocation against charges |
| Advance Payment | Cash/Bank ↑ (Payment) | Advance Liability ↑ (StudentLedger) | `payment.service.ts` — isAdvance flag |
| Advance Utilization | Advance Liability ↓ | Student Receivable ↓ | Allocation in `payment.service.ts` |
| Discount Applied | Revenue ↓ (Voucher discount) | Student Receivable ↓ (contra-asset) | Computed in `computeVoucherAmounts()` |
| Late Fine Applied | Student Receivable ↑ (FeeCharge fine) | Fine Revenue ↑ | `late-fine.service.ts` |
| Payment Reversal | Student Receivable ↑ | Cash/Bank ↓ | `reversePayment()` — compensating entry |
| Cheque Bounce | Student Receivable ↑ + Bounce Fee ↑ | Cash/Bank ↓ | Enhanced `reversePayment()` with BounceFeeRule |
| Concession Applied | Revenue ↓ (contra-revenue) | Student Receivable ↓ (contra-asset) | `student_concessions` table in aggregation |

**Reconciliation Proof:** At any point, the system must satisfy:
```sql
-- Balance check query (run as reconciliation job)
SELECT
  SUM(fc.amount + fc.fine - fc.paid_amount) as gross_receivable,
  SUM(sl.advance) as advance_liability,
  SUM(v.discount) as total_discount_given,
  SUM(sc_agg.concession_value) as total_concession_given
FROM fee_charges fc
LEFT JOIN student_ledgers sl ON sl.student_id = fc.student_id
LEFT JOIN vouchers v ON v.id = fc.voucher_id
-- Gross Receivable + Advance Liability should = Total Fee Charged (proof of completeness)
```

### 8.3 Revenue Recognition Rules

| Scenario | Recognition Timing | Journal Entry |
|----------|-------------------|---------------|
| Monthly tuition fee | Upon voucher generation for the fee month | Dr. Student Receivable, Cr. Tuition Revenue |
| Annual admission fee | At start of academic year (once per session) | Dr. Student Receivable, Cr. Admission Revenue |
| Late fine | When payment is received after due date | Dr. Student Receivable, Cr. Fine Revenue |
| Discount | At voucher generation (reduces revenue) | Dr. Discount Contra-Revenue, Cr. Student Receivable |
| Concession | At voucher generation (reduces revenue) | Dr. Concession Contra-Revenue, Cr. Student Receivable |

### 8.4 Bad Debt & Provisioning Policy

| Aging Bucket | Provision Rate | Accounting Treatment |
|-------------|---------------|---------------------|
| 0-30 days (YELLOW) | 0% | No provision |
| 31-60 days (ORANGE) | 25% of outstanding | Dr. Bad Debt Expense, Cr. Allowance for Doubtful Accounts |
| 61-90 days (RED) | 50% of outstanding | Dr. Bad Debt Expense, Cr. Allowance for Doubtful Accounts |
| 91+ days (CRITICAL) | 100% of outstanding | Dr. Bad Debt Expense, Cr. Allowance for Doubtful Accounts |

**Implementation:**
```sql
-- Monthly bad debt provision calculation
CREATE OR REPLACE FUNCTION calculate_monthly_provision(session_id INT, as_of_date DATE)
RETURNS TABLE(aging_bucket TEXT, outstanding DECIMAL, provision_rate DECIMAL, provision_amount DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN EXTRACT(DAY FROM as_of_date - fc.due_date) BETWEEN 0 AND 30 THEN '0-30 days'
      WHEN EXTRACT(DAY FROM as_of_date - fc.due_date) BETWEEN 31 AND 60 THEN '31-60 days'
      WHEN EXTRACT(DAY FROM as_of_date - fc.due_date) BETWEEN 61 AND 90 THEN '61-90 days'
      ELSE '91+ days'
    END as aging_bucket,
    SUM(fc.amount + fc.fine - fc.paid_amount) as outstanding,
    CASE
      WHEN EXTRACT(DAY FROM as_of_date - fc.due_date) BETWEEN 0 AND 30 THEN 0.00
      WHEN EXTRACT(DAY FROM as_of_date - fc.due_date) BETWEEN 31 AND 60 THEN 0.25
      WHEN EXTRACT(DAY FROM as_of_date - fc.due_date) BETWEEN 61 AND 90 THEN 0.50
      ELSE 1.00
    END as provision_rate,
    SUM(fc.amount + fc.fine - fc.paid_amount) *
    CASE
      WHEN EXTRACT(DAY FROM as_of_date - fc.due_date) BETWEEN 0 AND 30 THEN 0.00
      WHEN EXTRACT(DAY FROM as_of_date - fc.due_date) BETWEEN 31 AND 60 THEN 0.25
      WHEN EXTRACT(DAY FROM as_of_date - fc.due_date) BETWEEN 61 AND 90 THEN 0.50
      ELSE 1.00
    END as provision_amount
  FROM fee_charges fc
  WHERE fc.session_id = calculate_monthly_provision.session_id
    AND fc.status IN ('UNPAID', 'OVERDUE', 'PARTIAL')
    AND fc.due_date < as_of_date
  GROUP BY aging_bucket
  ORDER BY aging_bucket;
END;
$$ LANGUAGE plpgsql;
```

### 8.5 GST / Sales Tax Compliance (Pakistan Context)

Under **Pakistan Sales Tax Act 1990** and **Sindh Revenue Board (SRB)** regulations for educational institutions:

| Tax Type | Rate | Applicability | System Handling |
|----------|------|---------------|----------------|
| Sales Tax on Fee (if applicable) | 0% (standard) | Educational services are zero-rated | Default 0% — configurable via `FeeHead.taxRate` |
| Income Tax Withholding (Section 153) | Varies | Payments to contractors/suppliers | Separate module (not in scope) |
| Federal Excise Duty | 0% | Education exempt | No handling needed |

If an institution is registered for sales tax, add a `taxRate` column to `FeeHead` and compute:
```typescript
// Tax computation in aggregation
const taxExclusive = lineAmount;
const taxAmount = taxExclusive * (feeHead.taxRate / 100);
const taxInclusive = taxExclusive + taxAmount;
```

### 8.6 Financial Year-End Closing Procedure

| Step | Action | System Process | Verification |
|------|--------|---------------|-------------|
| 1 | Verify all payments reconciled | No payments in `PENDING` status for >7 days | Reconciliation report |
| 2 | Run final aggregation | `REFRESH MATERIALIZED VIEW fee_aggregation_daily` for year-end date | Compare against raw charge totals |
| 3 | Compute bad debt provision | `calculate_monthly_provision(session_id, year_end_date)` | Provision report |
| 4 | Generate annual financial statements | P&L, Balance Sheet, Receivables Schedule | Manual review |
| 5 | Close accounting period | Set `Session.isClosed = true` — no further mutations allowed | `fee_charges` locked for closed sessions |
| 6 | Roll over to new session | Create new session via `rolloverSession()` | Verify student mappings |
| 7 | Archive audit trail | Export audit logs for closed period | Data integrity check |

**New Prisma model for period close:**
```prisma
model AccountingPeriod {
  id          Int      @id @default(autoincrement())
  sessionId   Int      @unique
  startDate   DateTime
  endDate     DateTime
  isClosed    Boolean  @default(false)
  closedAt    DateTime?
  closedBy    String?
  verifiedAt  DateTime?
  verifiedBy  String?
  session     Session  @relation(fields: [sessionId], references: [id])

  @@map("accounting_periods")
}
```

### 8.7 Financial Ratio Analysis Framework

The system should compute these KPIs for the executive dashboard:

| Ratio | Formula | Meaning | Target Range |
|-------|---------|---------|-------------|
| **Collection Efficiency** | Total Collected / Total Fee Assigned × 100 | How effectively fees are collected | >90% |
| **Overdue Ratio** | Total Overdue / Total Fee Assigned × 100 | Percentage of fee in arrears | <10% |
| **Bad Debt Ratio** | Provision Amount / Total Fee Assigned × 100 | Expected uncollectible amount | <3% |
| **Advance Utilization** | Advance Balance / Total Monthly Fee × 100 | Months of fee covered by advances | 0-2 months |
| **Discount Impact** | Total Discount Given / Total Fee Assigned × 100 | Revenue lost to discounts | <5% |
| **Concession Impact** | Total Concession Given / Total Fee Assigned × 100 | Revenue lost to scholarships | <15% |
| **Cost-to-Collect** | Total Collection Cost / Total Collected × 100 | Admin efficiency | <5% |
| **Per-Student Revenue** | Total Collected / Active Student Count | Average fee per student | Varies by school |

### 8.8 Contra Entry Handling

```typescript
// Contra entries in the fee ledger must always cancel in pairs:
// Contra-Discount: Voucher discount field contra-acts against FeeCharge.amount
// Contra-Concession: StudentConcession contra-acts against FeeCharge.amount
// Contra-Advance: StudentLedger.advance contra-acts against FeeCharge.paidAmount

export function computeEffectiveReceivable(
  assigned: number,
  paid: number,
  fine: number,
  discount: number,
  concession: number,
  advance: number,
): number {
  // Gross receivable = what was charged
  const gross = assigned + fine;
  // Contra adjustments (reduce receivable)
  const contras = discount + concession;
  // Payments applied (reduce receivable)
  const payments = paid + advance;
  // Net effective receivable
  return Math.max(0, gross - contras - payments);
}
```

### 8.9 Audit Trail Completeness Checklist

Every financial mutation must record:
- [x] Who performed the action (userId via `SET LOCAL app.user_id`)
- [x] What changed (oldValues / newValues in AuditLog)
- [x] When it happened (createdAt)
- [x] Where it happened (requestId, IP address)
- [x] Why it happened (action enum: INSERT/UPDATE/DELETE/PROMOTE/REVERSE/BOUNCE)
- [ ] **Before/after balance snapshots** (enhancement: capture running balance in FeeCharge updates)
- [ ] **Reconciliation checkpoint hash** (optional: SHA-256 of all rows in period for tamper detection)

---

## 9) Risk Assessment & Contingency

| Risk                                                        | Probability | Impact   | Mitigation                                                   | Contingency                                                  |
| ----------------------------------------------------------- | ----------- | -------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Aggregation performance degrades with 10k+ students         | Medium      | High     | Materialized views + Redis cache + incremental refresh       | Fallback to simple aggregation (no daily granularity)        |
| Concurrent payment races cause balance inconsistency        | Low         | Critical | Serializable isolation for all payment transactions          | Automatic reconciliation job to detect and fix drift         |
| Report generation timeout for large datasets                | Medium      | Medium   | Stream results, paginate, batch exports                      | Use timeout parameter, queue large exports as background job |
| Multi-campus migration data loss                            | Low         | High     | Soft migration (nullable FK), rollback plan, data validation | Restore from backup, re-run migration                        |
| Chart library licensing issues with recharts                | Low         | Low      | recharts is MIT licensed                                     | Fall back to chart.js (also MIT)                             |
| Prisma raw SQL queries incompatible with PostgreSQL version | Low         | Medium   | Write ANSI SQL, test against pg 15                           | Cast types explicitly, use Prisma query builder as fallback  |
| npm package vulnerabilities in new dependencies             | Low         | Medium   | Pin versions, run `npm audit` in CI                          | Swap to equivalent library with better security posture      |

**Contingency Budget:**

- Infrastructure: 15% overhead
- Development effort: 20% buffer (5.6 extra days on 28-day schedule)
- Third-party costs: 10% buffer

---

## 9) Schedule & Milestones

### Master Schedule

```
Week 1: Phase 1 (DB schema) + Phase 2.1 (Aggregation engine)
Week 2: Phase 2.2 (Reports) + Phase 2.3 (Defaulters)
Week 3: Phase 2.4 (Cheque bounce) + Phase 2.5 (Exports) + Phase 3.1 (KPI dashboard)
Week 4: Phase 3.2 (Reports UI) + Phase 3.3 (Enhanced vouchers)
Week 5: Phase 4 (Infrastructure)
Week 6: Phase 5 (Testing) + Bug fixes + Code review
```

### Detailed Milestones

| Milestone               | Start  | End    | Dependencies | Deliverable                                    |
| ----------------------- | ------ | ------ | ------------ | ---------------------------------------------- |
| M0 — Init               | Day 1  | Day 1  | None         | Updated Prisma schema, migration files         |
| M1 — Aggregation Engine | Day 2  | Day 4  | M0           | 4 new backend files, 7 REST endpoints          |
| M2 — Reporting Service  | Day 5  | Day 8  | M0           | 3 new backend files, 10 REST endpoints         |
| M3 — Defaulter Alerts   | Day 9  | Day 10 | M1           | 3 new backend files, 4 REST endpoints          |
| M4 — Cheque Bounce      | Day 11 | Day 11 | M0           | Enhanced `payment.service.ts`, bounce fee rule |
| M5 — Export Engine      | Day 12 | Day 13 | M2           | 3 new backend files, file generation           |
| M6 — KPI Dashboard      | Day 14 | Day 16 | M1           | 5 new components, enhanced dashboard page      |
| M7 — Reports UI         | Day 17 | Day 20 | M2           | 10 new page files, sidebar nav update          |
| M8 — Enhanced Vouchers  | Day 21 | Day 22 | M0           | Bulk operations, reprint tracking              |
| M9 — Infrastructure     | Day 23 | Day 25 | None         | Backup scripts, CI/CD, multi-campus middleware |
| M10 — Testing           | Day 26 | Day 30 | All above    | 60+ tests, reconciliation validation           |
| M11 — Code Review & QA  | Day 31 | Day 32 | M10          | Bug fixes, edge case handling                  |

### Resource Allocation

| Role                      | Days | Focus Areas                                    |
| ------------------------- | ---- | ---------------------------------------------- |
| Senior Backend Developer  | 35   | All API work (Phases 1-2), DB schema, exports  |
| Senior Frontend Developer | 20   | Dashboard, reports UI, enhanced vouchers (Phase 3) |
| DevOps Engineer           | 5    | CI/CD, backup, multi-campus (Phase 4)          |
| QA Engineer               | 10   | Testing, reconciliation, E2E (Phase 5)         |

---

## 10) Appendix — File Manifest

### New Files (54 files, ~3,530 lines)

```
# Phase 1 — Database
apps/api/prisma/migrations/202606NNNNNN_campus_concession/
└── migration.sql                                       (80 lines)

apps/api/prisma/migrations/202606NNNNNN_aggregation_alerts/
└── migration.sql                                       (120 lines)

# Phase 2.1 — Aggregation Engine
apps/api/src/modules/aggregation/
├── aggregation.types.ts                                (60 lines)
├── aggregation.service.ts                              (250 lines)
├── aggregation.controller.ts                           (120 lines)
└── aggregation.router.ts                               (40 lines)

# Phase 2.2 — Accountant-Grade Reporting
apps/api/src/modules/reports/
├── report-v2.service.ts                                (300 lines)
├── report-v2.controller.ts                             (150 lines)
└── report-v2.router.ts                                 (50 lines)

# Phase 2.3 — Defaulter Management
apps/api/src/modules/defaulters/
├── defaulter.service.ts                                (150 lines)
├── defaulter.controller.ts                             (80 lines)
└── defaulter.router.ts                                 (30 lines)

# Phase 2.5 — Export Engine
apps/api/src/modules/exports/
├── export.service.ts                                   (150 lines)
├── export.controller.ts                                (80 lines)
└── export.router.ts                                    (30 lines)

# Phase 3.1 — KPI Dashboard
apps/web/src/components/dashboard/
├── FeeKPICards.tsx                                     (100 lines)
├── CollectionTrendChart.tsx                            (80 lines)
├── HeadWiseBreakdownChart.tsx                          (80 lines)
├── DefaulterAgingChart.tsx                             (70 lines)
└── PaymentMethodChart.tsx                              (60 lines)

apps/web/src/lib/hooks/
└── useAggregation.ts                                   (120 lines)

# Phase 3.2 — Reports UI
apps/web/src/app/dashboard/reports/
├── layout.tsx                                          (20 lines)
├── page.tsx                                            (80 lines)
└── page.tsx                                            (120 lines)  # student-ledger
└── page.tsx                                            (100 lines)  # class-collection
└── page.tsx                                            (100 lines)  # collection-register
└── page.tsx                                            (120 lines)  # defaulters
└── page.tsx                                            (80 lines)   # head-wise
└── page.tsx                                            (80 lines)   # comparative
└── page.tsx                                            (60 lines)   # concessions

apps/web/src/lib/hooks/
└── useReports.ts                                       (100 lines)

# Phase 3.3 — Enhanced Vouchers
apps/web/src/components/vouchers/
└── BulkVoucherActions.tsx                              (60 lines)

# Phase 4 — Infrastructure
scripts/
├── backup-db.sh                                        (30 lines)
└── restore-db.sh                                       (30 lines)

apps/api/src/middleware/
└── campus.middleware.ts                                (50 lines)

.github/workflows/
└── deploy.yml                                          (80 lines)

# Phase 5 — Tests
apps/api/src/modules/aggregation/
└── aggregation.service.test.ts                         (150 lines)

apps/api/src/modules/reports/
└── report-v2.service.test.ts                           (120 lines)

apps/api/src/modules/defaulters/
└── defaulter.service.test.ts                           (100 lines)

apps/web/e2e/
├── dashboard-kpi.spec.ts                               (60 lines)
├── reports.spec.ts                                     (100 lines)
├── defaulters.spec.ts                                  (50 lines)
```

### Modified Files (11 files, ~180 lines changed)

| File                                               | Changes                                          |
| -------------------------------------------------- | ------------------------------------------------ |
| `apps/api/prisma/schema.prisma`                    | Add 8 new models, 5 new enums, composite indexes |
| `apps/api/src/app.ts`                              | Register 4 new routers                           |
| `apps/api/src/modules/payments/payment.service.ts` | Add cheque bounce fee logic                      |
| `apps/web/src/app/dashboard/page.tsx`              | Add KPI cards + charts                           |
| `apps/web/src/components/layout/Sidebar.tsx`       | Add Reports nav item                             |
| `apps/web/src/app/dashboard/vouchers/page.tsx`     | Add batch selection + bulk actions               |
| `apps/dashboard/vouchers/[id]/page.tsx`            | Add reprint tracking button                      |
| `apps/api/package.json`                            | Add exceljs, puppeteer dependencies              |
| `apps/web/package.json`                            | Add recharts dependency                          |
| `docker-compose.yml`                               | Add backup service + Redis                       |
| `.env.example`                                     | Add campus configuration variables               |
