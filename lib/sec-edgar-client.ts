/**
 * SEC EDGAR API Client — Fetches XBRL-tagged financial data for US banks.
 *
 * SEC API (free, no key required):
 *   - Company Facts: https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json
 *   - Submissions:   https://data.sec.gov/submissions/CIK{cik}.json
 *   - Company Tickers: https://www.sec.gov/files/company_tickers.json
 *
 * Rate limit: 10 requests/second
 * User-Agent header required: "Company Name email@domain.com"
 */

const SEC_BASE = "https://data.sec.gov/api"
const USER_AGENT = "FinDB findb@morantobias.dev"

export interface SecFact {
  label: string
  description: string
  units: Record<string, Array<{
    start?: string
    end: string
    val: number
    accn: string
    fy: number
    fp: string
    form: string
    filed: string
    frame?: string
  }>>
}

export interface SecCompanyFacts {
  cik: number
  entityName: string
  facts: {
    "us-gaap": Record<string, SecFact>
    "dei": Record<string, any>
  }
}

export interface SecFiling {
  accessNumber: string
  filingDate: string
  reportDate: string
  form: string
  primaryDocument: string
}

export interface ExtractedFinancial {
  standardized_code: string
  standardized_label: string
  reported_label: string  // SEC fact label — the GAAP-standard name close to as-reported
  value: number
  unit: string
  period_end: string
  fiscal_year: number
  form: string
  filed_date: string
  xbrl_tag: string
  confidence: number
}

export interface ReportedFact {
  tag: string
  label: string
  description: string
  value: number
  unit: string
  statement_type: "balance_sheet" | "income_statement" | "cash_flow"
  period_end: string
  fiscal_year: number
  form: string
  filed_date: string
}

export class SecEdgarClient {
  private lastRequestTime = 0
  private minInterval = 150 // ms between requests (10/sec max)

  private async rateLimit() {
    const elapsed = Date.now() - this.lastRequestTime
    if (elapsed < this.minInterval) {
      await new Promise(r => setTimeout(r, this.minInterval - elapsed))
    }
    this.lastRequestTime = Date.now()
  }

