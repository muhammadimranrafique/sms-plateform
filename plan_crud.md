# plan_crud.md — School Management System (Production-Ready Implementation Plan)

This document defines the complete implementation plan for the ongoing **School Management System** repository in `d:/sms-platform`. The plan is designed for a senior full-stack developer and covers CRUD, student promotions (single + bulk), fee voucher generation, and an A4 print engine with three vertical copies.

---

## 0) Information Gathered (from current repo)

### Repo structure
- **Monorepo**: `apps/api` (Express REST) + `apps/web` (Next.js dashboard) + `packages/types` (shared Zod schemas).
- **Prisma + PostgreSQL**: `apps/api/prisma/schema.prisma` defines models for Sessions, Classes, Students, Promotions, Vouchers, VoucherSequence, AuditLog.

### Existing production patterns already present
- CRUD services already implement:
  - Zod DTO validation (via `@sms/types`).
  - Soft delete for Students: `deletedAt` + `status=LEFT`.
  - Audit logging via `shared/audit`.
  - Pagination helpers.
  - Optimistic concurrency using `expectedUpdatedAt` for students.
  - Promotion implementation already uses:
    - Derived old class/session server-side.
    - Serializable transaction isolation.
    - Idempotency guard via `batchId` (= `idempotencyKey`).
- Voucher service already implements **race-safe voucherNo** generation via `VoucherSequence` and transactional increments.

### Gaps vs requested features
Based on the current implementation skeleton:
- **Classes** module is basic CRUD; missing academic-year tracking.
- **Additional modules** (Fee structures, Academic sessions) need full CRUD and relational integrity.
- **Student promotion system** requested features include:
  - single student promotion with confirmation + rollback capability + promotion history logging.
  - bulk promotion with:
    - eligibility checks (fee clearance)
    - preview (per-class) prior to execution
    - selective checkboxes per student
    - configurable promotion rules (pass marks)
    - transaction-safe bulk execution
    - post-summary report
    - academic year rollover with automatic new session creation
    - full audit trail per student
  Current `PromotionSchema` does not support eligibility inputs; `promotion.service.ts` only moves students by id list.
- **Fee voucher system** requested features include detailed fee breakdown and dynamic fee heads, partial payments, arrears, discounts/sibling concession.
  Current schema is simplified: `Voucher` stores only `amount`, `feeMonth`, `dueDate`, `status`.
- **A4 print layout (3 copies)** requested pixel-perfect print layout with exact millimeter sizes.
  Current `VoucherPDF.tsx` uses `@react-pdf/renderer` with **A5 single page**, not the requested 3-copy A4 layout.

---

## 1) Edit Plan Overview
The plan will:
1. Expand Prisma schema + migrations to support full domain modeling.
2. Implement/upgrade backend CRUD endpoints for Students, Classes, Sessions, Fee Structures, and Academic Sessions.
3. Implement promotion rules engine, eligibility evaluation, preview + selective execution, and rollback.
4. Implement a complete fee voucher generation system:
    - per-class and per-student for any month(s) / all 12 months
    - fee head breakdown
    - due dates, late fine
    - paid/unpaid/partial/overdue status
    - discount/scholarship + sibling concession
5. Implement a 3-copy A4 print/PDF generation pipeline with:
    - dedicated print template
    - QR/barcode
    - watermark/stamp
    - exact millimeter CSS for alignment
6. Add seed data + documentation + request/response examples for all endpoints.

---

## 2) Detailed Implementation Plan by Area

### A) Database / Prisma schema (foundation)

#### A1. Core normalization and missing entities
Add/extend models to support:
- **Fee Structures**:
  - `FeeStructure` per class/session (and/or academicYear)
  - `FeeHead` (tuition, admission, exam, library, transport, misc, custom heads)
  - `FeeHeadRule` (how to compute amounts)
