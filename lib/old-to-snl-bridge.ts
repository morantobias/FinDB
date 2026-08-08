/**
 * Bridge: Old FinDB XBRL standardized codes → SNL Financial codes
 */
export const OLD_TO_SNL: Record<string, string> = {
  // ── Balance Sheet Assets ──────────────────────────────────────────────
  "BS_TOTAL_ASSETS":                    "SNL_BS_TOTAL_ASSETS",
  "BS_CASH_AND_EQUIVALENTS":           "SNL_BS_CASH_AND_EQUIVALENTS",
  "BS_CASH_DUE_FROM_BANKS":            "SNL_BS_CASH_DUE_FROM_BANKS",
  "BS_INTEREST_BEARING_BANK_DEPOSITS": "SNL_BS_DEPOSITS_AT_FI",
  "BS_INVESTMENT_SECURITIES_AFS":      "SNL_BS_AFS_SECURITIES",
  "BS_HELD_TO_MATURITY":               "SNL_BS_HTM_SECURITIES",
  "BS_INVESTMENT_SECURITIES":          "SNL_BS_AFS_SECURITIES",
  "BS_TRADING_ASSETS":                 "SNL_BS_TRADING_SECURITIES",
  "BS_NET_LOANS":                      "SNL_BS_TOTAL_NET_LOANS",
  "BS_GROSS_LOANS":                    "SNL_BS_GROSS_LOANS_HFI",
  "BS_LOAN_LOSS_RESERVE":              "SNL_BS_LOAN_LOSS_RESERVE",
  "BS_GOODWILL":                       "SNL_BS_GOODWILL",
  "BS_INTANGIBLES":                    "SNL_BS_OTHER_INTANGIBLES",
  "BS_OTHER_ASSETS":                   "SNL_BS_OTHER_ASSETS",
  "BS_PREMISES_EQUIPMENT":             "SNL_BS_FIXED_ASSETS",
  "BS_LOANS_HELD_FOR_SALE":            "SNL_BS_LOANS_HELD_FOR_SALE",
  "BS_DERIVATIVE_ASSETS":              "SNL_BS_OTHER_ASSETS",
  "BS_BROKERAGE_RECEIVABLES":          "SNL_BS_OTHER_ASSETS",
  "BS_SERVICING_ASSETS":               "SNL_BS_LOAN_SERVICING_RIGHTS",

  // ── Balance Sheet Liabilities ─────────────────────────────────────────
  "BS_TOTAL_DEPOSITS":                 "SNL_BS_TOTAL_DEPOSITS",
  "BS_DEMAND_DEPOSITS":                "SNL_BS_TOTAL_DEPOSITS",
  "BS_INTEREST_BEARING_DEPOSITS":      "SNL_BS_TOTAL_DEPOSITS",
  "BS_DOMESTIC_DEPOSITS":              "SNL_BS_TOTAL_DEPOSITS",
  "BS_TIME_DEPOSITS":                  "SNL_BS_TOTAL_DEPOSITS",
  "BS_TOTAL_LIABILITIES":              "SNL_BS_TOTAL_LIABILITIES",
  "BS_SHORT_TERM_BORROWINGS":          "SNL_BS_OTHER_LIABILITIES",
  "BS_LONG_TERM_DEBT":                 "SNL_BS_SENIOR_DEBT",
  "BS_FHLB_ADVANCES":                  "SNL_BS_FHLB_BORROWINGS",
  "BS_FED_FUNDS_PURCHASED":            "SNL_BS_OTHER_LIABILITIES",
  "BS_REPO_AGREEMENTS":                "SNL_BS_OTHER_LIABILITIES",
  "BS_COMMERCIAL_PAPER":               "SNL_BS_OTHER_LIABILITIES",
  "BS_SUBORDINATED_DEBT":              "SNL_BS_SUBORDINATED_DEBT",
  "BS_TRADING_LIABILITIES":            "SNL_BS_OTHER_LIABILITIES",
  "BS_DERIVATIVE_LIABILITIES":         "SNL_BS_OTHER_LIABILITIES",
  "BS_OTHER_LIABILITIES":              "SNL_BS_OTHER_LIABILITIES",
  "BS_ACCOUNTS_PAYABLE":               "SNL_BS_OTHER_LIABILITIES",

  // ── Balance Sheet Equity ──────────────────────────────────────────────
  "BS_TOTAL_EQUITY":                   "SNL_BS_TOTAL_EQUITY",
  "BS_COMMON_STOCK":                   "SNL_BS_COMMON_EQUITY",
  "BS_ADDITIONAL_PAID_IN":             "SNL_BS_COMMON_EQUITY",
  "BS_RETAINED_EARNINGS":              "SNL_BS_COMMON_EQUITY",
  "BS_AOCI":                           "SNL_BS_TOTAL_AOCI",
  "BS_TREASURY_STOCK":                 "SNL_BS_COMMON_EQUITY",

  // ── Income Statement ──────────────────────────────────────────────────
  "IS_NET_INTEREST_INCOME":            "SNL_IS_NET_INTEREST_INCOME",
  "IS_INTEREST_INCOME":                "SNL_IS_INTEREST_INCOME",
  "IS_INTEREST_EXPENSE":               "SNL_IS_INTEREST_EXPENSE",
  "IS_INTEREST_LOANS":                 "SNL_IS_INT_INCOME_LOANS",
  "IS_INTEREST_SECURITIES":            "SNL_IS_INT_INCOME_SECURITIES",
  "IS_INTEREST_TRADING":               "SNL_IS_INT_INCOME_OTHER_EARN",
  "IS_INTEREST_FED_FUNDS":             "SNL_IS_INT_INCOME_OTHER_EARN",
  "IS_INTEREST_OTHER":                 "SNL_IS_INT_INCOME_OTHER_EARN",
  "IS_INTEREST_DEPOSITS":              "SNL_IS_INT_EXP_TOTAL_DEPOSITS",
  "IS_INTEREST_BORROWINGS":            "SNL_IS_INT_EXP_DEBT",
  "IS_INTEREST_ST_BORROWINGS":         "SNL_IS_INT_EXP_DEBT",
  "IS_INTEREST_LT_DEBT":               "SNL_IS_INT_EXP_DEBT",
  "IS_INTEREST_FED_FUNDS_PURCHASED":   "SNL_IS_INT_EXP_DEBT",
  "IS_INTEREST_OTHER_EXPENSE":         "SNL_IS_INT_EXP_DEBT",

  "IS_NONINTEREST_INCOME":             "SNL_IS_TOTAL_NONINTEREST_INCOME",
  "IS_FEE_INCOME":                     "SNL_IS_SERVICE_CHARGES_DEPOSITS",
  "IS_INVESTMENT_BANKING":             "SNL_IS_INVESTMENT_BANKING",
  "IS_BROKERAGE_FEES":                 "SNL_IS_INVESTMENT_BANKING",
  "IS_TRADING_INCOME":                 "SNL_IS_TRADING_INCOME",
  "IS_ASSET_MANAGEMENT":               "SNL_IS_TRUST_REVENUE",
  "IS_CARD_FEES":                      "SNL_IS_LOAN_FEES",
  "IS_MORTGAGE_FEES":                  "SNL_IS_GAIN_SALE_LOANS",
  "IS_OTHER_NONINTEREST_INCOME":       "SNL_IS_OTHER_NONINTEREST_INCOME",

  "IS_TOTAL_REVENUE":                  "SNL_IS_TOTAL_NONINTEREST_INCOME",
  "IS_PRE_PROVISION_PROFIT":           "SNL_IS_PRE_PROVISION_NET_REVENUE",
  "IS_INCOME_BEFORE_TAX":              "SNL_IS_NET_INCOME_BEFORE_TAX",

  "IS_OPERATING_EXPENSE":              "SNL_IS_TOTAL_NONINTEREST_EXPENSE",
  "IS_COMPENSATION":                   "SNL_IS_COMPENSATION",
  "IS_OCCUPANCY":                      "SNL_IS_OCCUPANCY",
  "IS_PROFESSIONAL_SERVICES":          "SNL_IS_PROFESSIONAL_FEES",
  "IS_MARKETING":                      "SNL_IS_MARKETING",
  "IS_TECHNOLOGY":                     "SNL_IS_TECH_COMMS",
  "IS_FDIC_PREMIUM":                   "SNL_IS_OTHER_EXPENSE",
  "IS_AMORTIZATION":                   "SNL_IS_AMORT_INTANG_GOODWILL",
  "IS_OTHER_OPEX":                     "SNL_IS_OTHER_EXPENSE",

  "IS_PROVISION_EXPENSE":              "SNL_IS_PROVISION_LOAN_LOSSES",
  "IS_NET_INCOME":                     "SNL_IS_NET_INCOME",
  "IS_INCOME_TAX":                     "SNL_IS_PROVISION_FOR_TAXES",
  "IS_EPS":                            "SNL_IS_EPS_AFTER_EXTRA",
  "IS_EPS_DILUTED":                    "SNL_IS_EPS_AFTER_EXTRA",
  "IS_DPS":                            "SNL_IS_PREFERRED_DIVIDENDS",

  // ── Capital ───────────────────────────────────────────────────────────
  "CAP_RWA_TOTAL":                     "SNL_BS_TOTAL_ASSETS",
  "BS_CET1_CAPITAL":                   "SNL_BS_COMMON_EQUITY",
  "BS_TIER_1_CAPITAL":                 "SNL_BS_TOTAL_EQUITY",
  "BS_TIER_2_CAPITAL":                 "SNL_BS_TOTAL_EQUITY",
  "BS_TOTAL_CAPITAL":                  "SNL_BS_TOTAL_EQUITY",
}

export function oldToSnlCode(oldCode: string): string | null {
  return OLD_TO_SNL[oldCode] || null
}
