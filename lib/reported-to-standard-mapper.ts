/**
 * SEC Reported Labels → S&P Capital IQ Standardized Codes Mapper
 *
 * Maps every bank's reported_line_items (as-reporteds) to the S&P Capital IQ
 * standard template. Uses pattern matching with confidence scoring.
 *
 * Key design:
 * - Each S&P CIQ code has match patterns (keywords/phrases)
 * - A SEC label is matched against all patterns
 * - The best match (highest confidence) wins
 * - Multiple SEC labels CAN map to the same S&P CIQ code (aggregated)
 * - Calculated/total codes are derived after mapping, not mapped directly
 */

import type { SnPTemplateItem } from "./snp-template"
import { getSnpMappableCodes } from "./snp-template"

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface MappedItem {
  /** S&P Capital IQ standardized code */
  snp_code: string
  /** S&P Capital IQ label */
  snp_label: string
  /** Original SEC label(s) that mapped to this */
  source_labels: string[]
  /** Aggregated value (sum of all matching SEC values, in millions USD) */
  value: number
  /** Fiscal year */
  fiscal_year: number
  /** Period end date */
  period_end: string
  /** Confidence score 0-1 */
  confidence: number
  /** Statement type */
  statement_type: string
}

export interface MatchResult {
  snp_code: string
  snp_label: string
  confidence: number
  matchedPattern: string
}

// ═══════════════════════════════════════════════════════════════════════════
// Match Patterns — each S&P CIQ code gets keyword patterns
// ═══════════════════════════════════════════════════════════════════════════

type PatternMap = Record<string, { patterns: string[]; negativePatterns?: string[] }>

// ── Income Statement Patterns ────────────────────────────────────────────

