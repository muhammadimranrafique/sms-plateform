# Implementation Plan — Financial Fee Aggregation Analysis (SMS Platform)

> **Version:** 1.0 (Accounting + Engineering implementation-ready)

## 0) Purpose & Scope

Create an end-to-end implementation plan that produces a **comprehensive financial fee aggregation analysis** for the SMS platform project. The plan must:

1. **Accounting rigor**: perform exhaustive, line-item cost aggregation and financial modeling using professional standards (double-entry verification concepts, TCO, variance analysis, ROI, risk-adjusted forecasts, contingency allocations, tax and currency considerations).
2. **Developer accuracy**: map every technical component currently implemented (modules, services, DB tables/views, integrations) to **cost centers** with **explicit pricing/tier assumptions** and measured/estimated resource consumption.
3. **Output format**: monthly, quarterly, and annual summaries; subtotals and grand totals; projections and forecasts; risk-adjusted scenarios; recommendations for optimization.

This document is written as the master plan to be executed by the engineering team, with accounting checks integrated into milestones.

---

## 1) Current-Reality Snapshot (What the plan must reflect from the repo)

### 1.1 Repository architecture that affects cost modeling

- **Monorepo structure**
  - `apps/api`: Node/TypeScript backend (Express REST).
  - `apps/web`: Next.js dashboard.
  - `packages/types`: shared Zod schemas.
- **Database**: PostgreSQL via Prisma (and migrations under `apps/api/prisma/migrations`).
- **Financial/fee domain already exists** (based on the current repo notes captured in existing planning docs):
  - fee/voucher systems and promotions are partially implemented.
  - an “aggregation layer” concept exists via SQL views and Drizzle `pgView` integration.

### 1.2 Financial aggregation layer concept (existing implementation direction)

The repo already contains an implementation direction for a finance aggregation layer using SQL views and a `custom_funds` support table (referenced in the current `implement_plan_aggregation.md` content). The final accounting implementation plan must:

- Treat those views/tables as the authoritative **data sources** for financial reporting dashboards.
- Extend/verify them so they can support:
  - fee generation totals
  - fee collections (daily/monthly)
  - overhead and operational cost attribution (where available)
  - integration/transaction fee attribution
  - tax and currency normalization

---

## 2) Definitions (Accounting terms used consistently)

### 2.1 Revenue vs Cost vs Expense

- **Revenue (Income)**
  - Fee collections from students (net of refunds/chargebacks where applicable).
  - Any platform fees charged to third parties (if applicable).
- **Costs**
  - Development costs (labor)
  - Infrastructure costs (hosting/compute/storage)
  - Licensing costs (software subscriptions, monitoring)
  - API integration costs (e.g., SMS gateway per message)
- **Operating Expenses (OPEX)**
  - Maintenance, support, monitoring, incident response
  - scaling and overage fees
  - customer support operations

### 2.2 Total Cost of Ownership (TCO)

TCO includes:
- One-time costs (setup, onboarding)
- Recurring costs (hosting, monitoring, licenses)
- Variable costs (SMS per message, API usage)
- Hidden costs (engineering time, rework, compliance, migration overhead)

### 2.3 Double-entry verification concept (implementation requirement)

While the platform uses relational DB rather than ledger accounting tables, the plan must ensure:

- Every money movement that impacts balances is represented with a **paired effect**:
  - `FeeCharge` increases receivable / liability to collect.
  - `FeePayment` decreases receivable.
  - Discounts/refunds are contra-entries.
- Views must derive balances from paired entries (not from single-source “balance fields”).

---

## 3) Deliverables

The execution must produce these deliverables (software + accounting artifacts):

1. **SQL view + table aggregation layer** (authoritative reporting sources)
   - Extend/validate existing aggregation views and create missing ones.
2. **Data dictionary** mapping each view field to:
   - source table
   - accounting definition
   - cost center / financial statement line
   - currency and tax handling
3. **Cost aggregation dataset**
   - A dataset that merges technical usage metrics with pricing/tier schedules.
4. **Accounting reports**
   - P&L (monthly/quarterly/annual)
   - Cashflow proxy (collections timing)
   - TCO summary
   - ROI and sensitivity analysis
5. **Variance analysis**
   - Actuals vs forecast (monthly)
   - Root-cause breakdown (engineering changes, usage spikes, pricing tier changes)
6. **Risk-adjusted projections**
   - base / best / worst scenarios
   - contingency budget and mitigation steps

---

## 4) Implementation Plan — Combined Accounting + Engineering (Step-by-step)

### Step 1 — Inventory of Cost Centers (Engineering + Accounting)

**Goal:** produce a complete map of system components to cost centers.

#### 4.1 Enumerate technical components
From the repo, identify:
- API compute layer (app instances, serverless vs container)
- Web compute layer
- Database compute layer
- Background jobs (if any)
- Storage (uploads, PDFs)
- Monitoring/logging
- CI/CD pipeline
- Notification workers (SMS sending jobs)

