# FinDB — Production Data Pipeline Plan

## 1. Data Sources & Acquisition Strategy

### US Banks (SEC EDGAR API) — 22 of 50 banks
**Source:** SEC EDGAR XBRL API (free, no key required)
- **Endpoint:** `https://data.sec.gov/api/xbrl/companyfacts/CIK{ticker}.json`
- **Coverage:** All US-listed banks (JPM, BAC, C, WFC, GS, MS + Canadian cross-listed)
- **Data format:** XBRL-tagged financial facts (US GAAP taxonomy)
- **Frequency:** Live — filings appear within hours of SEC acceptance
- **Granularity:** Individual line items with period (annual/quarterly), value, unit

**Key US GAAP XBRL Tags for Banks:**
| Concept | Tag |
|---------|-----|
| Total Assets | `us-gaap:Assets` |
| Cash & Equivalents | `us-gaap:CashAndCashEquivalentsAtCarryingValue` |
| Investment Securities | `us-gaap:AvailableForSaleSecuritiesDebtSecurities` |
| Net Loans | `us-gaap:LoansAndLeasesReceivableNetReportedAmount` |
| Loan Loss Reserve | `us-gaap:AllowanceForLoanAndLeaseLosses` |
| Total Deposits | `us-gaap:Deposits` |
| Total Liabilities | `us-gaap:Liabilities` |
| Total Equity | `us-gaap:StockholdersEquity` |
| Net Interest Income | `us-gaap:InterestIncomeExpenseNet` |
| Non-Interest Income | `us-gaap:NoninterestIncome` |
| Provision for Credit Losses | `us-gaap:ProvisionForLoanLeaseAndOtherLosses` |
| Net Income | `us-gaap:NetIncomeLoss` |
| EPS | `us-gaap:EarningsPerShareBasic` |
| CET1 Ratio | `us-gaap:CommonEquityTierOneCapitalRatio` |
| Tier 1 Ratio | `us-gaap:TierOneRiskBasedCapitalRatio` |
| Total Capital Ratio | `us-gaap:CapitalToRiskWeightedAssets` |
| RWA | `us-gaap:RiskWeightedAssets` |

**SEC API Rate Limits:** 10 requests/second, no API key needed
**CIK Lookup:** `https://data.sec.gov/submissions/CIK{cik}.json`

### Canadian Banks (SEDAR+) — 4 of 50 banks
**Source:** SEDAR+ API (Canadian securities filings)
- **Website:** `https://www.sedarplus.ca/`
- **Format:** XBRL under IFRS taxonomy (different from US GAAP)
- **Tags:** IFRS equivalents — need mapping layer

### European Banks (ESEF / National Registers) — 10 of 50 banks
**Source:** European Single Electronic Format (ESEF) — mandatory XBRL since 2021
- **UK:** Companies House / FCA National Storage Mechanism
- **EU:** Each country's OAM (Officially Appointed Mechanism)
- **ECB:** Statistical Data Warehouse API for aggregate data (not bank-level)
- **Alternative:** Bank-specific investor relations pages (PDF scraping)
- **Key challenge:** No single unified API for European bank filings

### Asian Banks — 10 of 50 banks
- **Japan:** EDINET (Japanese FSA) — XBRL since 2008
- **China:** SSE/SZSE disclosure platforms (Chinese language, PDF-based)
- **India:** BSE/NSE corporate filings + RBI supervisory data
- **Hong Kong:** HKEX披露易 platform — XBRL since 2011

### South American Banks — 10 of 50 banks
- **Brazil:** CVM (Brazilian SEC equivalent) — XBRL since 2022
- **Chile:** CMF — XBRL available
- **Colombia:** Superfinanciera
- **Argentina:** BCRA / CNV — limited structured data

### APAC/Australian Banks — 10 of 50 banks
- **Australia:** ASX company announcements + APRA quarterly statistics
- **Singapore:** SGX announcements + MAS regulatory returns
- **South Korea:** DART (FSS) — XBRL since 2023

---