const IS_PATTERNS: PatternMap = {
  // Interest Income
  "IS_INTEREST_INCOME_LOANS": {
    patterns: [
      "interest and fee income, loans",
      "interest income on loans",
      "interest on loans",
      "interest and fees on loans",
      "loans and leases, interest",
      "interest, loans",
      "interest income, loans and leases",
      "interest and dividend income, loans",
      "revenue from loans",  // IFRS
    ],
  },
  "IS_INTEREST_INCOME_INVESTMENTS": {
    patterns: [
      "interest income on investments",
      "interest on investments",
      "interest and dividend income, investment",
      "interest income, investment securities",
      "interest on investment securities",
      "interest and dividend income, trading",
      "interest income, securities",
      "interest and dividends, securities",
      "interest, securities",
      "interest income, available-for-sale",
      "interest income, held-to-maturity",
      "dividend income",
      "revenue from investments",  // IFRS
    ],
  },

  // Interest Expense
  "IS_INTEREST_EXPENSE_DEPOSITS": {
    patterns: [
      "interest on deposits",
      "interest expense, deposits",
      "interest, deposits",
      "deposit interest expense",
      "interest expense on deposits",
    ],
  },
  "IS_INTEREST_EXPENSE_BORROWINGS": {
    patterns: [
      "interest on borrowings",
      "interest expense, borrowings",
      "interest, borrowings",
      "interest expense, debt",
      "interest on debt",
      "interest, long-term debt",
      "interest, short-term borrowings",
      "interest on federal funds",
      "interest expense, federal funds",
      "interest expense, other borrowed",
      "interest, subordinated",
      "interest expense, subordinated",
      "interest expense, trading liabilities",
      "interest on trading liabilities",
    ],
  },

  // Non-Interest Income
  "IS_SERVICE_CHARGES_DEPOSITS": {
    patterns: [
      "service charges on deposits",
      "deposit service charges",
      "service charges, deposit",
      "deposit account fees",
      "service charges and fees",
      "nonsufficient funds fees",
      "overdraft fees",
      "account service fees",
    ],
  },
  "IS_TRUST_INCOME": {
    patterns: [
      "trust income",
      "trust, investment and agency",
      "trust and investment management",
      "fiduciary income",
      "fiduciary and trust",
      "trust and investment",
      "asset management fees",
      "investment management fees",
      "wealth management fees",
      "trust and fiduciary",
    ],
  },
  "IS_MORTGAGE_BANKING": {
    patterns: [
      "mortgage banking",
      "mortgage origination",
      "mortgage servicing",
      "mortgage related",
      "gain on sale of mortgage",
      "mortgage banking income",
      "net gain on mortgage",
    ],
  },
  "IS_TRADING_INCOME": {
    patterns: [
      "trading income",
      "trading revenue",
      "trading gain",
      "principal transaction",
      "trading account profit",
      "net trading",
      "trading activities",
      "market making",
    ],
  },
  "IS_OTHER_NONINTEREST_INCOME": {
    patterns: [
      "other noninterest income",
      "other non-interest income",
      "other operating income",
      "other income",
      "net gain on sale of",
      "gain on sale of securities",
      "investment banking",
      "advisory fees",
      "brokerage",
      "underwriting",
      "card income",
      "insurance income",
      "venture capital",
      "private equity",
      "merchant banking",
      "securitization income",
      "equity method",
      "net gain on equity",
      "fx income",
      "foreign exchange",
      "loan commitment",
      "letter of credit",
      "other fee income",
      "miscellaneous income",
      "other service charges",
    ],
    negativePatterns: [
      "interest",
      "expense",
      "provision",
      "tax",
      "deposit service",
      "mortgage banking",
      "trading",
      "trust",
    ],
  },

  // Provision
  "IS_PROVISION_LOAN_LOSSES": {
    patterns: [
      "provision for loan loss",
      "provision for credit loss",
      "provision expense",
      "credit loss provision",
      "allowance for credit loss, provision",
      "loan loss provision",
      "provision for loan",  // catch short forms
      "credit loss expense",
      "impairment of loans",  // IFRS
      "expected credit loss",  // IFRS
      "provision for credit",  // catch short forms
    ],
    negativePatterns: [
      "reversal",
      "recovery",
    ],
  },

  // Non-Interest Expense
  "IS_SALARIES_BENEFITS": {
    patterns: [
      "salaries and other empl",
      "compensation expense",
      "compensation and benefits",
      "salary and employee",
      "employee compensation",
      "salaries and benefits",
      "personnel expense",
      "staff expense",
      "wages and salaries",
      "employee benefit",
      "human resources",
    ],
  },
  "IS_OCCUPANCY_EXPENSE": {
    patterns: [
      "occupancy expense",
      "occupancy of premises",
      "occupancy and equipment",
      "net occupancy",
      "premises and equipment",
      "rent expense",
      "building occupancy",
      "lease expense",
    ],
  },
  "IS_SGNA_EXPENSE": {
    patterns: [
      "selling general",
      "general and administrative",
      "sga expense",
      "administrative expense",
      "selling and admin",
      "marketing expense",
      "advertising expense",
    ],
  },
  "IS_OTHER_NONINTEREST_EXPENSE": {
    patterns: [
      "other noninterest expense",
      "other non-interest expense",
      "other operating expense",
      "other expense",
      "professional services",
      "technology expense",
      "data processing",
      "communications expense",
      "fdic assessment",
      "deposit insurance",
      "amortization of intangible",
      "intangible amortization",
      "restructuring expense",
      "litigation expense",
      "legal expense",
      "consulting expense",
      "travel expense",
      "supplies expense",
      "postage expense",
      "office expense",
      "regulatory expense",
      "insurance expense",
      "fraud loss",
      "impairment of goodwill",
      "other miscellaneous expense",
    ],
    negativePatterns: [
      "interest",
      "provision",
      "tax",
      "compensation",
      "occupancy",
    ],
  },

  // Tax items (supplemental)
  "IS_CURRENT_DOMESTIC_TAXES": {
    patterns: [
      "current federal tax",
      "current domestic tax",
      "current state and local tax",
    ],
  },
  "IS_CURRENT_FOREIGN_TAXES": {
    patterns: [
      "current foreign tax",
      "current international tax",
    ],
  },
  "IS_DEFERRED_DOMESTIC_TAXES": {
    patterns: [
      "deferred federal tax",
      "deferred domestic tax",
      "deferred state and local",
    ],
  },
  "IS_DEFERRED_FOREIGN_TAXES": {
    patterns: [
      "deferred foreign tax",
      "deferred international tax",
    ],
  },

  // Earnings
  "IS_NET_INCOME_COMPANY": {
    patterns: [
      "net income to company",
      "net income attributable to parent",
      "net income attributable to",
      "net income (loss)",
      "profit for the year",
      "profit for the period",
      "net income",
      "net earnings",
      "income (loss) from continuing operations, net of tax",
    ],
    negativePatterns: [
      "noncontrolling",
      "minority",
      "comprehensive",
      "available to common",
      "per share",
      "excluding",
    ],
  },
  "IS_MINORITY_INTEREST": {
    patterns: [
      "minority interest in earnings",
      "noncontrolling interest in earnings",
      "net income attributable to noncontrolling",
      "noncontrolling interest, net income",
      "minority interest",
    ],
  },

  // Stock-based compensation (supplemental)
  "IS_STOCK_BASED_COMP_BEFORE_TAX": {
    patterns: [
      "stock based compensation",
      "share based compensation",
      "stock option expense",
      "restricted stock expense",
      "share-based payment",
    ],
    negativePatterns: [
      "tax effect",
      "after tax",
      "net of tax",
    ],
  },

  // Per-share items (these come from SEC facts)
  "IS_BASIC_EPS": {
    patterns: ["basic earnings per share", "basic eps", "earnings per share, basic"],
    negativePatterns: ["diluted", "excluding", "continuing"],
  },
  "IS_DILUTED_EPS_INCL_EXTRA": {
    patterns: ["diluted earnings per share", "diluted eps", "earnings per share, diluted"],
    negativePatterns: ["excluding", "continuing"],
  },
  "IS_DIVIDENDS_PER_SHARE": {
    patterns: ["dividends per share", "dividend per common share", "common stock dividends per share"],
  },
}

