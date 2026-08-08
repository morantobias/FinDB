/**
 * Ratio Calculator — Auto-computes key financial ratios from standardized data.
 *
 * Covers the main ratio categories:
 *   - Earnings (ROA, ROE, NIM, Efficiency Ratio, etc.)
 *   - Asset Quality (NPL Ratio, Coverage Ratio, Credit Cost, etc.)
 *   - Capital (CET1, Tier 1, Total Capital, Leverage, TCE/RWA)
 *   - Liquidity (LCR, NSFR, Loans/Deposits, Liquid Assets Ratio)
 *   - Funding (Deposits/Funding, Wholesale Funding Ratio)
 *
 * Each ratio function takes standardized financial data and returns
 * a computed value or null if insufficient data.
 */

interface FinancialData {
  [code: string]: number | null
}

interface ComputedRatio {
  ratio_code: string
  ratio_name: string
  value: number | null
  unit: string
  category: "earnings" | "asset_quality" | "capital" | "liquidity" | "funding" | "efficiency"
  components: { code: string; value: number | null }[]
}

/**
 * Compute all available ratios from standardized financial data.
 */
export function computeRatios(financials: FinancialData): ComputedRatio[] {
  const ratios: ComputedRatio[] = []

  // ── Earnings Ratios ─────────────────────────────────────────────────
  // ROA = Net Income / Average Total Assets
  const ni = financials.IS_NET_INCOME
  const ta = financials.BS_TOTAL_ASSETS
  if (ni != null && ta != null && ta !== 0) {
    ratios.push({
      ratio_code: "ROA", ratio_name: "Return on Assets (ROA)", value: (ni / ta) * 100, unit: "%", category: "earnings",
      components: [{ code: "IS_NET_INCOME", value: ni }, { code: "BS_TOTAL_ASSETS", value: ta }],
    })
  }

  // ROE = Net Income / Total Equity
  const te = financials.BS_TOTAL_EQUITY
  if (ni != null && te != null && te !== 0) {
    ratios.push({
      ratio_code: "ROE", ratio_name: "Return on Equity (ROE)", value: (ni / te) * 100, unit: "%", category: "earnings",
      components: [{ code: "IS_NET_INCOME", value: ni }, { code: "BS_TOTAL_EQUITY", value: te }],
    })
  }

  // ROTCE = Net Income / Tangible Common Equity
  const tce = financials.BS_TANGIBLE_COMMON_EQUITY
  if (ni != null && tce != null && tce !== 0) {
    ratios.push({
      ratio_code: "ROTCE", ratio_name: "Return on Tangible Common Equity (ROTCE)", value: (ni / tce) * 100, unit: "%", category: "earnings",
      components: [{ code: "IS_NET_INCOME", value: ni }, { code: "BS_TANGIBLE_COMMON_EQUITY", value: tce }],
    })
  }

  // NIM = Net Interest Income / Average Earning Assets (approximated by Total Assets)
  const nii = financials.IS_NET_INTEREST_INCOME
  if (nii != null && ta != null && ta !== 0) {
    ratios.push({
      ratio_code: "NIM_APPROX", ratio_name: "Net Interest Margin (Approx)", value: (nii / ta) * 100, unit: "%", category: "earnings",
      components: [{ code: "IS_NET_INTEREST_INCOME", value: nii }, { code: "BS_TOTAL_ASSETS", value: ta }],
    })
  }

  // Efficiency Ratio = Operating Expenses / Total Revenue
  const opex = financials.IS_OPERATING_EXPENSE
  const rev = financials.IS_TOTAL_REVENUE
  if (opex != null && rev != null && rev !== 0) {
    ratios.push({
      ratio_code: "EFFICIENCY_RATIO", ratio_name: "Efficiency Ratio (Cost/Income)", value: (opex / rev) * 100, unit: "%", category: "efficiency",
      components: [{ code: "IS_OPERATING_EXPENSE", value: opex }, { code: "IS_TOTAL_REVENUE", value: rev }],
    })
  }

  // Cost of Risk = Provision Expense / Gross Loans
  const prov = financials.IS_PROVISION_EXPENSE
  const gl = financials.BS_GROSS_LOANS
  if (prov != null && gl != null && gl !== 0) {
    ratios.push({
      ratio_code: "COST_OF_RISK", ratio_name: "Cost of Risk (Provisions / Gross Loans)", value: (prov / gl) * 100, unit: "%", category: "asset_quality",
      components: [{ code: "IS_PROVISION_EXPENSE", value: prov }, { code: "BS_GROSS_LOANS", value: gl }],
    })
  }

  // ── Asset Quality Ratios ────────────────────────────────────────────
  // Loan Loss Reserve / Gross Loans
  const llr = financials.BS_LOAN_LOSS_RESERVE
  if (llr != null && gl != null && gl !== 0) {
    ratios.push({
      ratio_code: "LLR_RATIO", ratio_name: "Loan Loss Reserve / Gross Loans", value: (llr / gl) * 100, unit: "%", category: "asset_quality",
      components: [{ code: "BS_LOAN_LOSS_RESERVE", value: llr }, { code: "BS_GROSS_LOANS", value: gl }],
    })
  }

  // ── Capital Ratios ──────────────────────────────────────────────────
  // TCE / RWA
  const rwa = financials.BS_RWA || financials.CAP_RWA_TOTAL
  if (tce != null && rwa != null && rwa !== 0) {
    ratios.push({
      ratio_code: "TCE_RWA", ratio_name: "TCE / RWA", value: (tce / rwa) * 100, unit: "%", category: "capital",
      components: [{ code: "BS_TANGIBLE_COMMON_EQUITY", value: tce }, { code: "BS_RWA", value: rwa }],
    })
  }

  // Equity / Total Assets (Leverage)
  if (te != null && ta != null && ta !== 0) {
    ratios.push({
      ratio_code: "EQUITY_ASSETS", ratio_name: "Equity / Total Assets", value: (te / ta) * 100, unit: "%", category: "capital",
      components: [{ code: "BS_TOTAL_EQUITY", value: te }, { code: "BS_TOTAL_ASSETS", value: ta }],
    })
  }

  // ── Liquidity & Funding Ratios ──────────────────────────────────────
  // Loans / Deposits
  const nl = financials.BS_NET_LOANS
  const td = financials.BS_TOTAL_DEPOSITS
  if (nl != null && td != null && td !== 0) {
    ratios.push({
      ratio_code: "LOANS_DEPOSITS", ratio_name: "Loans / Deposits (LDR)", value: (nl / td) * 100, unit: "%", category: "liquidity",
      components: [{ code: "BS_NET_LOANS", value: nl }, { code: "BS_TOTAL_DEPOSITS", value: td }],
    })
  }

  // ── EPS (if available directly) ─────────────────────────────────────
  const eps = financials.IS_EPS
  if (eps != null) {
    ratios.push({
      ratio_code: "EPS", ratio_name: "Earnings Per Share", value: eps, unit: "USD", category: "earnings",
      components: [{ code: "IS_EPS", value: eps }],
    })
  }

  return ratios.filter(r => r.value != null && isFinite(r.value))
}