  private async fetchSec(path: string): Promise<any> {
    await this.rateLimit()
    const url = `${SEC_BASE}${path}`
    console.log(`📡 SEC: ${url}`)
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept": "application/json" },
    })
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`SEC API error ${response.status}: ${url}`)
    }
    return response.json()
  }

  /** Get CIK from ticker symbol */
  async getCikFromTicker(ticker: string): Promise<number | null> {
    const data = await this.fetchSec("/xbrl/companyfacts/CIK0000000000.json").catch(() => null)
    // Try standard CIK format (10-digit zero-padded)
    // Most US banks: JPM=19617, BAC=70858, C=831001, WFC=72971, GS=886982, MS=895421

    // Use the SEC company_tickers.txt mapping
    try {
      const response = await fetch("https://www.sec.gov/files/company_tickers.json", {
        headers: { "User-Agent": USER_AGENT },
      })
      const tickers = await response.json()
      for (const [_key, entry] of Object.entries(tickers)) {
        const e = entry as any
        if (e.ticker?.toUpperCase() === ticker.toUpperCase()) {
          return e.cik_str
        }
      }
    } catch (err) {
      console.warn(`⚠️ Ticker lookup failed for ${ticker}:`, (err as Error).message)
    }

    return null
  }

  /** Fetch all XBRL company facts for a CIK */
  async getCompanyFacts(cik: number): Promise<SecCompanyFacts | null> {
    const paddedCik = String(cik).padStart(10, "0")
    return this.fetchSec(`/xbrl/companyfacts/CIK${paddedCik}.json`)
  }

  /** Extract standardized financial data from SEC company facts */
  extractFinancials(facts: SecCompanyFacts): ExtractedFinancial[] {
    const results: ExtractedFinancial[] = []

    const gaapFacts = facts?.facts?.["us-gaap"]
    const ifrsFacts = (facts?.facts as any)?.["ifrs-full"]

    if (!gaapFacts && !ifrsFacts) {
      console.log(`  ⚠️  No us-gaap or ifrs-full facts found. Available keys: ${Object.keys(facts?.facts || {}).join(", ")}`)
      return []
    }

    if (gaapFacts) {
      const gaapMappings = getUsGaapMappings()
      for (const [tag, mapping] of Object.entries(gaapMappings)) {
        extractFactToResults(results, gaapFacts, tag, mapping)
      }
      const ratioMappings = getRatioXbrlMappings()
      for (const [tag, mapping] of Object.entries(ratioMappings)) {
        extractRatioFact(results, gaapFacts, tag, mapping)
      }
    }

    if (ifrsFacts) {
      const ifrsMappings = getIfrsMappings()
      for (const [tag, mapping] of Object.entries(ifrsMappings)) {
        extractFactToResults(results, ifrsFacts, tag, mapping)
      }
    }

    console.log(`📊 Extracted ${results.length} mapped financial data points`)

    const deduped = new Map<string, ExtractedFinancial>()
    for (const item of results) {
      const key = `${item.standardized_code}|${item.fiscal_year}|${item.form}`
      const existing = deduped.get(key)
      if (!existing || item.filed_date > existing.filed_date) {
        deduped.set(key, item)
      }
    }

    const final = Array.from(deduped.values())
    console.log(`📊 After dedup: ${final.length} unique mapped data points`)
    return final
  }

  /** Extract ALL reported facts (not just mapped ones) for As Reported view */
  extractAllReportedFacts(facts: SecCompanyFacts): ReportedFact[] {
    const results: ReportedFact[] = []

    const gaapFacts = facts?.facts?.["us-gaap"]
    const ifrsFacts = (facts?.facts as any)?.["ifrs-full"]

    // Use whichever namespace has more facts (Scotiabank: 1 us-gaap vs 258 ifrs-full)
    const gaapSize = gaapFacts ? Object.keys(gaapFacts).length : 0
    const ifrsSize = ifrsFacts ? Object.keys(ifrsFacts).length : 0
    const allFacts = ifrsSize > gaapSize ? ifrsFacts : (gaapFacts || ifrsFacts || {})
    if (Object.keys(allFacts).length === 0) {
      console.log(`  ⚠️  No facts found for reported view`)
      return []
    }

    for (const [tag, fact] of Object.entries(allFacts)) {
      if (!fact?.units) continue

      // Try USD first, then CAD, then any currency
      let data = fact.units["USD"] || fact.units["CAD"]
      if (!data) {
        const keys = Object.keys(fact.units)
        if (keys.length === 0) continue
        data = fact.units[keys[0]]
      }
      if (!data || data.length === 0) continue

      // Filter for 10-K / 40-F annual filings
      const annual = data
        .filter((d: any) => d.form === "10-K" || d.form === "10-K/A" || d.form === "40-F" || d.form === "20-F")
        .sort((a: any, b: any) => b.fy - a.fy)

      if (annual.length === 0) continue

      // Determine statement type
      const stmtType = this.classifyStatementType(tag, fact.label)

      // Only include likely financial statement items (skip pension detail, tax reconciliation, etc.)
      if (stmtType === "skip") continue

      for (const filing of annual) {
        const val = filing.val
        const valInMillions = Math.abs(val) > 10_000_000 ? val / 1_000_000 : val
        const label = fact.label || tag // fallback to tag name if no label

        results.push({
          tag,
          label,
          description: fact.description || "",
          value: valInMillions,
          unit: Math.abs(val) > 10_000_000 ? "millions" : "actual",
          statement_type: stmtType,
          period_end: filing.end,
          fiscal_year: filing.fy,
          form: filing.form,
          filed_date: filing.filed,
        })
      }
    }

    // Deduplicate: keep latest filing per tag+year
    const deduped = new Map<string, ReportedFact>()
    for (const item of results) {
      const key = `${item.tag}|${item.fiscal_year}`
      const existing = deduped.get(key)
      if (!existing || item.filed_date > existing.filed_date) {
        deduped.set(key, item)
      }
    }

    const final = Array.from(deduped.values())
    console.log(`📋 All reported facts: ${final.length} items (${final.filter(f => f.statement_type === "balance_sheet").length} BS, ${final.filter(f => f.statement_type === "income_statement").length} IS, ${final.filter(f => f.statement_type === "cash_flow").length} CF)`)
    return final
  }

  /** Classify a fact as balance_sheet, income_statement, cash_flow, or skip */
  private classifyStatementType(tag: string, label: string): "balance_sheet" | "income_statement" | "cash_flow" | "skip" {
    const lower = (tag + " " + label).toLowerCase()

    // Cash Flow indicators (check BEFORE balance sheet to avoid misclassification)
    const cfPatterns = [
      "cash and cash equivalents, period increase",
      "cash, cash equivalents, restricted cash",
      "net cash provided", "net cash used",
      "proceeds from", "repayments of", "payments for",
      "cash flow", "investing activ", "financing activ",
      "operating activ", "capital expenditure",
      "effect of exchange rate on cash",
      "supplemental cash flow", "cash paid for",
      "repurchase of common stock", "repayments of debt",
      "proceeds from issuance", "dividends paid",
      "net change in", "cash received from",
    ]
    if (cfPatterns.some(p => lower.includes(p))) return "cash_flow"

    // Skip: per-share metadata, non-financial items
    const skipPatterns = [
      "pershare", "per share", "par value", "shares authorized",
      "shares issued", "shares outstanding", "stated value",
      "definedbenefit", "definedcontribution", "pension", "postretirement",
      "effectivetaxrate", "taxrate reconciliation",
      "othercomprehensiveincome", "accumulated translation",
      "businessacquisition", "proforma", "segment",
      "weightedaverage", "antidilutive",
      "dividendspershare", "commonstockdividends",
      "sharebasedcompensation", "stockoption",
      "restructuring", "discontinued", "extraordinary",
      "changeinaccounting", "newaccounting",
      "reclassification",
      "cashflowhedge", "fairvaluehedge", "netinvestmenthedge",
      "remeasurement", "settlement", "curtailment",
      "subsequentevent", "commitment", "contingency",
      "variableinterest", "consolidated", "investmentcompany",
      "relatedparty", "concentration", "fairvalueinput",
      "scheduleof", "maturity", "contractual",
      // Skip shares/equity metadata
      "common stock, shares", "preferred stock, shares",
      "common stock, par", "preferred stock, par",
      "treasury stock, shares", "stock repurchase program, number",
      "common stock, capital shares reserved",
    ]
    if (skipPatterns.some(p => lower.includes(p))) return "skip"

    // Balance Sheet indicators
    const bsPatterns = [
      "asset", "liabilit", "deposit", "loan", "borrowing", "debt",
      "equity", "stockholder", "goodwill", "intangible",
      "capital", "rwa", "risk.weighted", "allowance",
      "reserve", "cash", "securit", "trading",
      "property", "premises", "treasury", "retained",
      "aoci", "common.stock", "paid.in", "tier",
      "derivative", "receivable", "payable", "repurchase",
      "federal.funds", "commercial.paper", "subordinated",
      "brokerage", "servicing", "held.for.sale",
      "accumulated.other", "hedge",
    ]
    if (bsPatterns.some(p => lower.includes(p))) return "balance_sheet"

    // Income Statement indicators
    const isPatterns = [
      "income", "revenue", "expense", "earning",
      "interest", "provision", "tax", "fee", "commission",
      "compensation", "occupancy", "salary", "benefit",
      "profit", "loss", "amortization", "depreciation",
      "dividend", "gain", "write.off", "write.down",
      "impairment", "servicing", "brokerage",
      "investment.banking", "advisory", "underwriting",
      "trading.revenue", "principal.transaction",
      "card", "payment", "mortgage", "fiduciary",
      "marketing", "professional", "technology",
      "communication", "data.processing", "fdic",
      "premium", "assessment", "other.operating",
    ]
    if (isPatterns.some(p => lower.includes(p))) return "income_statement"

    // Default: balance sheet for anything that looks like a position, income for flows
    if (lower.includes("expense") || lower.includes("revenue") || lower.includes("income") || lower.includes("earning") || lower.includes("loss")) {
      return "income_statement"
    }

    return "balance_sheet"
  }

  private normalizeValue(val: number, targetUnit: string): number {
    // SEC XBRL typically reports in actual dollars
    // Convert to millions
    if (targetUnit === "millions") return val / 1_000_000
    if (targetUnit === "billions") return val / 1_000_000_000
    return val
  }
}