// ── Balance Sheet Patterns ───────────────────────────────────────────────

const BS_PATTERNS: PatternMap = {
  // Assets
  "BS_CASH_AND_EQUIVALENTS": {
    patterns: [
      "cash and due from banks",
      "cash and cash equivalents",
      "cash and equivalents",
      "cash and balances with central banks",
      "cash on hand",
      "due from banks",
      "cash items in process",
      "balances with central banks",
    ],
    negativePatterns: [
      "restricted",
      "period increase",
      "average",
    ],
  },
  "BS_INVESTMENT_SECURITIES": {
    patterns: [
      "investment securities",
      "securities available-for-sale",
      "available-for-sale securities",
      "held-to-maturity securities",
      "debt securities, available-for-sale",
      "debt securities, held-to-maturity",
      "equity securities",
      "marketable securities",
    ],
    negativePatterns: [
      "trading",
      "mortgage-backed",
      "gain",
      "loss",
      "unrealized",
      "pledged",
    ],
  },
  "BS_TRADING_ASSET_SECURITIES": {
    patterns: [
      "trading asset securities",
      "trading securities",
      "securities, trading",
      "debt securities, trading",
      "equity securities, trading",
      "trading account assets",
      "trading assets",
    ],
  },
  "BS_MORTGAGE_BACKED_SECURITIES": {
    patterns: [
      "mortgage backed securities",
      "mortgage-backed",
      "mbs",
      "cmbs",
      "asset backed securities",
      "collateralized mortgage",
      "residential mortgage backed",
      "commercial mortgage backed",
    ],
  },
  "BS_GROSS_LOANS": {
    patterns: [
      "gross loans",
      "loans and leases",
      "total loans",
      "loans receivable",
      "loans held for investment",
      "loans, net of unearned",
      "commercial loans",
      "consumer loans",
      "real estate loans",
      "residential mortgage",
      "credit card loans",
      "auto loans",
      "other loans",
    ],
    negativePatterns: [
      "held for sale",
      "allowance",
      "reserve",
      "loss",
      "net",
      "sold",
    ],
  },
  "BS_ALLOWANCE_LOAN_LOSSES": {
    patterns: [
      "allowance for loan loss",
      "allowance for credit loss",
      "loan loss reserve",
      "reserve for credit loss",
      "allowance for loan and lease",
      "loan loss allowance",
      "credit loss allowance",
      "expected credit loss allowance",  // IFRS
    ],
    negativePatterns: [
      "provision",
      "expense",
    ],
  },
  "BS_NET_PPE": {
    patterns: [
      "net property, plant",
      "property and equipment",
      "premises and equipment",
      "fixed assets",
      "property, plant and equipment",
    ],
    negativePatterns: [
      "accumulated depreciation",
    ],
  },
  "BS_GOODWILL": {
    patterns: ["goodwill"],
    negativePatterns: ["impairment", "amortization"],
  },
  "BS_LOANS_HELD_FOR_SALE": {
    patterns: [
      "loans held for sale",
      "loans held-for-sale",
      "mortgage loans held for sale",
    ],
  },
  "BS_ACCRUED_INTEREST_RECEIVABLE": {
    patterns: [
      "accrued interest receivable",
      "interest receivable",
      "accrued interest and dividends",
    ],
  },
  "BS_OTHER_RECEIVABLES": {
    patterns: [
      "other receivables",
      "accounts receivable",
      "customer receivables",
      "brokerage receivables",
      "receivables from brokers",
    ],
    negativePatterns: [
      "interest",
      "loan",
      "mortgage",
    ],
  },
  "BS_RESTRICTED_CASH": {
    patterns: [
      "restricted cash",
      "cash restricted",
      "segregated cash",
    ],
    negativePatterns: [
      "equivalents",
      "period increase",
    ],
  },
  "BS_OTHER_CURRENT_ASSETS": {
    patterns: [
      "other current assets",
      "other assets, current",
      "prepaid expenses",
      "deferred tax assets",
      "current tax assets",
      "income tax receivable",
    ],
  },
  "BS_OREO_FORECLOSED": {
    patterns: [
      "other real estate owned",
      "oreo",
      "foreclosed assets",
      "real estate owned",
    ],
  },
  "BS_OTHER_LONG_TERM_ASSETS": {
    patterns: [
      "other long-term assets",
      "other assets, noncurrent",
      "other assets",
      "other noncurrent assets",
    ],
    negativePatterns: [
      "current",
      "restricted",
      "foreclosed",
      "oreo",
      "goodwill",
      "intangible",
      "deferred tax",
    ],
  },

  // Liabilities
  "BS_ACCRUED_EXPENSES": {
    patterns: [
      "accrued expenses",
      "accrued liabilities",
      "accounts payable",
      "accrued compensation",
      "accrued interest payable",
      "interest payable",
      "taxes payable",
    ],
  },
  "BS_INTEREST_BEARING_DEPOSITS": {
    patterns: [
      "interest bearing deposits",
      "interest-bearing deposits",
      "time deposits",
      "savings deposits",
      "money market deposits",
      "now accounts",
      "certificates of deposit",
      "interest checking",
    ],
    negativePatterns: [
      "noninterest",
      "non-interest",
      "demand",
      "noninterest bearing",
    ],
  },
  "BS_NONINTEREST_BEARING_DEPOSITS": {
    patterns: [
      "noninterest bearing deposits",
      "non-interest bearing deposits",
      "demand deposits",
      "noninterest-bearing",
      "noninterest bearing",
    ],
  },
  "BS_TOTAL_DEPOSITS": {
    patterns: [
      "deposits",
      "total deposits",
      "customer deposits",
    ],
    negativePatterns: [
      "interest bearing",
      "noninterest",
      "non-interest",
      "time deposit",
      "demand deposit",
      "savings",
    ],
  },
  "BS_SHORT_TERM_BORROWINGS": {
    patterns: [
      "short-term borrowings",
      "short term borrowings",
      "short-term debt",
      "federal funds purchased",
      "securities sold under repurchase",
      "repurchase agreements",
      "commercial paper",
      "other borrowed funds",
      "current borrowings",
    ],
    negativePatterns: [
      "long-term",
      "current portion",
      "fhlb",
    ],
  },
  "BS_CURRENT_PORTION_LT_DEBT": {
    patterns: [
      "current portion of long-term debt",
      "current maturities of long-term",
      "long-term debt, current",
      "senior notes, current",
      "subordinated debt, current",
    ],
  },
  "BS_LONG_TERM_DEBT": {
    patterns: [
      "long-term debt",
      "long term debt",
      "senior notes",
      "subordinated debt",
      "junior subordinated",
      "medium-term notes",
      "structured notes",
    ],
    negativePatterns: [
      "current portion",
      "current maturity",
      "fhlb",
      "lease",
    ],
  },
  "BS_FHLB_DEBT_LT": {
    patterns: [
      "federal home loan bank",
      "fhlb advances",
      "fhlb debt",
      "federal home loan",
    ],
    negativePatterns: [
      "stock",
      "investment",
    ],
  },
  "BS_OTHER_CURRENT_LIABILITIES": {
    patterns: [
      "other current liabilities",
      "other liabilities, current",
      "other accrued",
    ],
    negativePatterns: [
      "noncurrent",
      "non-current",
      "long-term",
    ],
  },
  "BS_DEF_TAX_LIABILITY_NONCURR": {
    patterns: [
      "deferred tax liability",
      "deferred income tax liability",
      "deferred tax liabilities, noncurrent",
    ],
    negativePatterns: [
      "asset",
      "current",
    ],
  },
  "BS_OTHER_NONCURRENT_LIABILITIES": {
    patterns: [
      "other non-current liabilities",
      "other long-term liabilities",
      "other liabilities, noncurrent",
      "other noncurrent liabilities",
    ],
    negativePatterns: [
      "current",
      "deferred tax",
    ],
  },

  // Equity
  "BS_PREF_STOCK_REDEEMABLE": {
    patterns: [
      "preferred stock, redeemable",
      "redeemable preferred",
    ],
  },
  "BS_PREF_STOCK_NONREDEEMABLE": {
    patterns: [
      "preferred stock, non-redeemable",
      "non-redeemable preferred",
      "preferred stock",
      "preference shares",
    ],
    negativePatterns: [
      "redeemable",
      "convertible",
    ],
  },
  "BS_COMMON_STOCK": {
    patterns: [
      "common stock",
      "common shares",
      "ordinary shares",
      "common stock, value",
    ],
    negativePatterns: [
      "additional paid",
      "treasury",
      "shares authorized",
      "shares issued",
      "shares outstanding",
      "par value",
      "per share",
    ],
  },
  "BS_ADDITIONAL_PAID_IN_CAPITAL": {
    patterns: [
      "additional paid in capital",
      "additional paid-in capital",
      "apic",
      "share premium",
      "capital surplus",
      "paid in capital",
      "paid-in capital",
    ],
    negativePatterns: [
      "common stock",
    ],
  },
  "BS_RETAINED_EARNINGS": {
    patterns: [
      "retained earnings",
      "retained profits",
      "accumulated earnings",
      "accumulated deficit",
      "retained earnings (accumulated deficit)",
    ],
  },
  "BS_TREASURY_STOCK": {
    patterns: [
      "treasury stock",
      "treasury shares",
      "common stock held in treasury",
      "shares held in treasury",
    ],
  },
  "BS_COMPREHENSIVE_INCOME_OTHER": {
    patterns: [
      "accumulated other comprehensive income",
      "aoci",
      "accumulated other comprehensive",
      "other comprehensive income",
      "comprehensive income",
      "other reserves",  // IFRS
    ],
    negativePatterns: [
      "loss",
      "gain",
      "net of tax",
    ],
  },
  "BS_MINORITY_INTEREST": {
    patterns: [
      "minority interest",
      "noncontrolling interest",
      "non-controlling interest",
      "equity attributable to noncontrolling",
    ],
  },

  // Supplemental
  "BS_MORTGAGE_SERVICING_RIGHTS": {
    patterns: [
      "mortgage servicing rights",
      "mortgage servicing asset",
      "msr",
      "servicing rights",
    ],
  },
  "BS_RISK_WEIGHTED_ASSETS": {
    patterns: [
      "risk weighted asset",
      "risk-weighted asset",
      "risk adjusted asset",
      "rwa",
    ],
  },

  // Fair Value
  "BS_FV_LEVEL1_ASSETS": {
    patterns: [
      "level 1 asset",
      "fair value, level 1",
      "quoted prices in active",
    ],
  },
  "BS_FV_LEVEL2_ASSETS": {
    patterns: [
      "level 2 asset",
      "fair value, level 2",
      "observable inputs",
    ],
  },
  "BS_FV_LEVEL3_ASSETS": {
    patterns: [
      "level 3 asset",
      "fair value, level 3",
      "unobservable inputs",
    ],
  },
  "BS_FV_LEVEL1_LIABILITIES": {
    patterns: [
      "level 1 liabilities",
      "level 1 liability",
    ],
  },
  "BS_FV_LEVEL2_LIABILITIES": {
    patterns: [
      "level 2 liabilities",
      "level 2 liability",
    ],
  },
  "BS_FV_LEVEL3_LIABILITIES": {
    patterns: [
      "level 3 liabilities",
      "level 3 liability",
    ],
  },
}