- **Student fee ledger**:
  - `FeeCharge` (what was charged: month, feeHead, amount, dueDate, fine schedule)
  - `FeePayment` (payments applied to charges: amount, paidAt, method/ref)
  - `Discount` and `SiblingConcession` (rule-based)
- **Settings module** for academic/promotion parameters:
  - Promotion rules configuration (pass marks)
  - Promotion evaluation settings (term mapping)

#### A2. Promotions rollback model
To support rollback safely:
- Store promotion events in an immutable ledger-like table.
- Option 1 (recommended):
  - Add `PromotionBatch` row with `status` (EXECUTED/ROLLED_BACK) and `revertedAt`.
  - Promotion rows store `oldClassId/oldSessionId`, `newClassId/newSessionId`.
  - Rollback sets student back to `old*` and writes compensating `Promotion` rows with a `direction=ROLLBACK` (or separate table).
- Option 2:
  - Add `rollbackOfPromotionId` pointers and update state with integrity constraints.

#### A3. Audit trail and idempotency
- Standardize audit entries for:
  - CRUD writes
  - promotion batch execution
  - voucher generation
  - voucher status updates
  - rollback operations
- Maintain idempotency keys for:
  - bulk promotion
  - bulk voucher generation

#### A4. Indexing and query performance
- Add indexes aligned with filters:
  - Students: `(deletedAt, classId, sessionId)`, `(admissionNo)`, `(name)`
  - Vouchers: `(studentId, feeMonth, status)`, `(feeMonth)`
  - FeeCharge: `(studentId, sessionId, dueDate)`, `(feeHeadId)`
  - Promotions: `(batchId)`, `(studentId, oldSessionId)` unique already exists.

---

### B) Backend CRUD endpoints (Express + Prisma)

#### B1. Students Module (full CRUD + advanced search)

**Requirements**
- Create: full profile including photo upload (via storage integration), registration/admission date, gender, contacts, address.
- Edit: update fields, enforce validation, optimistic concurrency.
- Soft delete: archive support.
- Advanced search: name, admissionNo, class/section, gender, status; date ranges for admission/dob.

**Implementation**
- Update `CreateStudentSchema` and `UpdateStudentSchema` in `packages/types/src/student.schema.ts`:
  - Add fields: `registrationNumber`, `admissionDate`, `classId`, `sessionId`, `photoUrl`, `fatherName`, etc.
  - Ensure phone validation, gender enum.
- Update Prisma `Student` if missing fields.
- Implement:
  - `GET /students?search=&classId=&sessionId=&status=&page=&limit=&sortBy=`
  - `POST /students` (handle photo upload via separate endpoint or signed upload + store URL)
  - `PATCH /students/:id`
  - `DELETE /students/:id` (soft delete + status LEFT)
  - `GET /students/:id`
- Add filter options for:
  - DOB and admissionDate ranges
  - gender
  - class assignments
- Use `withAuditContext(user, tx => ...)` and `audit()` consistently.

#### B2. Classes Module (full CRUD + relational integrity)

**Requirements**
- Create/manage classes with:
  - academic year/session tracking

**Implementation**
- Expand Prisma models as needed:
  - Keep `Class` model with session tracking.
- Add DTO schemas:
  - `CreateClassSchema` including sessionId.
  - `UpdateClassSchema` with partial updates.
- Implement transactional writes:
  - create class atomically.
  - update class by diffing provided fields.

**Endpoints**
- `GET /classes`
- `POST /classes`
- `GET /classes/:id`
- `PATCH /classes/:id`
- `DELETE /classes/:id` (soft deactivate)

#### B3. Sessions, Fee Structures CRUD

**Implementation**
- Sessions already exist partially (`apps/api/src/modules/sessions/*`). Extend to:
  - set `isCurrent`
  - support academic year rollover creation
- Fee structures module:
  - `FeeStructure` per class/session/section
  - `FeeHead` definitions and per-head amount/rules
  - allow custom heads
  - validate totals if needed