#### 4.2 Map to accounting cost categories
Create a table (in the document as a “Cost Center Matrix”) like:

| Cost Center | Technical Component | Accounting Category | Fixed/Variable | Currency | Notes |
|---|---|---|---|---|---|
| API hosting | apps/api | OPEX—Compute | Fixed+Variable | USD/INR/etc | per instance/CPU |
| DB hosting | PostgreSQL | OPEX—Database | Fixed+Variable | USD/INR/etc | storage+IO |
| SMS gateway | SMS sender module | COGS—SMS variable | Variable | gateway currency | per message/country/carrier |
| Monitoring | observability | OPEX—Support | Fixed | USD | logs retention |
| Licenses | dependencies/tools | OPEX—Licensing | Fixed | USD | renewals |

#### Step-1 Accounting checks
- Ensure each cost center has:
  - a pricing source/tier reference
  - an invoicing cadence assumption
  - tax applicability (VAT/GST) assumptions

---

### Step 2 — Data Model for Financial Aggregation (Engineering)

**Goal:** ensure reporting is based on correct underlying paired financial events.

#### 5.1 Validate existing aggregation views
The plan must verify (and extend if needed) these kinds of views:
- Monthly fee summaries (generated vs collected)
- Daily fee collection/audit report
- Monthly P&L view
- Overdue snapshot
- Monthly custom fund summary

#### 5.2 Enforce accounting definitions
For each report line, define:
- numerator: which columns/events included
- denominator: which population basis used
- status logic: how “Paid/Partial/Overdue” is derived
- currency conversion: what rate/time is used (invoice date vs payment date)
- tax logic: gross vs net

#### 5.3 Build a data dictionary
A required table:

| View | Field | Accounting Definition | Source Tables | Calculation | Currency/Tax |
|---|---|---|---|---|---|

---

### Step 3 — Pricing & Tier Catalog (Accounting)

**Goal:** encode every third-party pricing component with a clear source of truth.

#### 6.1 Inventory integrations and pricing inputs
At minimum, include (if present in current system):
- SMS gateway provider
- Email provider (if used)
- SMS/WhatsApp/voice gateways (if any)
- Storage providers
- Monitoring/logging providers

#### 6.2 Create a pricing schedule table

| Provider | Metric | Tier/Rule | Unit Price | Currency | Tax | Effective date |
|---|---|---|---|---|---|---|

#### 6.3 SMS-specific pricing modeling (mandatory)
For SMS gateway charges, define:
- per message cost by country
- per message cost by carrier/route
- per-message overhead fees
- gateway transaction fees
- possible message-type multipliers (MT/MO, promotional/transactional)

Also define:
- how the platform determines country/carrier (if dynamic routing)
- mapping from message logs to gateway pricing

---

### Step 4 — Technical Usage Metrics Capture (Engineering)

**Goal:** obtain actual usage inputs needed for financial cost aggregation.

#### 7.1 Instrumentation requirements
Implement or verify event logging for:
- SMS sends (timestamp, recipient/country, message type, provider route)
- API call usage for third-party services
- storage usage deltas (uploads, PDFs)
- compute instance uptime and autoscaling events
- DB storage growth and query volume (approximate IO)

#### 7.2 Persistence strategy
Decide whether to:
- store raw logs (costly)
- store aggregated daily counters (preferred for TCO)
- store provider invoice exports (best for “actuals”)

#### 7.3 Cost mapping pipeline
Create an internal job (or ETL routine) that:
- aggregates usage counters daily
- applies pricing schedule
- writes normalized “CostLine” rows to a reporting table or view.

---

### Step 5 — Financial Aggregation Engine (Engineering + Accounting)

**Goal:** produce monthly/quarterly/annual totals from CostLine and FeeLedger.

#### 8.1 CostLine schema (recommended)

| id | date | cost_center | provider | metric | quantity | unit_price | subtotal | tax_amount | currency | fx_rate | fx_base_subtotal | fx_base_tax |

#### 8.2 FX (Currency conversion) policy (Accounting)
Define one consistent policy:
- FX rate taken from:
  - invoice date, OR
  - payment date, OR
  - daily average

Also specify:
- base currency for reporting (e.g., INR or USD)

#### 8.3 Tax treatment policy
Define:
- whether amounts are gross or net
- whether tax is recoverable (input tax credit)

The plan must output:
- Gross TCO
- Net TCO (if applicable)

---

### Step 6 — Revenue, ROI, and Cost-Benefit Modeling (Accounting)

**Goal:** compute ROI and break down economic outcomes.

#### 9.1 Revenue definition
- Fee revenue = sums of payments applied to charges
- Discounts reduce fee revenue (contra)

If refunds exist:
- treat refunds as negative revenue

#### 9.2 ROI formula
Provide explicit formulas:
- **Net Profit** = Revenue − Total Cost of Ownership
- **ROI %** = (Net Profit / Total Cost of Ownership) × 100
- **Payback Period** = earliest month where cumulative profit becomes positive