// ═══════════════════════════════════════════════════════════════════════════
// Matching Engine
// ═══════════════════════════════════════════════════════════════════════════

const ALL_PATTERNS: Record<string, PatternMap> = {
  income_statement: IS_PATTERNS,
  balance_sheet: BS_PATTERNS,
}

/**
 * Match a single SEC label to the best S&P CIQ code.
 * Returns the match result with confidence score.
 */
function matchLabel(label: string, statementType: string): MatchResult | null {
  const lower = label.toLowerCase().trim()
  const patterns = ALL_PATTERNS[statementType] || {}

  let bestMatch: MatchResult | null = null
  let bestScore = 0

  for (const [snpCode, config] of Object.entries(patterns)) {
    for (const pattern of config.patterns) {
      const patternLower = pattern.toLowerCase()

      // Check for exact match (highest confidence)
      if (lower === patternLower) {
        return { snp_code: snpCode, snp_label: "", confidence: 1.0, matchedPattern: pattern }
      }

      // Check for substring match
      const idx = lower.indexOf(patternLower)
      if (idx >= 0) {
        // Score: longer pattern = better match, earlier position = better
        const lengthScore = patternLower.length / lower.length
        const positionScore = 1 - (idx / Math.max(lower.length, 1))
        let score = (lengthScore * 0.6 + positionScore * 0.4)

        // Check negative patterns
        if (config.negativePatterns) {
          for (const neg of config.negativePatterns) {
            if (lower.includes(neg.toLowerCase())) {
              score *= 0.3  // Penalize negative matches
            }
          }
        }

        if (score > bestScore) {
          bestScore = score
          bestMatch = { snp_code: snpCode, snp_label: "", confidence: score, matchedPattern: pattern }
        }
      }
    }
  }

  // Lower threshold for a valid match
  if (bestScore < 0.25) return null

  return bestMatch
}