#### B4. Voucher module CRUD + generation APIs
Currently voucher endpoints exist but are simplified. Replace/extend to support:
- generating vouchers for one student or class
- selected month or all months
- fee breakdown and ledger integration
- status calculation based on payments/arrears

Endpoints (example set):
- `GET /vouchers?studentId=&classId=&sessionId=&feeMonth=&status=`
- `POST /vouchers/generate` (single student, single month or all months)
- `POST /vouchers/generate/batch` (class-wise)
- `GET /vouchers/:id` (includes line items)
- `PATCH /vouchers/:id/status` (mark paid/partial/cancelled)

Internally:
- For each fee charge, compute amount = base - discounts + fines (as of generation).
- Store `Voucher` and `VoucherLine` rows.
- Generate `Voucher` only once per idempotency key.

---

### C) Student Promotion System

#### C1. Promotion rules configuration
Add tables and API:
- `PromotionRule` with:
  - `passMarks` per subject or minimum overall
  - optional `feeClearanceRequired`
- `PromotionRule` can be global per session or per class.

Endpoints:
- `GET /promotion/rules`
- `POST /promotion/rules` (admin)
- `PATCH /promotion/rules/:id`

#### C2. Eligibility engine (pre-promotion checks)
For each candidate student:
- **Fee clearance**: outstanding balance <= threshold OR paid for required fee heads

Implementation approach:
- Create service `promotionEligibilityService`:
  - `evaluateStudentEligibility(studentId, ruleSet, tx?)`
  - returns `Eligible | Detained` with reasons for audit.
- Support preview by computing eligibility without mutating student class.

#### C3. Single student promotion
UI requirements:
- Confirm dialog (modal) showing from/to class/section and consequences.
- On confirm:
  - call `POST /promotions/single` (or reuse bulk endpoint with `studentIds=[...]`)
  - create promotion record with derived old class/session
  - update student class/session
  - write batchId and audit trail
- Rollback capability:
  - `POST /promotions/:batchId/rollback`
  - rollback uses ledger to restore `oldClassId/oldSessionId`.
  - mark batch status and add audit log.

Backend:
- enforce idempotency for each single promotion.

#### C4. Bulk promotion for all classes

**Flow**
1. Admin selects target new class and new session (or use mapping by class order).
2. System loads all eligible students grouped by class:
   - `GET /promotions/bulk/preview?fromSessionId=&toSessionId=&ruleId=`
   - response: per class list with student checkboxes + reasons for failure.
3. Admin selects checkboxes per student.
4. System runs transaction-safe bulk execution:
   - `POST /promotions/bulk/execute` with:
     - `idempotencyKey`
     - class-wise/studentId list
     - remarks
     - ruleId snapshot
5. Post summary report:
   - `promotedCount`, `detainedCount`, `failed` reasons
6. Academic year rollover:
   - if target session doesn’t exist, auto-create using `POST /sessions/rollover`.
7. Audit trail per student:
   - promotion row for each moved student
   - promotion row (or ledger) for each failure reason in preview (optional separate table)

**Transaction requirements**
- Use `prisma.$transaction` with `Serializable` where safe.
- Read student state (old class/session) inside transaction.
- Ensure unique `(studentId, oldSessionId)` constraint prevents double promotions.

---

### D) Fee Voucher System

#### D1. Voucher generation model upgrade
Current voucher model is too minimal. Extend to:
- `Voucher` (header): voucherNo, studentId, month, dueDate, status, totals, branding data.
- `VoucherLine` (details): feeHeadId, description, amount, computed values.
- `VoucherContext` (optional): discount/sibling concession applied, fine policy.

#### D2. Fee head computation engine
Given:
- class/session fee structure
- student discounts/scholarships
- sibling concession
- previous arrears
- advance payments