## 2. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   WEEKLY CRON JOB                        │
│              (Vercel Cron / GitHub Actions)              │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ SEC EDGAR│   │ Intl APIs│   │ PDF/Web  │
    │  (XBRL)  │   │ (Various)│   │ Scraping │
    └──────────┘   └──────────┘   └──────────┘
          │               │               │
          └───────────────┼───────────────┘
                          ▼
              ┌─────────────────────┐
              │  INGESTION SERVICE  │
              │  normalize → dedup  │
              │  → store raw JSONB  │
              └─────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │ STANDARDIZATION     │
              │ ENGINE              │
              │ tag → standard code │
              │ unit → millions USD │
              └─────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │  PostgreSQL (Neon)  │
              │  reported_line_items│
              │  standardized_items │
              │  key_ratios         │
              └─────────────────────┘
```

---

## 3. Database Schema Extension

### New Tables Required

**`filing_sources`** — Track data provenance
```sql
CREATE TABLE filing_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id TEXT REFERENCES banks(id),
  source_type TEXT NOT NULL, -- 'sec_edgar', 'sedar', 'esef', 'pdf_scrape', 'manual'
  source_url TEXT,
  source_identifier TEXT, -- CIK, ISIN, SEDOL
  last_checked_at TIMESTAMP,
  last_filing_date TEXT,
  refresh_frequency TEXT DEFAULT 'weekly',
  status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}'
);
```

**`standardized_templates`** — S&P Capital IQ-style template definitions
```sql
CREATE TABLE standardized_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_code TEXT NOT NULL UNIQUE, -- 'BS_BANK', 'IS_BANK', 'CF_BANK'
  template_name TEXT NOT NULL, -- 'Balance Sheet — Bank Template'
  display_order INTEGER DEFAULT 0,
  parent_category TEXT, -- 'Assets', 'Liabilities', 'Equity', 'Revenue', etc.
  is_subtotal BOOLEAN DEFAULT false,
  calculation_formula TEXT, -- '{BS_CASH} + {BS_SECURITIES} + {BS_NET_LOANS}'
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`template_line_items`** — Individual lines in each template
```sql
CREATE TABLE template_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES standardized_templates(id),
  standardized_code TEXT NOT NULL UNIQUE,
  line_label TEXT NOT NULL, -- 'Cash & Equivalents'
  line_order INTEGER NOT NULL,
  indent_level INTEGER DEFAULT 0,
  is_bold BOOLEAN DEFAULT false,
  is_total BOOLEAN DEFAULT false,
  is_subtotal BOOLEAN DEFAULT false,
  xbrl_tags TEXT[], -- ['us-gaap:CashAndCashEquivalents', 'ifrs:Cash']
  category TEXT, -- 'assets', 'liabilities', 'equity', 'revenue', 'expenses'
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 4. Standardized Financial Templates (S&P Capital IQ Style)

### Template: Balance Sheet — Bank
Based on S&P Capital IQ template structure, organized hierarchically:

```
ASSETS
  Cash & Due from Banks
  Interest-Bearing Deposits with Banks
  Trading Assets
  Investment Securities
    Available-for-Sale (AFS)
    Held-to-Maturity (HTM)
  Net Loans & Leases
    Commercial & Industrial
    Commercial Real Estate (CRE)
    Residential Mortgage
    Consumer / Credit Card
    Other Loans
    Less: Allowance for Credit Losses (ALLL)
  Premises & Equipment
  Goodwill
  Other Intangible Assets
  Other Assets
TOTAL ASSETS

LIABILITIES
  Deposits
    Non-Interest-Bearing Demand Deposits
    Interest-Bearing Deposits
    Time Deposits
  Short-Term Borrowings
  Long-Term Debt
    Senior Debt
    Subordinated Debt
  Trading Liabilities
  Other Liabilities
TOTAL LIABILITIES

EQUITY
  Common Stock
  Additional Paid-In Capital
  Retained Earnings
  Accumulated Other Comprehensive Income (AOCI)
  Treasury Stock