/** Map US GAAP XBRL tags → FinDB standardized codes */
function getUsGaapMappings(): Record<string, { code: string; label: string; unit: string }> {
  return {
    // Balance Sheet — Assets (expanded)
    "Assets": { code: "BS_TOTAL_ASSETS", label: "Total Assets", unit: "millions" },
    "CashAndCashEquivalentsAtCarryingValue": { code: "BS_CASH_AND_EQUIVALENTS", label: "Cash & Equivalents", unit: "millions" },
    "CashAndDueFromBanks": { code: "BS_CASH_DUE_FROM_BANKS", label: "Cash & Due from Banks", unit: "millions" },
    "InterestBearingDepositsInBanks": { code: "BS_INTEREST_BEARING_BANK_DEPOSITS", label: "Interest-Bearing Deposits with Banks", unit: "millions" },
    "AvailableForSaleSecuritiesDebtSecurities": { code: "BS_INVESTMENT_SECURITIES_AFS", label: "AFS Securities", unit: "millions" },
    "HeldToMaturitySecurities": { code: "BS_HELD_TO_MATURITY", label: "HTM Securities", unit: "millions" },
    "AvailableForSaleSecuritiesDebtSecuritiesCurrent": { code: "BS_INVESTMENT_SECURITIES", label: "Investment Securities", unit: "millions" },
    "TradingAssets": { code: "BS_TRADING_ASSETS", label: "Trading Assets", unit: "millions" },
    "LoansAndLeasesReceivableNetReportedAmount": { code: "BS_NET_LOANS", label: "Net Loans & Leases", unit: "millions" },
    "LoansAndLeasesReceivableGrossCarryingAmount": { code: "BS_GROSS_LOANS", label: "Gross Loans", unit: "millions" },
    "FinancingReceivableAllowanceForCreditLosses": { code: "BS_LOAN_LOSS_RESERVE", label: "Allowance for Credit Losses", unit: "millions" },
    "Goodwill": { code: "BS_GOODWILL", label: "Goodwill", unit: "millions" },
    "IntangibleAssetsNetExcludingGoodwill": { code: "BS_INTANGIBLES", label: "Other Intangibles", unit: "millions" },
    "OtherAssets": { code: "BS_OTHER_ASSETS", label: "Other Assets", unit: "millions" },
    "PropertyPlantAndEquipmentNet": { code: "BS_PREMISES_EQUIPMENT", label: "Premises & Equipment", unit: "millions" },

    // Balance Sheet — Liabilities (expanded)
    "Deposits": { code: "BS_TOTAL_DEPOSITS", label: "Total Deposits", unit: "millions" },
    "DepositsNoninterestBearing": { code: "BS_DEMAND_DEPOSITS", label: "Non-Interest Bearing Deposits", unit: "millions" },
    "InterestBearingDepositLiabilities": { code: "BS_INTEREST_BEARING_DEPOSITS", label: "Interest-Bearing Deposits", unit: "millions" },
    "InterestBearingDomesticDeposits": { code: "BS_DOMESTIC_DEPOSITS", label: "Domestic Deposits", unit: "millions" },
    "TimeDeposits": { code: "BS_TIME_DEPOSITS", label: "Time Deposits", unit: "millions" },
    "Liabilities": { code: "BS_TOTAL_LIABILITIES", label: "Total Liabilities", unit: "millions" },
    "ShortTermBorrowings": { code: "BS_SHORT_TERM_BORROWINGS", label: "Short-Term Borrowings", unit: "millions" },
    "LongTermDebt": { code: "BS_LONG_TERM_DEBT", label: "Long-Term Debt", unit: "millions" },
    "LongTermFederalHomeLoanBankAdvances": { code: "BS_FHLB_ADVANCES", label: "FHLB Advances", unit: "millions" },
    "FederalFundsPurchased": { code: "BS_FED_FUNDS_PURCHASED", label: "Federal Funds Purchased", unit: "millions" },
    "SecuritiesSoldUnderAgreementsToRepurchase": { code: "BS_REPO_AGREEMENTS", label: "Repurchase Agreements", unit: "millions" },
    "CommercialPaper": { code: "BS_COMMERCIAL_PAPER", label: "Commercial Paper", unit: "millions" },
    "SubordinatedDebt": { code: "BS_SUBORDINATED_DEBT", label: "Subordinated Debt", unit: "millions" },
    "TradingLiabilities": { code: "BS_TRADING_LIABILITIES", label: "Trading Liabilities", unit: "millions" },
    "DerivativeLiabilities": { code: "BS_DERIVATIVE_LIABILITIES", label: "Derivative Liabilities", unit: "millions" },
    "OtherLiabilities": { code: "BS_OTHER_LIABILITIES", label: "Other Liabilities", unit: "millions" },
    "AccountsPayableAndAccruedLiabilities": { code: "BS_ACCOUNTS_PAYABLE", label: "Accounts Payable & Accrued", unit: "millions" },

    // Balance Sheet — Equity (expanded)
    "StockholdersEquity": { code: "BS_TOTAL_EQUITY", label: "Total Shareholders' Equity", unit: "millions" },
    "CommonStockValue": { code: "BS_COMMON_STOCK", label: "Common Stock", unit: "millions" },
    "AdditionalPaidInCapital": { code: "BS_ADDITIONAL_PAID_IN", label: "Additional Paid-In Capital", unit: "millions" },
    "AdditionalPaidInCapitalCommonStock": { code: "BS_ADDITIONAL_PAID_IN", label: "Additional Paid-In Capital", unit: "millions" },
    "RetainedEarningsAccumulatedDeficit": { code: "BS_RETAINED_EARNINGS", label: "Retained Earnings", unit: "millions" },
    "AccumulatedOtherComprehensiveIncomeLossNetOfTax": { code: "BS_AOCI", label: "AOCI", unit: "millions" },
    "TreasuryStockValue": { code: "BS_TREASURY_STOCK", label: "Treasury Stock", unit: "millions" },

    // Income Statement — Interest Income Detail
    "InterestIncomeExpenseNet": { code: "IS_NET_INTEREST_INCOME", label: "Net Interest Income", unit: "millions" },
    "InterestIncome": { code: "IS_INTEREST_INCOME", label: "Total Interest Income", unit: "millions" },
    "InterestExpense": { code: "IS_INTEREST_EXPENSE", label: "Total Interest Expense", unit: "millions" },
    "InterestIncomeLoansAndLeases": { code: "IS_INTEREST_LOANS", label: "Interest on Loans & Leases", unit: "millions" },
    "InterestIncomeSecurities": { code: "IS_INTEREST_SECURITIES", label: "Interest on Securities", unit: "millions" },
    "InterestIncomeTradingAssets": { code: "IS_INTEREST_TRADING", label: "Interest on Trading Assets", unit: "millions" },
    "InterestIncomeFederalFundsSold": { code: "IS_INTEREST_FED_FUNDS", label: "Interest on Fed Funds Sold", unit: "millions" },
    "InterestIncomeOther": { code: "IS_INTEREST_OTHER", label: "Other Interest Income", unit: "millions" },
    "InterestExpenseDeposits": { code: "IS_INTEREST_DEPOSITS", label: "Interest on Deposits", unit: "millions" },
    "InterestExpenseBorrowings": { code: "IS_INTEREST_BORROWINGS", label: "Interest on Borrowings", unit: "millions" },
    "InterestExpenseShortTermBorrowings": { code: "IS_INTEREST_ST_BORROWINGS", label: "Interest on Short-Term Borrowings", unit: "millions" },
    "InterestExpenseLongTermDebt": { code: "IS_INTEREST_LT_DEBT", label: "Interest on Long-Term Debt", unit: "millions" },
    "InterestExpenseFederalFundsPurchased": { code: "IS_INTEREST_FED_FUNDS_PURCHASED", label: "Interest on Fed Funds Purchased", unit: "millions" },
    "InterestExpenseOther": { code: "IS_INTEREST_OTHER_EXPENSE", label: "Other Interest Expense", unit: "millions" },

    // Income Statement — Non-Interest Income Detail
    "NoninterestIncome": { code: "IS_NONINTEREST_INCOME", label: "Total Non-Interest Income", unit: "millions" },
    "FeesAndCommissions": { code: "IS_FEE_INCOME", label: "Fees & Commissions", unit: "millions" },
    "InvestmentBankingAdvisoryFees": { code: "IS_INVESTMENT_BANKING", label: "Investment Banking / Advisory", unit: "millions" },
    "BrokerageCommissionsRevenue": { code: "IS_BROKERAGE_FEES", label: "Brokerage Commissions", unit: "millions" },
    "PrincipalTransactionsRevenue": { code: "IS_TRADING_INCOME", label: "Trading / Principal Transactions", unit: "millions" },
    "AssetManagementFees": { code: "IS_ASSET_MANAGEMENT", label: "Asset Management Fees", unit: "millions" },
    "AssetManagementFees1": { code: "IS_ASSET_MANAGEMENT", label: "Asset Management Fees", unit: "millions" },
    "InvestmentAdvisoryFees": { code: "IS_ASSET_MANAGEMENT", label: "Asset Management / Advisory Fees", unit: "millions" },
    "CardAndPaymentProcessingRevenue": { code: "IS_CARD_FEES", label: "Card & Payment Processing", unit: "millions" },
    "MortgageServicingRevenue": { code: "IS_MORTGAGE_FEES", label: "Mortgage Servicing Revenue", unit: "millions" },
    "OtherNoninterestIncome": { code: "IS_OTHER_NONINTEREST_INCOME", label: "Other Non-Interest Income", unit: "millions" },

    // Income Statement — Revenue & PPNR
    "Revenues": { code: "IS_TOTAL_REVENUE", label: "Total Revenue", unit: "millions" },
    "OperatingIncomeLoss": { code: "IS_PRE_PROVISION_PROFIT", label: "Pre-Provision Operating Income", unit: "millions" },
    "IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest": { code: "IS_INCOME_BEFORE_TAX", label: "Income Before Taxes", unit: "millions" },

    // Income Statement — Non-Interest Expense Detail
    "OperatingExpenses": { code: "IS_OPERATING_EXPENSE", label: "Total Operating Expenses", unit: "millions" },
    "LaborAndRelatedExpense": { code: "IS_COMPENSATION", label: "Compensation & Benefits", unit: "millions" },
    "OccupancyNet": { code: "IS_OCCUPANCY", label: "Occupancy & Equipment", unit: "millions" },
    "ProfessionalFees": { code: "IS_PROFESSIONAL_SERVICES", label: "Professional Services", unit: "millions" },
    "MarketingExpense": { code: "IS_MARKETING", label: "Marketing Expense", unit: "millions" },
    "CommunicationsAndDataProcessing": { code: "IS_TECHNOLOGY", label: "Technology & Communications", unit: "millions" },
    "TechnologyExpense": { code: "IS_TECHNOLOGY", label: "Technology Expense", unit: "millions" },
    "FDICPremiumExpense": { code: "IS_FDIC_PREMIUM", label: "FDIC Premium Expense", unit: "millions" },
    "AmortizationOfIntangibleAssets": { code: "IS_AMORTIZATION", label: "Amortization of Intangibles", unit: "millions" },
    "OtherNoninterestExpense": { code: "IS_OTHER_OPEX", label: "Other Operating Expenses", unit: "millions" },
    "NoninterestExpense": { code: "IS_OPERATING_EXPENSE", label: "Total Non-Interest Expense", unit: "millions" },

    // Income Statement — Provisions & Net Income
    "ProvisionForLoanLeaseAndOtherLosses": { code: "IS_PROVISION_EXPENSE", label: "Provision for Credit Losses", unit: "millions" },
    "ProvisionForCreditLosses": { code: "IS_PROVISION_EXPENSE", label: "Provision for Credit Losses", unit: "millions" },
    "NetIncomeLoss": { code: "IS_NET_INCOME", label: "Net Income", unit: "millions" },
    "IncomeTaxExpenseBenefit": { code: "IS_INCOME_TAX", label: "Income Tax Provision", unit: "millions" },
    "EarningsPerShareBasic": { code: "IS_EPS", label: "Earnings Per Share (Basic)", unit: "actual" },
    "EarningsPerShareDiluted": { code: "IS_EPS_DILUTED", label: "Earnings Per Share (Diluted)", unit: "actual" },
    "CommonStockDividendsPerShareDeclared": { code: "IS_DPS", label: "Dividends Per Share", unit: "actual" },

    // Balance Sheet — Additional Assets
    "LoansHeldForSale": { code: "BS_LOANS_HELD_FOR_SALE", label: "Loans Held for Sale", unit: "millions" },
    "DerivativeAssets": { code: "BS_DERIVATIVE_ASSETS", label: "Derivative Assets", unit: "millions" },
    "BrokerageReceivables": { code: "BS_BROKERAGE_RECEIVABLES", label: "Brokerage Receivables", unit: "millions" },
    "ServicingAsset": { code: "BS_SERVICING_ASSETS", label: "Mortgage Servicing Assets", unit: "millions" },

    // Capital (expanded)
    "RiskWeightedAssets": { code: "CAP_RWA_TOTAL", label: "Risk-Weighted Assets", unit: "millions" },
    "CommonEquityTierOneCapital": { code: "BS_CET1_CAPITAL", label: "CET1 Capital", unit: "millions" },
    "TierOneCapital": { code: "BS_TIER_1_CAPITAL", label: "Tier 1 Capital", unit: "millions" },
    "TierTwoCapital": { code: "BS_TIER_2_CAPITAL", label: "Tier 2 Capital", unit: "millions" },
    "Capital": { code: "BS_TOTAL_CAPITAL", label: "Total Regulatory Capital", unit: "millions" },
  }
}

