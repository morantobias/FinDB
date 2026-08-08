/**
 * SEC Reported Labels → S&P Capital IQ Standardized Codes Mapper (v2)
 *
 * Token-based semantic matching for comprehensive coverage.
 */

import { getSnpMappableCodes, type SnPTemplateItem } from "./snp-template"

export interface MappedItem {
  snp_code: string
  snp_label: string
  source_labels: string[]
  value: number
  fiscal_year: number
  period_end: string
  confidence: number
  statement_type: string
}

// ═══════════════════════════════════════════════════════════════════════════
// Stop words
// ═══════════════════════════════════════════════════════════════════════════

const STOP = new Set([
  "the", "of", "and", "or", "in", "on", "to", "for", "with", "from",
  "by", "at", "as", "an", "a", "is", "was", "are", "were", "be",
  "its", "it", "that", "this", "these", "those", "has", "have",
  "during", "including", "within", "without", "after", "before",
  "total", "net", "other", "current", "noncurrent", "amount", "value",
  "year", "ended", "fiscal", "related", "certain", "various", "all",
  "period", "los", "inc", "corp", "bank", "million", "billions",
  "usd", "cad", "actual", "dollars", "thousands",
])

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[,()$%]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(t => t.length > 1 && !STOP.has(t))
}

// ═══════════════════════════════════════════════════════════════════════════
// Token fingerprints per S&P CIQ code
// ═══════════════════════════════════════════════════════════════════════════

interface FP { req: string[]; bonus: string[]; excl: string[] }

const IS_FP = new Map<string, FP>()
const BS_FP = new Map<string, FP>()