TOTAL SHAREHOLDERS' EQUITY
  Tangible Common Equity (TCE) = Total Equity - Goodwill - Intangibles
TOTAL LIABILITIES & EQUITY

REGULATORY CAPITAL
  Common Equity Tier 1 (CET1)
  Additional Tier 1 (AT1)
  Tier 1 Capital
  Tier 2 Capital
  Total Regulatory Capital
  Risk-Weighted Assets (RWA)
  CET1 Ratio
  Tier 1 Ratio
  Total Capital Ratio
  Leverage Ratio
```

### Template: Income Statement — Bank
```
INTEREST INCOME
  Interest on Loans
  Interest on Securities
  Other Interest Income
TOTAL INTEREST INCOME

INTEREST EXPENSE
  Interest on Deposits
  Interest on Borrowings
  Other Interest Expense
TOTAL INTEREST EXPENSE

NET INTEREST INCOME
  (-) Provision for Credit Losses
NET INTEREST INCOME AFTER PROVISION

NON-INTEREST INCOME
  Service Charges & Fees
  Investment Banking / Advisory
  Trading Income
  Asset Management Fees
  Card / Payment Processing Fees
  Other Non-Interest Income
TOTAL NON-INTEREST INCOME

TOTAL REVENUE (Net Interest + Non-Interest)

NON-INTEREST EXPENSE
  Compensation & Benefits
  Occupancy & Equipment
  Technology & Communications
  Professional Services
  Marketing
  Other Operating Expenses
TOTAL NON-INTEREST EXPENSE

PRE-PROVISION NET REVENUE (PPNR)

INCOME BEFORE TAXES
  (-) Income Tax Provision
NET INCOME

  Earnings Per Share (Basic)
  Earnings Per Share (Diluted)
  Dividends Per Share
```

### Template: Key Ratios
```
EARNINGS
  Return on Assets (ROA)
  Return on Equity (ROE)
  Return on Tangible Common Equity (ROTCE)
  Net Interest Margin (NIM)
  Efficiency Ratio (Cost/Income)
  Operating Leverage (Revenue Growth - Expense Growth)

ASSET QUALITY
  Non-Performing Loans / Total Loans
  NPL Coverage Ratio (LLR / NPLs)
  Net Charge-Off Ratio
  Cost of Risk (Provisions / Avg Loans)
  ALLL / Total Loans
  Criticized Loans / Total Loans

CAPITAL
  CET1 Ratio
  Tier 1 Ratio
  Total Capital Ratio
  Leverage Ratio
  TCE / RWA
  Equity / Total Assets

LIQUIDITY & FUNDING
  Loans / Deposits (LDR)
  Liquid Assets / Total Assets
  Liquidity Coverage Ratio (LCR)
  Net Stable Funding Ratio (NSFR)
  Wholesale Funding / Total Funding
  Core Deposits / Total Deposits
