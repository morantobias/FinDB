/**
 * FinDB Type Definitions — Financial Statements & Ratios
 */

// ── Reported Financial Statement Line Item ───────────────────────────
export interface ReportedLineItem {
  id: string
  filing_id: string
  statement_type: "balance_sheet" | "income_statement" | "cash_flow"
  line_item: string // As reported by the bank
  value: number
  unit: "millions" | "billions" | "thousands" | "actual"
  currency: string
  period_end: string
  fiscal_year: number
  category?: string // e.g. "Assets", "Liabilities", "Revenue"
  subcategory?: string
  line_order: number // Preserve original ordering
}

// ── Standardized Financial Statement Line Item ───────────────────────
export interface StandardizedLineItem {
  id: string
  bank_id: string
  filing_id: string
  standardized_code: string // e.g. "BS_TOTAL_ASSETS", "IS_NET_INCOME"
  standardized_label: string // e.g. "Total Assets"
  value: number
  unit: "millions"
  currency: string // Always normalized to reporting currency
  period_end: string
  fiscal_year: number
  source_line_item_id?: string // FK to reported_line_items
  confidence: number // 0-1 AI extraction confidence
}

// ── Key Ratio ─────────────────────────────────────────────────────────
export interface KeyRatio {
  id: string
  bank_id: string
  filing_id?: string
  ratio_code: string
  ratio_name: string
  value: number
  unit?: string // "%", "x", "bps", etc.
  category: "earnings" | "asset_quality" | "capital" | "liquidity" | "funding" | "efficiency"
  period_end: string
  fiscal_year: number
  peer_group_median?: number
  peer_group_percentile?: number
}

// ── Standardized Financial Codes ──────────────────────────────────────
export const STANDARDIZED_CODES = {
  // Balance Sheet — Assets
  BS_TOTAL_ASSETS: "Total Assets",
  BS_CASH_AND_EQUIVALENTS: "Cash & Equivalents",
  BS_INVESTMENT_SECURITIES: "Investment Securities",
  BS_NET_LOANS: "Net Loans & Leases",
  BS_LOAN_LOSS_RESERVE: "Loan Loss Reserve",
  BS_GROSS_LOANS: "Gross Loans",
  BS_TRADING_ASSETS: "Trading Assets",
  BS_GOODWILL: "Goodwill & Intangibles",
  BS_OTHER_ASSETS: "Other Assets",

  // Balance Sheet — Liabilities
  BS_TOTAL_DEPOSITS: "Total Deposits",
  BS_DEMAND_DEPOSITS: "Demand Deposits",
  BS_TIME_DEPOSITS: "Time Deposits",
  BS_TOTAL_BORROWINGS: "Total Borrowings",
  BS_SHORT_TERM_BORROWINGS: "Short-Term Borrowings",
  BS_LONG_TERM_DEBT: "Long-Term Debt",
  BS_TRADING_LIABILITIES: "Trading Liabilities",
  BS_OTHER_LIABILITIES: "Other Liabilities",
  BS_TOTAL_LIABILITIES: "Total Liabilities",

  // Balance Sheet — Equity
  BS_TOTAL_EQUITY: "Total Shareholders' Equity",
  BS_COMMON_EQUITY: "Common Equity",
  BS_RETAINED_EARNINGS: "Retained Earnings",
  BS_AOCI: "Accumulated Other Comprehensive Income",
  BS_TANGIBLE_COMMON_EQUITY: "Tangible Common Equity (TCE)",
  BS_TIER_1_CAPITAL: "Tier 1 Capital",
  BS_CET1_CAPITAL: "Common Equity Tier 1 (CET1)",
  BS_TOTAL_CAPITAL: "Total Regulatory Capital",
  BS_RWA: "Risk-Weighted Assets (RWA)",

  // Income Statement
  IS_NET_INTEREST_INCOME: "Net Interest Income",
  IS_INTEREST_INCOME: "Interest Income",
  IS_INTEREST_EXPENSE: "Interest Expense",
  IS_NONINTEREST_INCOME: "Non-Interest Income",
  IS_TOTAL_REVENUE: "Total Revenue (Net Interest + Non-Interest)",
  IS_OPERATING_EXPENSE: "Operating Expenses",
  IS_PRE_PROVISION_PROFIT: "Pre-Provision Net Revenue (PPNR)",
  IS_PROVISION_EXPENSE: "Provision for Credit Losses",
  IS_NET_INCOME: "Net Income",
  IS_EPS: "Earnings Per Share (EPS)",

  // Capital / BASEL
  CAP_CET1_RATIO: "CET1 Ratio (%)",
  CAP_TIER1_RATIO: "Tier 1 Capital Ratio (%)",
  CAP_TOTAL_CAPITAL_RATIO: "Total Capital Ratio (%)",
  CAP_LEVERAGE_RATIO: "Leverage Ratio (%)",
  CAP_RWA_TOTAL: "Risk-Weighted Assets (Total)",
  CAP_LCR: "Liquidity Coverage Ratio (%)",
  CAP_NSFR: "Net Stable Funding Ratio (%)",
} as const

export type StandardizedCode = keyof typeof STANDARDIZED_CODES

// ── Chart Data Types ──────────────────────────────────────────────────
export interface TimeSeriesPoint {
  period: string
  fiscal_year: number
  value: number
}

export interface BankComparisonPoint {
  bank_id: string
  bank_name: string
  region: string
  value: number
}

// ── Research Query Types ──────────────────────────────────────────────
export interface ResearchQuery {
  id: string
  question: string
  created_at: string
  status: "pending" | "analyzing" | "complete" | "error"
  result?: ResearchResult
}

export interface ResearchResult {
  summary: string
  findings: ResearchFinding[]
  chart_data?: ChartData
  banks_referenced: string[]
  filings_referenced: string[]
  generated_report_url?: string
}

export interface ResearchFinding {
  headline: string
  detail: string
  banks: string[]
  metrics: { label: string; value: string }[]
  citations: { bank_name: string; filing_type: string; period: string; page?: number }[]
}

export interface ChartData {
  type: "bar" | "line" | "scatter" | "table"
  title: string
  x_label?: string
  y_label?: string
  series: {
    name: string
    data: { x: string; y: number }[]
  }[]
}