function init() {
  // Income Statement fingerprints
  IS_FP.set("IS_INTEREST_INCOME_LOANS", {
    req: ["interest", "loan"],
    bonus: ["lease", "fee", "income"],
    excl: ["investment", "securit", "deposit", "borrowing", "expense"],
  })
  IS_FP.set("IS_INTEREST_INCOME_INVESTMENTS", {
    req: ["interest", "investment"],
    bonus: ["securit", "dividend", "income"],
    excl: ["loan", "expense", "deposit", "borrowing"],
  })
  IS_FP.set("IS_INTEREST_EXPENSE_DEPOSITS", {
    req: ["interest", "deposit"],
    bonus: ["expense", "bearing"],
    excl: ["loan", "investment", "borrowing", "noninterest"],
  })
  IS_FP.set("IS_INTEREST_EXPENSE_BORROWINGS", {
    req: ["interest", "borrowing"],
    bonus: ["debt", "expense", "federal", "subordinated", "note"],
    excl: ["deposit", "loan"],
  })
  IS_FP.set("IS_SERVICE_CHARGES_DEPOSITS", {
    req: ["deposit", "service"],
    bonus: ["charge", "fee", "account", "overdraft"],
    excl: ["interest"],
  })
  IS_FP.set("IS_TRUST_INCOME", {
    req: ["trust", "income"],
    bonus: ["fiduciary", "wealth", "asset management"],
    excl: ["expense"],
  })
  IS_FP.set("IS_MORTGAGE_BANKING", {
    req: ["mortgage", "banking"],
    bonus: ["origination", "servicing", "gain", "sale"],
    excl: ["expense", "interest"],
  })
  IS_FP.set("IS_TRADING_INCOME", {
    req: ["trading", "income"],
    bonus: ["principal", "transaction", "market"],
    excl: ["expense", "securit"],
  })
  IS_FP.set("IS_OTHER_NONINTEREST_INCOME", {
    req: ["income"],
    bonus: ["noninterest", "non-interest", "fee", "commission", "advisory",
      "brokerage", "underwriting", "card", "insurance", "gain", "sale",
      "investment banking", "foreign exchange", "private equity", "venture"],
    excl: ["interest", "expense", "provision", "tax", "loan loss"],
  })
  IS_FP.set("IS_PROVISION_LOAN_LOSSES", {
    req: ["provision", "loan"],
    bonus: ["credit", "loss", "impairment", "expected"],
    excl: ["reversal", "recovery"],
  })
  IS_FP.set("IS_SALARIES_BENEFITS", {
    req: ["compensation"],
    bonus: ["salary", "benefit", "employee", "personnel", "staff", "wage"],
    excl: ["stock", "option", "share"],
  })
  IS_FP.set("IS_OCCUPANCY_EXPENSE", {
    req: ["occupancy"],
    bonus: ["premise", "equipment", "rent", "building"],
    excl: ["compensation"],
  })
  IS_FP.set("IS_SGNA_EXPENSE", {
    req: ["administrative"],
    bonus: ["general", "selling", "marketing", "advertising"],
    excl: ["compensation", "occupancy"],
  })
  IS_FP.set("IS_OTHER_NONINTEREST_EXPENSE", {
    req: ["expense"],
    bonus: ["noninterest", "non-interest", "professional", "technology",
      "data processing", "communication", "fdic", "amortization",
      "restructuring", "litigation", "legal", "consulting", "depreciation"],
    excl: ["interest", "provision", "tax", "compensation", "occupancy"],
  })
  IS_FP.set("IS_CURRENT_DOMESTIC_TAXES", {
    req: ["current", "tax"],
    bonus: ["federal", "domestic", "state", "local"],
    excl: ["deferred", "foreign", "international"],
  })
  IS_FP.set("IS_CURRENT_FOREIGN_TAXES", {
    req: ["current", "tax"],
    bonus: ["foreign", "international"],
    excl: ["deferred", "federal", "domestic", "state"],
  })
  IS_FP.set("IS_DEFERRED_DOMESTIC_TAXES", {
    req: ["deferred", "tax"],
    bonus: ["federal", "domestic", "state", "local"],
    excl: ["current", "foreign", "international"],
  })
  IS_FP.set("IS_DEFERRED_FOREIGN_TAXES", {
    req: ["deferred", "tax"],
    bonus: ["foreign", "international"],
    excl: ["current", "federal", "domestic", "state"],
  })
  IS_FP.set("IS_NET_INCOME_COMPANY", {
    req: ["net", "income"],
    bonus: ["earnings", "profit", "continuing", "parent", "attributable", "consolidated"],
    excl: ["noncontrolling", "minority", "comprehensive", "per share", "diluted", "basic"],
  })
  IS_FP.set("IS_MINORITY_INTEREST", {
    req: ["minority", "interest"],
    bonus: ["noncontrolling", "non-controlling"],
    excl: [],
  })
  IS_FP.set("IS_STOCK_BASED_COMP_BEFORE_TAX", {
    req: ["stock", "compensation"],
    bonus: ["share", "based", "option", "restricted"],
    excl: ["tax", "after"],
  })
  IS_FP.set("IS_BASIC_EPS", {
    req: ["basic", "earnings", "per", "share"],
    bonus: ["eps"],
    excl: ["diluted"],
  })
  IS_FP.set("IS_DILUTED_EPS_INCL_EXTRA", {
    req: ["diluted", "earnings", "per", "share"],
    bonus: ["eps"],
    excl: ["basic"],
  })
  IS_FP.set("IS_DIVIDENDS_PER_SHARE", {
    req: ["dividend", "per", "share"],
    bonus: ["common", "stock"],
    excl: [],
  })

  // Balance Sheet fingerprints
  BS_FP.set("BS_CASH_AND_EQUIVALENTS", {
    req: ["cash"],
    bonus: ["equivalent", "due", "bank", "central", "balances"],
    excl: ["restricted", "increase", "average", "segregated"],
  })
  BS_FP.set("BS_INVESTMENT_SECURITIES", {
    req: ["investment", "securit"],
    bonus: ["available", "held", "maturity"],
    excl: ["trading", "mortgage", "unrealized", "gain", "loss"],
  })
  BS_FP.set("BS_TRADING_ASSET_SECURITIES", {
    req: ["trading", "securit"],
    bonus: ["asset"],
    excl: ["liability", "gain", "loss"],
  })
  BS_FP.set("BS_MORTGAGE_BACKED_SECURITIES", {
    req: ["mortgage", "backed", "securit"],
    bonus: ["mbs", "cmbs", "asset backed"],
    excl: [],
  })
  BS_FP.set("BS_GROSS_LOANS", {
    req: ["loan"],
    bonus: ["gross", "receivable", "held investment", "commercial", "consumer", "real estate", "residential", "credit card", "auto"],
    excl: ["held sale", "allowance", "reserve", "loss", "net", "sold", "servicing"],
  })
  BS_FP.set("BS_ALLOWANCE_LOAN_LOSSES", {
    req: ["allowance", "loan", "loss"],
    bonus: ["credit", "reserve"],
    excl: ["provision", "expense", "charge"],
  })
  BS_FP.set("BS_NET_PPE", {
    req: ["property", "equipment"],
    bonus: ["plant", "premise", "fixed", "asset"],
    excl: ["depreciation"],
  })
  BS_FP.set("BS_GOODWILL", {
    req: ["goodwill"],
    bonus: [],
    excl: ["impairment", "amortization"],
  })
  BS_FP.set("BS_LOANS_HELD_FOR_SALE", {
    req: ["loan", "held", "sale"],
    bonus: ["mortgage"],
    excl: ["investment"],
  })
  BS_FP.set("BS_ACCRUED_INTEREST_RECEIVABLE", {
    req: ["accrued", "interest", "receivable"],
    bonus: ["dividend"],
    excl: ["payable"],
  })
  BS_FP.set("BS_OTHER_RECEIVABLES", {
    req: ["receivable"],
    bonus: ["account", "customer", "broker"],
    excl: ["interest", "loan", "mortgage"],
  })
  BS_FP.set("BS_RESTRICTED_CASH", {
    req: ["restricted", "cash"],
    bonus: ["segregated"],
    excl: ["equivalent", "increase"],
  })
  BS_FP.set("BS_OTHER_CURRENT_ASSETS", {
    req: ["asset"],
    bonus: ["current", "prepaid", "tax receivable", "income tax receivable"],
    excl: ["noncurrent", "long-term", "deferred tax"],
  })
  BS_FP.set("BS_OREO_FORECLOSED", {
    req: ["real", "estate", "owned"],
    bonus: ["oreo", "foreclosed"],
    excl: [],
  })
  BS_FP.set("BS_OTHER_LONG_TERM_ASSETS", {
    req: ["asset"],
    bonus: ["long-term", "noncurrent", "non-current"],
    excl: ["current", "deferred tax", "goodwill", "intangible"],
  })
  BS_FP.set("BS_ACCRUED_EXPENSES", {
    req: ["accrued"],
    bonus: ["expense", "liability", "payable", "account"],
    excl: ["interest", "tax"],
  })
  BS_FP.set("BS_INTEREST_BEARING_DEPOSITS", {
    req: ["interest", "deposit"],
    bonus: ["bearing", "time", "saving", "money market", "certificate"],
    excl: ["noninterest", "non-interest", "demand"],
  })
  BS_FP.set("BS_NONINTEREST_BEARING_DEPOSITS", {
    req: ["noninterest", "deposit"],
    bonus: ["non-interest", "demand"],
    excl: ["interest bearing"],
  })
  BS_FP.set("BS_TOTAL_DEPOSITS", {
    req: ["deposit"],
    bonus: ["total", "customer"],
    excl: ["interest bearing", "noninterest", "time", "demand", "saving"],
  })
  BS_FP.set("BS_SHORT_TERM_BORROWINGS", {
    req: ["short", "term", "borrowing"],
    bonus: ["federal", "fund", "purchased", "repurchase", "commercial paper"],
    excl: ["long", "current portion", "fhlb"],
  })
  BS_FP.set("BS_CURRENT_PORTION_LT_DEBT", {
    req: ["current", "portion", "long", "term", "debt"],
    bonus: ["maturities", "senior", "subordinated"],
    excl: [],
  })
  BS_FP.set("BS_LONG_TERM_DEBT", {
    req: ["long", "term", "debt"],
    bonus: ["senior", "subordinated", "note", "structured"],
    excl: ["current", "fhlb", "lease", "portion"],
  })
  BS_FP.set("BS_FHLB_DEBT_LT", {
    req: ["federal", "home", "loan", "bank"],
    bonus: ["fhlb", "advance"],
    excl: ["stock", "investment"],
  })
  BS_FP.set("BS_OTHER_CURRENT_LIABILITIES", {
    req: ["liability"],
    bonus: ["current", "accrued"],
    excl: ["noncurrent", "long-term", "deferred tax"],
  })
  BS_FP.set("BS_DEF_TAX_LIABILITY_NONCURR", {
    req: ["deferred", "tax", "liability"],
    bonus: ["noncurrent", "non-current"],
    excl: ["asset", "current"],
  })
  BS_FP.set("BS_OTHER_NONCURRENT_LIABILITIES", {
    req: ["liability"],
    bonus: ["noncurrent", "non-current", "long-term"],
    excl: ["current", "deferred tax"],
  })
  BS_FP.set("BS_PREF_STOCK_REDEEMABLE", {
    req: ["preferred", "stock", "redeemable"],
    bonus: ["preference", "share"],
    excl: ["non", "convertible"],
  })
  BS_FP.set("BS_PREF_STOCK_NONREDEEMABLE", {
    req: ["preferred", "stock"],
    bonus: ["preference", "share", "non-redeemable", "nonredeemable"],
    excl: ["redeemable", "convertible"],
  })
  BS_FP.set("BS_COMMON_STOCK", {
    req: ["common", "stock"],
    bonus: ["ordinary", "share", "value", "issued"],
    excl: ["additional", "treasury", "shares", "par", "per share", "repurchase"],
  })
  BS_FP.set("BS_ADDITIONAL_PAID_IN_CAPITAL", {
    req: ["additional", "paid", "capital"],
    bonus: ["apic", "premium", "surplus"],
    excl: [],
  })
  BS_FP.set("BS_RETAINED_EARNINGS", {
    req: ["retained", "earning"],
    bonus: ["accumulated", "deficit", "profit"],
    excl: [],
  })
  BS_FP.set("BS_TREASURY_STOCK", {
    req: ["treasury", "stock"],
    bonus: ["share", "held"],
    excl: [],
  })
  BS_FP.set("BS_COMPREHENSIVE_INCOME_OTHER", {
    req: ["accumulated", "comprehensive"],
    bonus: ["aoci", "reserve"],
    excl: ["gain", "loss"],
  })
  BS_FP.set("BS_MINORITY_INTEREST", {
    req: ["minority", "interest"],
    bonus: ["noncontrolling", "non-controlling"],
    excl: ["earnings"],
  })
  BS_FP.set("BS_MORTGAGE_SERVICING_RIGHTS", {
    req: ["mortgage", "servicing", "right"],
    bonus: ["msr"],
    excl: [],
  })
  BS_FP.set("BS_RISK_WEIGHTED_ASSETS", {
    req: ["risk", "weighted", "asset"],
    bonus: ["rwa", "adjusted"],
    excl: [],
  })
  for (const lvl of [1, 2, 3]) {
    BS_FP.set(`BS_FV_LEVEL${lvl}_ASSETS`, {
      req: ["level", String(lvl), "asset"],
      bonus: lvl === 1 ? ["quoted"] : lvl === 2 ? ["observable"] : ["unobservable"],
      excl: ["liability", ...([1,2,3].filter(n => n !== lvl).map(String))],
    })
    BS_FP.set(`BS_FV_LEVEL${lvl}_LIABILITIES`, {
      req: ["level", String(lvl), "liabilit"],
      bonus: lvl === 1 ? ["quoted"] : lvl === 2 ? ["observable"] : ["unobservable"],
      excl: ["asset", ...([1,2,3].filter(n => n !== lvl).map(String))],
    })
  }
}
init()