```

---

## 5. Data Mapping: XBRL Tag → Standardized Code

### US GAAP (SEC) Mappings
```
us-gaap:Assets → BS_TOTAL_ASSETS
us-gaap:CashAndCashEquivalentsAtCarryingValue → BS_CASH_AND_EQUIVALENTS
us-gaap:AvailableForSaleSecuritiesDebtSecurities → BS_INVESTMENT_SECURITIES_AFS
us-gaap:HeldToMaturitySecurities → BS_INVESTMENT_SECURITIES_HTM
us-gaap:LoansAndLeasesReceivableNetReportedAmount → BS_NET_LOANS
us-gaap:FinancingReceivableAllowanceForCreditLosses → BS_LOAN_LOSS_RESERVE
us-gaap:Deposits → BS_TOTAL_DEPOSITS
us-gaap:DepositsNoninterestBearing → BS_DEMAND_DEPOSITS
us-gaap:InterestBearingDomesticDeposits → BS_INTEREST_BEARING_DEPOSITS
us-gaap:Liabilities → BS_TOTAL_LIABILITIES
us-gaap:StockholdersEquity → BS_TOTAL_EQUITY
us-gaap:Goodwill → BS_GOODWILL
us-gaap:CommonEquityTierOneCapitalRatio → CAP_CET1_RATIO
us-gaap:TierOneRiskBasedCapitalRatio → CAP_TIER1_RATIO
us-gaap:CapitalToRiskWeightedAssets → CAP_TOTAL_CAPITAL_RATIO
us-gaap:RiskWeightedAssets → CAP_RWA_TOTAL
us-gaap:InterestIncomeExpenseNet → IS_NET_INTEREST_INCOME
us-gaap:NoninterestIncome → IS_NONINTEREST_INCOME
us-gaap:ProvisionForLoanLeaseAndOtherLosses → IS_PROVISION_EXPENSE
us-gaap:NetIncomeLoss → IS_NET_INCOME
us-gaap:EarningsPerShareBasic → IS_EPS
us-gaap:LeverageRatio → CAP_LEVERAGE_RATIO
```

### IFRS (European/Canadian) Mappings
IFRS taxonomy differs — need separate mapping:
```
ifrs-full:Assets → BS_TOTAL_ASSETS
ifrs-full:CashAndCashEquivalents → BS_CASH_AND_EQUIVALENTS
ifrs-full:LoansAndAdvancesToCustomers → BS_NET_LOANS
ifrs-full:DepositsFromCustomers → BS_TOTAL_DEPOSITS
ifrs-full:Equity → BS_TOTAL_EQUITY
ifrs-full:ProfitLoss → IS_NET_INCOME
ifrs-full:InterestRevenueCalculated → IS_INTEREST_INCOME
ifrs-full:InterestExpense → IS_INTEREST_EXPENSE
ifrs-full:FeeAndCommissionIncome → IS_NONINTEREST_INCOME
... etc
```

---

## 6. Weekly Refresh Pipeline (Vercel Cron)

```typescript
// vercel.json cron job — runs every Monday at 06:00 UTC
{
  "crons": [
    {
      "path": "/api/cron/refresh-financials",
      "schedule": "0 6 * * 1"
    }
  ]
}
```

**Refresh Logic:**
1. Query all `filing_sources` with status='active'
2. For each source:
   a. Check if last_checked_at < 7 days ago → skip if recent
   b. Fetch latest filing metadata from source API
   c. Compare filing_date with last_filing_date in DB
   d. If new filing: download → parse → standardize → store
3. Update `filing_sources.last_checked_at`
4. Log results and notify on failures

**Rate Limiting & Resilience:**
- SEC: 10 req/sec — process US banks first (fast)
- International: add 1-2s delays between requests
- PDF scraping: queue-based with retries (up to 3)
- Max runtime: 10 minutes (Vercel Pro limit)
- Split across multiple cron invocations if needed

---

## 7. UI Layout for Financial Statements

Based on S&P Capital IQ UI patterns, the bank detail page should offer:

### Navigation Structure
```
Bank Detail Page
├── Overview Tab (current)
├── Financials Tab
│   ├── Statement Selector (dropdown)
│   │   ├── Balance Sheet — Standardized
│   │   ├── Balance Sheet — As Reported
│   │   ├── Income Statement — Standardized
│   │   ├── Income Statement — As Reported
│   │   ├── Cash Flow — Standardized
│   │   └── Cash Flow — As Reported
│   ├── Period Selector
│   │   ├── Annual (FY2024, FY2023, FY2022...)
│   │   └── Quarterly (Q4 2024, Q3 2024...)
│   ├── Display Mode
│   │   ├── Table View (default)
│   │   └── Chart View
│   └── Export
│       ├── Excel (.xlsx)
│       └── PDF
├── Ratios Tab (current)
├── Filings Tab (current)
└── Peers Tab (NEW)
    └── Side-by-side comparison with peer banks