/**
 * Map a set of reported line items (SEC labels) to S&P CIQ standardized codes.
 * Items are aggregated by snp_code (multiple SEC labels → same S&P code = summed).
 */
export function mapReportedToStandard(
  reportedItems: Array<{
    line_item: string
    value: number
    fiscal_year: number
    period_end: string
    statement_type: string
  }>,
  statementType: string
): MappedItem[] {
  // Step 1: Match each SEC label to an S&P CIQ code
  const matchedItems: Array<{
    snp_code: string
    label: string
    value: number
    fiscal_year: number
    period_end: string
    confidence: number
    source_label: string
  }> = []

  for (const item of reportedItems) {
    // Skip items with near-zero values (noise)
    if (Math.abs(item.value) < 0.001) continue

    const match = matchLabel(item.line_item, statementType)
    if (match) {
      matchedItems.push({
        snp_code: match.snp_code,
        label: match.snp_label,
        value: item.value,
        fiscal_year: item.fiscal_year,
        period_end: item.period_end,
        confidence: match.confidence,
        source_label: item.line_item,
      })
    }
  }

  // Step 2: Aggregate by snp_code + fiscal_year
  const aggMap = new Map<string, {
    labels: string[]
    value: number
    maxConfidence: number
  }>()

  for (const item of matchedItems) {
    const key = `${item.snp_code}|${item.fiscal_year}`
    const existing = aggMap.get(key)
    if (existing) {
      existing.value += item.value
      existing.labels.push(item.source_label)
      existing.maxConfidence = Math.max(existing.maxConfidence, item.confidence)
    } else {
      aggMap.set(key, {
        labels: [item.source_label],
        value: item.value,
        maxConfidence: item.confidence,
      })
    }
  }

  // Step 3: Get S&P CIQ labels from template
  const mappableCodes = getSnpMappableCodes(statementType)
  const codeLabelMap = new Map(mappableCodes.map(c => [c.code, c.label]))

  // Step 4: Build final mapped items
  const results: MappedItem[] = []
  const firstItem = reportedItems[0]

  for (const [key, agg] of aggMap) {
    const [snpCode, fyStr] = key.split("|")
    const fy = parseInt(fyStr)
    const snpLabel = codeLabelMap.get(snpCode) || snpCode

    results.push({
      snp_code: snpCode,
      snp_label: snpLabel,
      source_labels: agg.labels,
      value: agg.value,
      fiscal_year: fy,
      period_end: firstItem?.period_end || "",
      confidence: agg.maxConfidence,
      statement_type: statementType,
    })
  }

  return results
}