#### 9.3 Variance analysis
For each month:
- Forecast vs Actual for:
  - SMS costs
  - hosting
  - DB
  - support/maintenance
- Root cause classification:
  - usage spike
  - pricing tier change
  - feature regression (more messages due to retries)
  - infrastructure inefficiency

---

### Step 7 — Risk-Adjusted Forecasts & Contingency (Accounting)

**Goal:** provide base/best/worst projections with contingency.

#### 10.1 Risk register (mandatory)
Create a risk list with:
- risk description
- probability
- impact ($)
- mitigation

Example risk categories:
- SMS retry storms
- provider price changes
- scaling costs overrun
- incident downtime causing additional support
- compliance or tax rule changes

#### 10.2 Scenario modeling
Define ranges:
- message volume growth (e.g., +X%)
- provider unit cost changes (e.g., +Y%)
- compute/db costs scaling factors

#### 10.3 Contingency allocation
- Minimum contingency recommended:
  - for infrastructure: 10–20%
  - for integrations: 5–15%
  - for one-time: 15–30%

(Exact values must be parameterized; plan must not hardcode without sources.)

---

### Step 8 — Cost Optimization Recommendations (Developer + Accounting)

**Goal:** identify where engineering changes can reduce cost.

Create an “Optimization Backlog” with:

| Recommendation | Expected Savings | Cost to Implement | Effort | Dependencies |
|---|---:|---:|---|---|

Examples:
- reduce SMS retries; add exponential backoff
- batch notifications
- cache dashboard queries
- reduce log retention
- right-size DB and add indexes to reduce IO
- move heavy PDF generation to queue/async

Each item must include:
- expected effect on cost line(s)
- which metrics will be monitored

---

## 5) Monthly/Quarterly/Annual Reporting Templates (Output requirements)

### 11.1 Monthly P&L template
Include:
- Revenue subtotals
- COGS (SMS/transaction fees)
- OPEX (hosting, monitoring, licensing)
- Net profit

Also include:
- SMS cost split by country/carrier (if data exists)
- transaction fee split

### 11.2 Quarterly and Annual rollups
- Sum monthly values
- show trend metrics:
  - revenue growth rate
  - cost growth rate
  - margin improvement/decline

### 11.3 Forecast appendices
- base scenario vs best/worst
- contingency lines
- payback period table

---

## 6) Implementation Milestones (Engineering execution plan)

### Milestone A — Finance data foundation (DB/reporting)
- [ ] Verify existing finance aggregation views
- [ ] Add missing views/tables required for reporting
- [ ] Create data dictionary doc

### Milestone B — Pricing & cost mapping layer
- [ ] Encode pricing tiers for all providers
- [ ] Implement cost mapping job (usage → cost lines)
- [ ] Add FX + tax normalization utilities

### Milestone C — Actuals capture & variance analysis
- [ ] Implement usage logging/instrumentation
- [ ] Daily aggregation into cost lines
- [ ] Monthly variance dashboard output

### Milestone D — Accounting outputs (ROI/TCO)
- [ ] Generate monthly/quarterly/annual P&L, TCO, ROI
- [ ] Scenario forecasting
- [ ] Risk register + contingency

### Milestone E — Optimization recommendations
- [ ] Produce optimization backlog with savings model
- [ ] Add monitoring guardrails to prevent regressions

---

## 7) Quality, Auditability, and Validation Checklist

### 13.1 Reconciliation rules (mandatory)
- Sum of `FeePayments` mapped to revenue must match:
  - revenue derived from reporting views
- Sum of `FeeCharges` minus payments must match:
  - receivables balances and overdue snapshots

### 13.2 Idempotency for aggregation jobs
- Ensure cost aggregation jobs are idempotent by date partitions

### 13.3 Accounting controls
- Provide a “reconciliation appendix” in the final output:
  - totals by cost center
  - totals by provider
  - totals by month

---

## 8) Assumptions & Parameters (must be explicit)

The plan must define and parameterize:
- SMS volume forecast by month (base)
- SMS country/carrier mix (base)
- unit prices and effective dates
- FX conversion rates source
- tax rate assumptions by geography/provider
- hosting instance sizes and autoscaling assumptions
- monitoring/log retention assumptions

---

## 9) Final Executive Summary (to be generated as output of execution)

This section will summarize:
- current actual financial picture (as-of latest completed month)
- projected TCO for the next 12/24 months
- ROI and payback period
- primary cost drivers (ranked)
- top 3 optimization moves with ROI impact
- key risks and mitigations

---

## Appendix A — Required Tables/Views to Produce (Engineering)

1. `financial_fee_ledger_*` views (charges/payments/discounts)
2. `monthly_fee_summary`-like views
3. `monthly_pnl` view
4. `cost_lines` storage/view
5. `monthly_cost_summary` view
6. `monthly_roi_summary` view

---

## Appendix B — Required Accounting Outputs (Deliverables)

- Monthly:
  - P&L
  - TCO
  - margin and ROI
  - variance analysis
- Quarterly:
  - rollups + scenario preview
- Annual:
  - forecast + payback period

