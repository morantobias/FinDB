/**
 * Bridge: Old FinDB standardized codes → S&P Capital IQ codes
 *
 * The extractFinancials() function in sec-edgar-client.ts uses ~85
 * high-quality XBRL tag → standardized code mappings. This file maps
 * those codes directly to S&P Capital IQ codes for the standardized view.
 */

export const OLD_TO_SNP: Record<string, string> = {
  // ── Balance Sheet Assets ──────────────────────────────────────────────
  "BS_TOTAL_ASSETS":                    "BS_TOTAL_ASSETS",
  "BS_CASH_AND_EQUIVALENTS":           "BS_CASH_AND_EQUIVALENTS",
  "BS_CASH_DUE_FROM_BANKS":            "BS_CASH_AND_EQUIVALENTS",
  "BS_INTEREST_BEARING_BANK_DEPOSITS": "BS_INTEREST_BEARING_DEPOSITS",
  "BS_INVESTMENT_SECURITIES_AFS":      "BS_INVESTMENT_SECURITIES",
  "BS_HELD_TO_MATURITY":               "BS_INVESTMENT_SECURITIES",
  "BS_INVESTMENT_SECURITIES":          "BS_INVESTMENT_SECURITIES",
  "BS_TRADING_ASSETS":                 "BS_TRADING_ASSET_SECURITIES",
  "BS_NET_LOANS":                      "BS_NET_LOANS",
  "BS_GROSS_LOANS":                    "BS_GROSS_LOANS",
  "BS_LOAN_LOSS_RESERVE":              "BS_ALLOWANCE_LOAN_LOSSES",
  "BS_GOODWILL":                       "BS_GOODWILL",
  "BS_INTANGIBLES":                    "BS_OTHER_LONG_TERM_ASSETS",
  "BS_OTHER_ASSETS":                   "BS_OTHER_LONG_TERM_ASSETS",
  "BS_PREMISES_EQUIPMENT":             "BS_NET_PPE",
  "BS_LOANS_HELD_FOR_SALE":            "BS_LOANS_HELD_FOR_SALE",
  "BS_DERIVATIVE_ASSETS":              "BS_OTHER_CURRENT_ASSETS",
  "BS_BROKERAGE_RECEIVABLES":          "BS_OTHER_RECEIVABLES",
  "BS_SERVICING_ASSETS":               "BS_MORTGAGE_SERVICING_RIGHTS",

  // ── Balance Sheet Liabilities ─────────────────────────────────────────
  "BS_TOTAL_DEPOSITS":                 "BS_TOTAL_DEPOSITS",
  "BS_DEMAND_DEPOSITS":                "BS_NONINTEREST_BEARING_DEPOSITS",
  "BS_INTEREST_BEARING_DEPOSITS":      "BS_INTEREST_BEARING_DEPOSITS",
  "BS_DOMESTIC_DEPOSITS":              "BS_INTEREST_BEARING_DEPOSITS",
  "BS_TIME_DEPOSITS":                  "BS_INTEREST_BEARING_DEPOSITS",
  "BS_TOTAL_LIABILITIES":              "BS_TOTAL_LIABILITIES",
  "BS_SHORT_TERM_BORROWINGS":          "BS_SHORT_TERM_BORROWINGS",
  "BS_LONG_TERM_DEBT":                 "BS_LONG_TERM_DEBT",
  "BS_FHLB_ADVANCES":                  "BS_FHLB_DEBT_LT",
  "BS_FED_FUNDS_PURCHASED":            "BS_SHORT_TERM_BORROWINGS",
  "BS_REPO_AGREEMENTS":                "BS_SHORT_TERM_BORROWINGS",
  "BS_COMMERCIAL_PAPER":               "BS_SHORT_TERM_BORROWINGS",
  "BS_SUBORDINATED_DEBT":              "BS_LONG_TERM_DEBT",
  "BS_TRADING_LIABILITIES":            "BS_OTHER_CURRENT_LIABILITIES",
  "BS_DERIVATIVE_LIABILITIES":         "BS_OTHER_CURRENT_LIABILITIES",
  "BS_OTHER_LIABILITIES":              "BS_OTHER_NONCURRENT_LIABILITIES",
  "BS_ACCOUNTS_PAYABLE":               "BS_ACCRUED_EXPENSES",

  // ── Balance Sheet Equity ──────────────────────────────────────────────
  "BS_TOTAL_EQUITY":                   "BS_TOTAL_EQUITY",
  "BS_COMMON_STOCK":                   "BS_COMMON_STOCK",
  "BS_ADDITIONAL_PAID_IN":             "BS_ADDITIONAL_PAID_IN_CAPITAL",
  "BS_RETAINED_EARNINGS":              "BS_RETAINED_EARNINGS",
  "BS_AOCI":                           "BS_COMPREHENSIVE_INCOME_OTHER",
  "BS_TREASURY_STOCK":                 "BS_TREASURY_STOCK",

  // ── Income Statement ──────────────────────────────────────────────────
  "IS_NET_INTEREST_INCOME":            "IS_NET_INTEREST_INCOME",
  "IS_INTEREST_INCOME":                "IS_TOTAL_INTEREST_INCOME",
  "IS_INTEREST_EXPENSE":               "IS_TOTAL_INTEREST_EXPENSE",
  "IS_INTEREST_LOANS":                 "IS_INTEREST_INCOME_LOANS",
  "IS_INTEREST_SECURITIES":            "IS_INTEREST_INCOME_INVESTMENTS",
  "IS_INTEREST_TRADING":               "IS_INTEREST_INCOME_INVESTMENTS",
  "IS_INTEREST_FED_FUNDS":             "IS_INTEREST_INCOME_INVESTMENTS",
  "IS_INTEREST_OTHER":                 "IS_INTEREST_INCOME_INVESTMENTS",
  "IS_INTEREST_DEPOSITS":              "IS_INTEREST_EXPENSE_DEPOSITS",
  "IS_INTEREST_BORROWINGS":            "IS_INTEREST_EXPENSE_BORROWINGS",
  "IS_INTEREST_ST_BORROWINGS":         "IS_INTEREST_EXPENSE_BORROWINGS",
  "IS_INTEREST_LT_DEBT":               "IS_INTEREST_EXPENSE_BORROWINGS",
  "IS_INTEREST_FED_FUNDS_PURCHASED":   "IS_INTEREST_EXPENSE_BORROWINGS",
  "IS_INTEREST_OTHER_EXPENSE":         "IS_INTEREST_EXPENSE_BORROWINGS",

  "IS_NONINTEREST_INCOME":             "IS_TOTAL_NONINTEREST_INCOME",
  "IS_FEE_INCOME":                     "IS_SERVICE_CHARGES_DEPOSITS",
  "IS_INVESTMENT_BANKING":             "IS_OTHER_NONINTEREST_INCOME",
  "IS_BROKERAGE_FEES":                 "IS_OTHER_NONINTEREST_INCOME",
  "IS_TRADING_INCOME":                 "IS_TRADING_INCOME",
  "IS_ASSET_MANAGEMENT":               "IS_TRUST_INCOME",
  "IS_CARD_FEES":                      "IS_OTHER_NONINTEREST_INCOME",
  "IS_MORTGAGE_FEES":                  "IS_MORTGAGE_BANKING",
  "IS_OTHER_NONINTEREST_INCOME":       "IS_OTHER_NONINTEREST_INCOME",

  "IS_TOTAL_REVENUE":                  "IS_TOTAL_REVENUE",
  "IS_PRE_PROVISION_PROFIT":           "IS_EBT_EXCL_UNUSUAL",
  "IS_INCOME_BEFORE_TAX":              "IS_EBT_INCL_UNUSUAL",

  "IS_OPERATING_EXPENSE":              "IS_TOTAL_NONINTEREST_EXPENSE",
  "IS_COMPENSATION":                   "IS_SALARIES_BENEFITS",
  "IS_OCCUPANCY":                      "IS_OCCUPANCY_EXPENSE",
  "IS_PROFESSIONAL_SERVICES":          "IS_OTHER_NONINTEREST_EXPENSE",
  "IS_MARKETING":                      "IS_SGNA_EXPENSE",
  "IS_TECHNOLOGY":                     "IS_OTHER_NONINTEREST_EXPENSE",
  "IS_FDIC_PREMIUM":                   "IS_OTHER_NONINTEREST_EXPENSE",
  "IS_AMORTIZATION":                   "IS_OTHER_NONINTEREST_EXPENSE",
  "IS_OTHER_OPEX":                     "IS_OTHER_NONINTEREST_EXPENSE",

  "IS_PROVISION_EXPENSE":              "IS_PROVISION_LOAN_LOSSES",
  "IS_NET_INCOME":                     "IS_NET_INCOME_COMPANY",
  "IS_INCOME_TAX":                     "IS_INCOME_TAX_EXPENSE",
  "IS_EPS":                            "IS_BASIC_EPS",
  "IS_EPS_DILUTED":                    "IS_DILUTED_EPS_INCL_EXTRA",
  "IS_DPS":                            "IS_DIVIDENDS_PER_SHARE",

  // ── Capital Ratios ────────────────────────────────────────────────────
  "CAP_RWA_TOTAL":                     "BS_RISK_WEIGHTED_ASSETS",
  "BS_CET1_CAPITAL":                   "BS_TOTAL_COMMON_EQUITY",
  "BS_TIER_1_CAPITAL":                 "BS_TOTAL_COMMON_EQUITY",
  "BS_TIER_2_CAPITAL":                 "BS_TOTAL_COMMON_EQUITY",
  "BS_TOTAL_CAPITAL":                  "BS_TOTAL_COMMON_EQUITY",
}

/**
 * Convert an old FinDB standardized code to an S&P Capital IQ code.
 * Returns the S&P CIQ code or null if no mapping exists.
 */
export function oldToSnpCode(oldCode: string): string | null {
  return OLD_TO_SNP[oldCode] || null
}