/** Map ratio-type XBRL tags */
function getRatioXbrlMappings(): Record<string, { code: string; label: string; isPercent: boolean }> {
  return {
    "CommonEquityTierOneCapitalRatio": { code: "CAP_CET1_RATIO", label: "CET1 Ratio", isPercent: false },
    "TierOneRiskBasedCapitalRatio": { code: "CAP_TIER1_RATIO", label: "Tier 1 Ratio", isPercent: false },
    "CapitalToRiskWeightedAssets": { code: "CAP_TOTAL_CAPITAL_RATIO", label: "Total Capital Ratio", isPercent: false },
    "LeverageRatio": { code: "CAP_LEVERAGE_RATIO", label: "Leverage Ratio", isPercent: false },
  }
}

/** Map IFRS XBRL tags → FinDB standardized codes (Canadian/European banks) */
function getIfrsMappings(): Record<string, { code: string; label: string; unit: string }> {
  return {
    "Assets": { code: "BS_TOTAL_ASSETS", label: "Total Assets", unit: "millions" },
    "CashAndCashEquivalents": { code: "BS_CASH_AND_EQUIVALENTS", label: "Cash & Equivalents", unit: "millions" },
    "LoansAndAdvancesToCustomers": { code: "BS_NET_LOANS", label: "Net Loans & Advances", unit: "millions" },
    "DepositsFromCustomers": { code: "BS_TOTAL_DEPOSITS", label: "Total Deposits", unit: "millions" },
    "DepositsFromBanks": { code: "BS_INTEREST_BEARING_BANK_DEPOSITS", label: "Deposits from Banks", unit: "millions" },
    "Equity": { code: "BS_TOTAL_EQUITY", label: "Total Equity", unit: "millions" },
    "Liabilities": { code: "BS_TOTAL_LIABILITIES", label: "Total Liabilities", unit: "millions" },
    "Goodwill": { code: "BS_GOODWILL", label: "Goodwill", unit: "millions" },
    "IntangibleAssetsOtherThanGoodwill": { code: "BS_INTANGIBLES", label: "Other Intangibles", unit: "millions" },
    "Revenue": { code: "IS_TOTAL_REVENUE", label: "Total Revenue", unit: "millions" },
    "InterestRevenueCalculated": { code: "IS_INTEREST_INCOME", label: "Interest Income", unit: "millions" },
    "InterestExpense": { code: "IS_INTEREST_EXPENSE", label: "Interest Expense", unit: "millions" },
    "FeeAndCommissionIncome": { code: "IS_NONINTEREST_INCOME", label: "Fee & Commission Income", unit: "millions" },
    "ProfitLoss": { code: "IS_NET_INCOME", label: "Net Income (IFRS)", unit: "millions" },
    "ProfitLossAttributableToOrdinaryEquityHoldersOfParentEntity": { code: "IS_NET_INCOME", label: "Net Income", unit: "millions" },
    "BasicEarningsLossPerShare": { code: "IS_EPS", label: "EPS (Basic)", unit: "actual" },
    "DilutedEarningsLossPerShare": { code: "IS_EPS_DILUTED", label: "EPS (Diluted)", unit: "actual" },
    "OperatingExpense": { code: "IS_OPERATING_EXPENSE", label: "Operating Expenses", unit: "millions" },
    "EmployeeBenefitsExpense": { code: "IS_COMPENSATION", label: "Compensation & Benefits", unit: "millions" },
    "IncomeTaxExpenseContinuingOperations": { code: "IS_INCOME_TAX", label: "Income Tax", unit: "millions" },
  }
}