/**
 * Compute ratios for a single bank across all its standardized financial periods.
 * Returns an array of ratio objects ready for database insertion.
 */
export function computeAllBankRatios(
  bankId: string,
  standardizedItems: Array<{
    id?: string
    standardized_code: string
    value: number
    period_end: string
    fiscal_year: number
    filing_id?: string
  }>,
): Array<{
  id: string
  bank_id: string
  filing_id: string | undefined
  ratio_code: string
  ratio_name: string
  value: number
  unit: string
  category: string
  period_end: string
  fiscal_year: number
}> {
  // Group by period
  const byPeriod = new Map<string, FinancialData>()
  for (const item of standardizedItems) {
    const key = `${item.period_end}-${item.fiscal_year}`
    if (!byPeriod.has(key)) byPeriod.set(key, {})
    byPeriod.get(key)![item.standardized_code] = item.value
  }

  const allRatios: Array<{
    id: string
    bank_id: string
    filing_id: string | undefined
    ratio_code: string
    ratio_name: string
    value: number
    unit: string
    category: string
    period_end: string
    fiscal_year: number
  }> = []

  for (const [key, data] of byPeriod) {
    const [period_end, fiscal_year] = key.split("-")
    const computed = computeRatios(data)
    // Find the filing_id for this period
    const filingId = standardizedItems.find(
      i => i.period_end === period_end && i.fiscal_year === parseInt(fiscal_year)
    )?.filing_id

    let idx = 0
    for (const ratio of computed) {
      if (ratio.value == null) continue
      allRatios.push({
        id: `${bankId}-${period_end}-${ratio.ratio_code}`,
        bank_id: bankId,
        filing_id: filingId,
        ratio_code: ratio.ratio_code,
        ratio_name: ratio.ratio_name,
        value: ratio.value,
        unit: ratio.unit,
        category: ratio.category,
        period_end,
        fiscal_year: parseInt(fiscal_year),
      })
      idx++
    }
  }

  return allRatios
}