// ═══════════════════════════════════════════════════════════════════════════
// Matching
// ═══════════════════════════════════════════════════════════════════════════

function scoreMatch(secLabelLower: string, secTokens: string[], fp: FP): number {
  // Exclusion — if any excl token substring is found, reject
  for (const e of fp.excl) {
    if (secLabelLower.includes(e)) return 0
  }

  // Required tokens: check if SEC label CONTAINS each required token as substring
  let reqMatch = 0
  for (const r of fp.req) {
    if (secLabelLower.includes(r)) reqMatch++
  }

  const reqRatio = reqMatch / fp.req.length
  // Must match at least 2/3 of required patterns, or at least 2
  if (reqRatio < 0.6 || reqMatch < 2) return 0

  // Bonus tokens: substring match
  let bonusMatch = 0
  for (const b of fp.bonus) {
    if (secLabelLower.includes(b)) bonusMatch++
  }

  const bonusScore = fp.bonus.length > 0 ? (bonusMatch / Math.max(fp.bonus.length, 1)) * 0.3 : 0.3
  return Math.min(1.0, reqRatio * 0.7 + bonusScore)
}

function matchLabel(label: string, stmtType: string): { code: string; conf: number } | null {
  const lower = label.toLowerCase().trim()
  const secTokens = tokenize(label)
  if (secTokens.length < 2) return null

  const fps = stmtType === "balance_sheet" ? BS_FP : IS_FP
  let bestCode = ""
  let bestScore = 0

  for (const [code, fp] of fps) {
    const score = scoreMatch(lower, secTokens, fp)
    if (score > bestScore) {
      bestScore = score
      bestCode = code
    }
  }

  if (bestScore < 0.4) return null
  return { code: bestCode, conf: bestScore }
}

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

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
  const matched: Array<{
    snp_code: string
    value: number
    fiscal_year: number
    period_end: string
    confidence: number
    source_label: string
  }> = []

  for (const item of reportedItems) {
    const val = Number(item.value)
    if (!isFinite(val) || Math.abs(val) < 0.001) continue

    const m = matchLabel(item.line_item, statementType)
    if (m) {
      matched.push({
        snp_code: m.code,
        value: val,
        fiscal_year: item.fiscal_year,
        period_end: item.period_end,
        confidence: m.conf,
        source_label: item.line_item,
      })
    }
  }

  // Aggregate by snp_code + fiscal_year
  const agg = new Map<string, { labels: string[]; value: number; maxConf: number }>()
  for (const m of matched) {
    const key = `${m.snp_code}|${m.fiscal_year}`
    const e = agg.get(key)
    if (e) {
      e.value += m.value
      e.labels.push(m.source_label)
      e.maxConf = Math.max(e.maxConf, m.confidence)
    } else {
      agg.set(key, { labels: [m.source_label], value: m.value, maxConf: m.confidence })
    }
  }

  const mappable = getSnpMappableCodes(statementType)
  const labelMap = new Map(mappable.map(c => [c.code, c.label]))

  const results: MappedItem[] = []
  for (const [key, v] of agg) {
    const [code, fyStr] = key.split("|")
    results.push({
      snp_code: code,
      snp_label: labelMap.get(code) || code,
      source_labels: v.labels,
      value: v.value,
      fiscal_year: parseInt(fyStr),
      period_end: matched[0]?.period_end || "",
      confidence: v.maxConf,
      statement_type: statementType,
    })
  }

  return results
}

export function computeCalculatedItems(
  mappedItems: MappedItem[],
  templates: SnPTemplateItem[]
): MappedItem[] {
  const results = [...mappedItems]
  const byYear = new Map<number, Map<string, number>>()

  for (const item of mappedItems) {
    if (!byYear.has(item.fiscal_year)) byYear.set(item.fiscal_year, new Map())
    byYear.get(item.fiscal_year)!.set(item.snp_code, item.value)
  }

  for (const tpl of templates) {
    if (!tpl.is_calculated || !tpl.components?.length) continue
    for (const [fy, vals] of byYear) {
      let calc = 0
      let ok = true
      let first = true
      for (const comp of tpl.components!) {
        const v = vals.get(comp)
        if (v === undefined) { ok = false; break }
        if (tpl.formula === "subtract") {
          calc = first ? v : calc - v
        } else {
          calc += v
        }
        first = false
      }
      if (ok && calc !== 0) {
        results.push({
          snp_code: tpl.code,
          snp_label: tpl.label,
          source_labels: [],
          value: calc,
          fiscal_year: fy,
          period_end: mappedItems[0]?.period_end || "",
          confidence: 0.95,
          statement_type: tpl.statement_type,
        })
      }
    }
  }
  return results
}