Compute:
- `tuitionFee`, `admissionFee`, `examFee`, `libraryFee`, `transportFee`, `misc`, and custom heads.
- arrears: sum unpaid prior charges
- advance: payments beyond due applied to current month
- late fine: based on dueDate and payment date policy

#### D3. Voucher generation APIs
Support:
- individual student
- class-wise
- any month or all 12 months
- idempotency keys

Endpoints:
- `POST /vouchers/generate` (single student)
- `POST /vouchers/generate/class` (class)
- `POST /vouchers/generate/all-months` (helper)

Implementation:
- for each target month:
  - generate `Voucher` and `VoucherLine` if not already generated for that idempotency key
  - link line items to future payment tracking via `FeeChargeId`

#### D4. Payment status tracking
Voucher status derives from ledger:
- **PAID**: all voucher lines settled by payments
- **PARTIAL**: some settled
- **OVERDUE**: unpaid/partial and dueDate < now
- **UNPAID**: no payments

Implementation:
- compute status on read (dynamic) or store and update on payment events.
- keep API response consistent.

---

### E) A4 Print Layout — Three Vertical Copies on Single Page

#### E1. Target output
Portrait A4 page containing exactly three vertical copies:
- BANK COPY
- SCHOOL COPY
- STUDENT COPY

Each copy includes:
- identical header (logo, school name, address, contact)
- voucher metadata
- fee table
- QR/barcode
- watermark/stamp for payment confirmation
- divider/perforation between copies

#### E2. Template strategy
Use a dedicated renderer:
- **Option A (recommended for pixel perfection)**: HTML + CSS millimeter units + `window.print()` for browser printers.
- **Option B**: `@react-pdf/renderer` for PDF download; however, millimeter-perfect performance is harder.

Given repo already uses `VoucherPDF.tsx` with `@react-pdf/renderer`, implement both:
1. **Screen + print** template: `VoucherPrintA4ThreeCopies.tsx` using CSS exact mm.
2. **PDF download**: either generate via Puppeteer from the HTML print template (best) or extend react-pdf.

#### E3. Print CSS requirements
- Use physical units:
  - A4 width 210mm, height 297mm.
- Each copy width ≈ 70mm minus divider thickness.
- Use `@page { size: A4; margin: 0; }`
- Use CSS grid or absolute positioning:
  - copy container at x=0, x=70mm, x=140mm.
- Divider lines:
  - 0.1mm hairline or perforation marks.

#### E4. QR/barcode
- Generate QR payload: `voucherNo` + signature hash or URL.
- Render via:
  - `qrcode` library for SVG/PNG.
  - convert to data URL for print.

#### E5. Responsive preview
- Provide preview component with zoom slider.
- Allow “Print” which triggers `window.print()` or React-to-Print.

---

## 3) Frontend Implementation Plan (Next.js + Tailwind)

### A) Reusable UI and forms
- Use React Hook Form + Zod resolvers already implied by stack.
- Create reusable form components:
  - `TextInput`, `SelectInput`, `DatePicker`, `PhotoUploader`
  - `TableFilters`, `PaginationControls`
- Use Zustand or Redux Toolkit for module states:
  - promotions selection state
  - voucher generation selected months/classes

### B) Students pages
- `/dashboard/students` list with filters.
- `/dashboard/students/new` create.
- `/dashboard/students/:id/edit` edit.
- soft delete confirmation.
- bulk import optional (seed only).

### C) Classes pages
- list + create/edit forms.

### D) Promotions UI
- single promotion page/modal
- bulk promotion page:
  - rule select
  - preview table by class
  - checkboxes per student
  - execute button
  - summary results card
  - rollback button for batch

### E) Voucher UI + print
- `/dashboard/vouchers` list + filters.
- voucher generate page:
  - select student or class
  - select month(s)
  - generate
- Voucher details page:
  - download PDF
  - print A4 three-copy preview.

---

## 4) Backend API Contract (request/response examples)