/**
 * Compute calculated/total items from mapped data.
 * E.g., if we have IS_INTEREST_INCOME_LOANS and IS_INTEREST_INCOME_INVESTMENTS,
 * compute IS_TOTAL_INTEREST_INCOME = sum of both.
 */
export function computeCalculatedItems(
  mappedItems: MappedItem[],
  templates: SnPTemplateItem[]
): MappedItem[] {
  const results: MappedItem[] = [...mappedItems]

  // Group mapped items by fiscal_year for easy lookup
  const byYear = new Map<number, Map<string, number>>()
  for (const item of mappedItems) {
    if (!byYear.has(item.fiscal_year)) byYear.set(item.fiscal_year, new Map())
    byYear.get(item.fiscal_year)!.set(item.snp_code, item.value)
  }

  // Get all calculated items from template
  const calculatedItems = templates.filter(t => t.is_calculated && t.components && t.components.length > 0)

  for (const template of calculatedItems) {
    for (const [fy, codeValues] of byYear) {
      let calcValue = 0
      let hasAllComponents = true

      for (const comp of template.components!) {
        const compVal = codeValues.get(comp)
        if (compVal === undefined) {
          hasAllComponents = false
          break
        }
        if (template.formula === "subtract") {
          calcValue = calcValue === 0 ? compVal : calcValue - compVal
        } else {
          calcValue += compVal
        }
      }

      if (hasAllComponents && calcValue !== 0) {
        results.push({
          snp_code: template.code,
          snp_label: template.label,
          source_labels: [],
          value: calcValue,
          fiscal_year: fy,
          period_end: mappedItems[0]?.period_end || "",
          confidence: 0.95,
          statement_type: template.statement_type,
        })
      }
    }
  }

  return results
}
