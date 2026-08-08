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

    // Try US GAAP first, then IFRS for Canadian cross-listed banks
    const gaapFacts = facts?.facts?.["us-gaap"]
    const ifrsFacts = facts?.facts?.["ifrs-full"]

    if (!gaapFacts && !ifrsFacts) {
      console.log(`  ⚠️  No us-gaap or ifrs-full facts found. Available keys: ${Object.keys(facts?.facts || {}).join(", ")}`)
      return []
    }

    // Process US GAAP facts
    if (gaapFacts) {
      const gaapMappings = getUsGaapMappings()
      for (const [tag, mapping] of Object.entries(gaapMappings)) {
        extractFactToResults(results, gaapFacts, tag, mapping)
      }

      // US GAAP ratio mappings
      const ratioMappings = getRatioXbrlMappings()
      for (const [tag, mapping] of Object.entries(ratioMappings)) {
        extractRatioFact(results, gaapFacts, tag, mapping)
      }
    }

    // Process IFRS facts (Canadian cross-listed banks)
    if (ifrsFacts) {
      const ifrsMappings = getIfrsMappings()
      for (const [tag, mapping] of Object.entries(ifrsMappings)) {
        extractFactToResults(results, ifrsFacts, tag, mapping)
      }
    }

    console.log(`📊 Extracted ${results.length} financial data points from SEC XBRL`)

    // Deduplicate: for each code+fiscal_year, keep the latest filed_date
    const deduped = new Map<string, ExtractedFinancial>()
    for (const item of results) {
      const key = `${item.standardized_code}|${item.fiscal_year}|${item.form}`
      const existing = deduped.get(key)
      if (!existing || item.filed_date > existing.filed_date) {
        deduped.set(key, item)
      }
    }

    const final = Array.from(deduped.values())
    console.log(`📊 After dedup: ${final.length} unique data points`)
    return final
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