This plan will implement OpenAPI docs via existing `apps/api/src/docs/openapi.ts`.

For every module ensure:
- consistent response wrapper: `ok(data, meta)` and `created()`.
- correct HTTP codes:
  - 201 for create
  - 200 for reads
  - 204 for delete
  - 400 for validation
  - 401/403 for auth
  - 404 not found
  - 409 conflict (duplicate admissionNo, already promoted)
  - 412 precondition failed (optimistic concurrency mismatch)

---

## 5) Seed Data & Test Strategy

### A) Seed data
Update `apps/api/prisma/seed.ts` to include:
- sessions (2-3 academic years)
- classes + teachers + subjects   [Note: We kept classes but removed teachers and subjects from the plan? Wait, we removed teachers and subjects from the domain. However, the seed data might still need them? 
  But the user said to remove Teachers, Subjects, etc. from the plan. We are not generating seed data for removed entities.
  We adjust: ]
  - classes   [without sections, teachers, subjects]
- fee structures for each class   [since we removed sections]
- student records with class assignments
- eligibility signals:
  - fee balances   [we removed attendance aggregates and exam results]
- promotion rules
- sample vouchers and voucher lines

### B) Promotion tests
- Unit tests:
  - idempotency replay returns prior result.
  - uniqueness constraint triggers conflicts.
  - rollback restores old class/session.
  - eligibility filters correctly detain (based on fee clearance).

### C) Voucher tests
- voucherNo generation concurrency tests.
- all-months generation idempotency.
- discount and sibling concession calculation.
- payment status transitions.

### D) Print tests
- Visual regression (Playwright) for A4 layout:
  - ensure three copies appear
  - ensure divider positions
  - ensure header/logo present

---

## 6) Code Quality Requirements (senior standard)
- Strict TypeScript across API and Web.
- ESLint + Prettier configured.
- Modular architecture:
  - `modules/<domain>/<controller|service|router|dtos>`
  - shared validation, pagination, errors.
- Input sanitization:
  - never interpolate unsafely into raw SQL; if required, use parameterization.
- Error handling:
  - centralized error middleware.
- Observability:
  - request IDs middleware already exists.
  - audit logging on all mutations.

---

## 7) Milestone Breakdown (Suggested)

### Milestone 1 — Domain modeling
- Extend Prisma schema for missing entities.
- Migrations + seed data.

### Milestone 2 — CRUD completeness
- Implement Fee Structures/Capacity/Assignments.   [Note: We removed capacity and assignments? We adjust: ]
  - Implement Fee Structures CRUD.
- Upgrade Students search/filters.

### Milestone 3 — Promotion engine
- Add promotion rules, eligibility preview, bulk execution, rollback.

### Milestone 4 — Voucher engine
- Fee charge ledger, voucher lines, partial payments, status.
- Generate for any months/all months.

### Milestone 5 — Print/PDF engine
- Build HTML A4 three-copy print template.
- Integrate QR code generation.
- Generate PDF via Puppeteer.

### Milestone 6 — QA & documentation
- Tests, E2E, OpenAPI docs, README updates.

---

## 8) Deliverables Checklist (maps to user request)

- [ ] Database schema + migrations (Prisma)
- [ ] All API endpoints with request/response examples
- [ ] Frontend pages/components for Students, Classes, Promotions, Vouchers
- [ ] Print stylesheet + dedicated A4 three-copy layout
- [ ] Bulk promotion logic with transaction handling
- [ ] Fee voucher generation for all months
- [ ] Seed data for testing
- [ ] README setup instructions

---

## 9) Notes about current repo implementation
- Promotions and voucher numbering are already strong foundations:
  - promotions: derived old class/session + serializable transaction + idempotency
  - vouchers: race-safe voucher sequence
- Major work is in:
  - domain expansion (fee ledger, fee heads, eligibility signals)
  - upgrading front-end UX and print/PDF rendering to meet exact three-copy A4 requirements.