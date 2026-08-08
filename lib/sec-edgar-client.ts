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
  value: number
  unit: string
  period_end: string
  fiscal_year: number
  form: string
  filed_date: string
  xbrl_tag: string
  confidence: number
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
    if (!facts?.facts?.["us-gaap"]) return []

    const results: ExtractedFinancial[] = []
    const usGaapFacts = facts.facts["us-gaap"]
    const mappings = getXbrlMappings()

    for (const [tag, mapping] of Object.entries(mappings)) {
      const fact = usGaapFacts[tag]
      if (!fact?.units) continue

      // Get the latest annual filing in USD
      const usdData = fact.units["USD"]
      if (!usdData || usdData.length === 0) continue

      // Filter for 10-K annual filings, sorted by fiscal year descending
      const annualFilings = usdData
        .filter((d: any) => d.form === "10-K" || d.form === "10-K/A")
        .sort((a: any, b: any) => b.fy - a.fy)

      // Take latest 5 years
      for (const filing of annualFilings.slice(0, 5)) {
        const val = filing.val
        // Convert to millions if needed
        const valueInMillions = this.normalizeValue(val, mapping.unit)

        results.push({
          standardized_code: mapping.code,
          standardized_label: mapping.label,
          value: valueInMillions,
          unit: "millions",
          period_end: filing.end,
          fiscal_year: filing.fy,
          form: filing.form,
          filed_date: filing.filed,
          xbrl_tag: tag,
          confidence: 0.99, // XBRL data is structured, high confidence
        })
      }

      // Also get quarterly (10-Q) for latest 4 quarters
      const quarterlyFilings = usdData
        .filter((d: any) => d.form === "10-Q")
        .sort((a: any, b: any) => new Date(b.end).getTime() - new Date(a.end).getTime())
        .slice(0, 4)

      for (const filing of quarterlyFilings) {
        results.push({
          standardized_code: mapping.code,
          standardized_label: mapping.label,
          value: this.normalizeValue(filing.val, mapping.unit),
          unit: "millions",
          period_end: filing.end,
          fiscal_year: filing.fy,
          form: filing.form,
          filed_date: filing.filed,
          xbrl_tag: tag,
          confidence: 0.99,
        })
      }
    }

    // Also extract ratio-type data (already in %)
    const ratioMappings = getRatioXbrlMappings()
    for (const [tag, mapping] of Object.entries(ratioMappings)) {
      const fact = usGaapFacts[tag]
      if (!fact?.units) continue

      // Ratios are typically pure numbers
      const pureData = fact.units["pure"] || fact.units["number"]
      if (!pureData) continue

      const annual = pureData
        .filter((d: any) => d.form === "10-K")
        .sort((a: any, b: any) => b.fy - a.fy)
        .slice(0, 5)

      for (const filing of annual) {
        results.push({
          standardized_code: mapping.code,
          standardized_label: mapping.label,
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

    console.log(`📊 Extracted ${results.length} financial data points from SEC XBRL`)
    return results
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
function getXbrlMappings(): Record<string, { code: string; label: string; unit: string }> {
  return {
    // Balance Sheet — Assets
    "Assets": { code: "BS_TOTAL_ASSETS", label: "Total Assets", unit: "millions" },
    "CashAndCashEquivalentsAtCarryingValue": { code: "BS_CASH_AND_EQUIVALENTS", label: "Cash & Equivalents", unit: "millions" },
    "AvailableForSaleSecuritiesDebtSecurities": { code: "BS_INVESTMENT_SECURITIES", label: "Investment Securities", unit: "millions" },
    "HeldToMaturitySecurities": { code: "BS_HELD_TO_MATURITY", label: "HTM Securities", unit: "millions" },
    "LoansAndLeasesReceivableNetReportedAmount": { code: "BS_NET_LOANS", label: "Net Loans & Leases", unit: "millions" },
    "LoansAndLeasesReceivableGrossCarryingAmount": { code: "BS_GROSS_LOANS", label: "Gross Loans", unit: "millions" },
    "FinancingReceivableAllowanceForCreditLosses": { code: "BS_LOAN_LOSS_RESERVE", label: "Allowance for Credit Losses", unit: "millions" },
    "Goodwill": { code: "BS_GOODWILL", label: "Goodwill", unit: "millions" },
    "IntangibleAssetsNetExcludingGoodwill": { code: "BS_INTANGIBLES", label: "Other Intangibles", unit: "millions" },
    "TradingAssets": { code: "BS_TRADING_ASSETS", label: "Trading Assets", unit: "millions" },
    "OtherAssets": { code: "BS_OTHER_ASSETS", label: "Other Assets", unit: "millions" },

    // Balance Sheet — Liabilities
    "Deposits": { code: "BS_TOTAL_DEPOSITS", label: "Total Deposits", unit: "millions" },
    "DepositsNoninterestBearing": { code: "BS_DEMAND_DEPOSITS", label: "Non-Interest Bearing Deposits", unit: "millions" },
    "InterestBearingDepositLiabilities": { code: "BS_INTEREST_BEARING_DEPOSITS", label: "Interest-Bearing Deposits", unit: "millions" },
    "Liabilities": { code: "BS_TOTAL_LIABILITIES", label: "Total Liabilities", unit: "millions" },
    "ShortTermBorrowings": { code: "BS_SHORT_TERM_BORROWINGS", label: "Short-Term Borrowings", unit: "millions" },
    "LongTermDebt": { code: "BS_LONG_TERM_DEBT", label: "Long-Term Debt", unit: "millions" },
    "TradingLiabilities": { code: "BS_TRADING_LIABILITIES", label: "Trading Liabilities", unit: "millions" },
    "OtherLiabilities": { code: "BS_OTHER_LIABILITIES", label: "Other Liabilities", unit: "millions" },

    // Balance Sheet — Equity
    "StockholdersEquity": { code: "BS_TOTAL_EQUITY", label: "Total Shareholders' Equity", unit: "millions" },
    "CommonStockValue": { code: "BS_COMMON_STOCK", label: "Common Stock", unit: "millions" },
    "RetainedEarningsAccumulatedDeficit": { code: "BS_RETAINED_EARNINGS", label: "Retained Earnings", unit: "millions" },
    "AccumulatedOtherComprehensiveIncomeLossNetOfTax": { code: "BS_AOCI", label: "AOCI", unit: "millions" },
    "TreasuryStockValue": { code: "BS_TREASURY_STOCK", label: "Treasury Stock", unit: "millions" },

    // Income Statement
    "InterestIncomeExpenseNet": { code: "IS_NET_INTEREST_INCOME", label: "Net Interest Income", unit: "millions" },
    "InterestIncome": { code: "IS_INTEREST_INCOME", label: "Interest Income", unit: "millions" },
    "InterestExpense": { code: "IS_INTEREST_EXPENSE", label: "Interest Expense", unit: "millions" },
    "NoninterestIncome": { code: "IS_NONINTEREST_INCOME", label: "Non-Interest Income", unit: "millions" },
    "Revenues": { code: "IS_TOTAL_REVENUE", label: "Total Revenue", unit: "millions" },
    "OperatingExpenses": { code: "IS_OPERATING_EXPENSE", label: "Operating Expenses", unit: "millions" },
    "ProvisionForLoanLeaseAndOtherLosses": { code: "IS_PROVISION_EXPENSE", label: "Provision for Credit Losses", unit: "millions" },
    "NetIncomeLoss": { code: "IS_NET_INCOME", label: "Net Income", unit: "millions" },
    "EarningsPerShareBasic": { code: "IS_EPS", label: "Earnings Per Share (Basic)", unit: "actual" },
    "EarningsPerShareDiluted": { code: "IS_EPS_DILUTED", label: "Earnings Per Share (Diluted)", unit: "actual" },
    "IncomeTaxExpenseBenefit": { code: "IS_INCOME_TAX", label: "Income Tax Provision", unit: "millions" },
    "OperatingIncomeLoss": { code: "IS_PRE_PROVISION_PROFIT", label: "Pre-Provision Operating Income", unit: "millions" },
    "CommonStockDividendsPerShareDeclared": { code: "IS_DPS", label: "Dividends Per Share", unit: "actual" },

    // Capital
    "RiskWeightedAssets": { code: "CAP_RWA_TOTAL", label: "Risk-Weighted Assets", unit: "millions" },
    "CommonEquityTierOneCapital": { code: "BS_CET1_CAPITAL", label: "CET1 Capital", unit: "millions" },
    "TierOneCapital": { code: "BS_TIER_1_CAPITAL", label: "Tier 1 Capital", unit: "millions" },

    // Liquidity
    "CashAndDueFromBanks": { code: "BS_CASH_DUE_FROM_BANKS", label: "Cash & Due from Banks", unit: "millions" },
    "InterestBearingDepositsInBanks": { code: "BS_INTEREST_BEARING_BANK_DEPOSITS", label: "Interest-Bearing Deposits with Banks", unit: "millions" },
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