/**
 * Helper: Extract a financial fact from XBRL facts and push to results.
 */
function extractFactToResults(
  results: ExtractedFinancial[],
  facts: Record<string, SecFact>,
  tag: string,
  mapping: { code: string; label: string; unit: string },
  _context?: string,
) {
  const fact = facts[tag]
  if (!fact?.units) return

  // Try USD first, then CAD
  let data = fact.units["USD"] || fact.units["CAD"]
  if (!data) {
    // Try any currency
    const keys = Object.keys(fact.units)
    if (keys.length === 0) return
    data = fact.units[keys[0]]
  }
  if (!data || data.length === 0) return

  // Annual filings (10-K for US, 40-F for Canadian)
  const annual = data
    .filter((d: any) => d.form === "10-K" || d.form === "10-K/A" || d.form === "40-F" || d.form === "20-F")
    .sort((a: any, b: any) => b.fy - a.fy)

  for (const filing of annual) {
    const val = filing.val
    const valueConverted = mapping.unit === "millions" ? val / 1_000_000
      : mapping.unit === "billions" ? val / 1_000_000_000
      : val

    results.push({
      standardized_code: mapping.code,
      standardized_label: mapping.label,
      reported_label: fact.label,
      value: valueConverted,
      unit: mapping.unit,
      period_end: filing.end,
      fiscal_year: filing.fy,
      form: filing.form,
      filed_date: filing.filed,
      xbrl_tag: tag,
      confidence: 0.99,
    })
  }

  // Quarterly (10-Q / 6-K)
  const quarterly = data
    .filter((d: any) => d.form === "10-Q" || d.form === "6-K")
    .sort((a: any, b: any) => new Date(b.end).getTime() - new Date(a.end).getTime())
    .slice(0, 4)

  for (const filing of quarterly) {
    results.push({
      standardized_code: mapping.code,
      standardized_label: mapping.label,
      reported_label: fact.label,
      value: mapping.unit === "millions" ? filing.val / 1_000_000 : filing.val,
      unit: mapping.unit,
      period_end: filing.end,
      fiscal_year: filing.fy,
      form: filing.form,
      filed_date: filing.filed,
      xbrl_tag: tag,
      confidence: 0.99,
    })
  }
}

function extractRatioFact(
  results: ExtractedFinancial[],
  facts: Record<string, SecFact>,
  tag: string,
  mapping: { code: string; label: string; isPercent: boolean },
) {
  const fact = facts[tag]
  if (!fact?.units) return

  const pureData = fact.units["pure"] || fact.units["number"]
  if (!pureData) return

  const annual = pureData
    .filter((d: any) => d.form === "10-K" || d.form === "10-K/A" || d.form === "40-F")
    .sort((a: any, b: any) => b.fy - a.fy)

  for (const filing of annual) {
    results.push({
      standardized_code: mapping.code,
      standardized_label: mapping.label,
      reported_label: fact.label,
      value: filing.val * (mapping.isPercent ? 100 : 1),
      unit: mapping.isPercent ? "%" : "ratio",
      period_end: filing.end,
      fiscal_year: filing.fy,
      form: filing.form,
      filed_date: filing.filed,
      xbrl_tag: tag,
      confidence: 0.99,
    })
  }
}