```

### Financial Statement Table Component
```
┌─────────────────────────────────────────────────────┐
│ Balance Sheet — Standardized  [As Reported ▼]      │
│ Period: [FY2024 ▼]  Display: [Table ▼]  [Export ▼] │
├─────────────────────────────────────────────────────┤
│ ASSETS                          FY2024    FY2023    │
│   Cash & Equivalents            $XXX.XB   $XXX.XB   │
│   Investment Securities          $XXX.XB   $XXX.XB   │
│   Net Loans & Leases            $XXX.XB   $XXX.XB   │
│     Commercial & Industrial      $XX.XB    $XX.XB    │
│     CRE                          $XX.XB    $XX.XB    │
│     Consumer                     $XX.XB    $XX.XB    │
│   Goodwill & Intangibles         $XX.XB    $XX.XB    │
│   Other Assets                   $XX.XB    $XX.XB    │
│ ─────────────────────────────────────────────────── │
│ TOTAL ASSETS                   $X,XXX.XB $X,XXX.XB  │
│                                                      │
│ LIABILITIES                     FY2024    FY2023    │
│   Total Deposits                $XXX.XB   $XXX.XB   │
│   Short-Term Borrowings          $XX.XB    $XX.XB    │
│   Long-Term Debt                $XXX.XB   $XXX.XB   │
│   Other Liabilities              $XX.XB    $XX.XB    │
│ ─────────────────────────────────────────────────── │
│ TOTAL LIABILITIES               $XXX.XB   $XXX.XB   │
│                                                      │
│ EQUITY                          FY2024    FY2023    │
│   Common Stock                   $XX.XB    $XX.XB    │
│   Retained Earnings             $XXX.XB   $XXX.XB   │
│   AOCI                          -$XX.XB   -$XX.XB   │
│ ─────────────────────────────────────────────────── │
│ TOTAL EQUITY                    $XXX.XB   $XXX.XB   │
│ TCE                             $XXX.XB   $XXX.XB   │
└─────────────────────────────────────────────────────┘
```

---

## 8. Implementation Phases

### Phase 1: SEC EDGAR Pipeline (Week 1)
- [ ] Create SEC EDGAR API client (`lib/sec-edgar-client.ts`)
- [ ] US GAAP XBRL → standardized code mapping (100+ tags)
- [ ] CIK lookup + ticker resolution
- [ ] `/api/cron/refresh-financials` endpoint
- [ ] `filing_sources` table + registration for 22 US banks
- [ ] Initial historical data pull (last 5 years)
- [ ] `template_line_items` seed — full S&P-style template

### Phase 2: International Sources (Week 2)
- [ ] SEDAR+ integration for Canadian banks
- [ ] ESEF/IFRS mapping layer
- [ ] PDF scraping fallback for European banks
- [ ] Asian bank sources (EDINET, HKEX)
- [ ] Register all 50 banks in `filing_sources`

### Phase 3: UI & Standardization (Week 2-3)
- [ ] `components/financial-statement-table.tsx` — hierarchical table
- [ ] Period selector, statement type selector
- [ ] As Reported vs Standardized toggle
- [ ] Excel/PDF export
- [ ] Peer comparison tab

### Phase 4: Automation & QA (Week 3)
- [ ] Vercel Cron job configuration
- [ ] Data validation rules (sanity checks)
- [ ] Error handling & retry logic
- [ ] Audit logging
- [ ] Notification on data gaps

---

## 9. Key Design Decisions

1. **XBRL-first, PDF-fallback:** Use structured XBRL where available (US, Canada, EU, Japan, Australia). Fall back to AI PDF extraction only where XBRL isn't available.

2. **Two sets of financials always stored:**
   - `reported_line_items` — exactly as the bank reported (preserves original taxonomy)
   - `standardized_line_items` — mapped to FinDB codes for cross-bank comparison

3. **Currency normalization:** All values stored in reporting currency + USD equivalent (using period-end FX rate from ECB API).

4. **Incremental updates, not full refresh:** Only fetch new filings since last check. Don't re-download historical data.

5. **Rate limits respected:** SEC API 10/sec, others vary. Queue-based with delays.

6. **Idempotent:** Re-running the pipeline won't duplicate data (ON CONFLICT upserts).
