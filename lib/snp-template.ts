/**
 * S&P Capital IQ Standardized Template — Bank Financial Statements
 *
 * This template mirrors the S&P Capital IQ Excel output format for banks.
 * Each line item has a unique code, label, display order, category, and
 * calculation rules (which codes sum to this one, or how to derive it).
 *
 * Adapted from: WellsFargoAndCompanyNYSEWFC_Report_08-08-2026.xlsx
 */

// ═══════════════════════════════════════════════════════════════════════════
// Template Line Item Type
// ═══════════════════════════════════════════════════════════════════════════

export interface SnPTemplateItem {
  /** Unique code, e.g., "IS_INTEREST_INCOME_LOANS" */
  code: string
  /** Display label, exactly as S&P CIQ shows it */
  label: string
  /** Sort order within the statement */
  order: number
  /** "income_statement" | "balance_sheet" | "capital_adequacy" */
  statement_type: string
  /** Category header: "assets", "liabilities", "equity", "revenue", "expenses", etc. */
  category: string
  /** Indentation level (0 = top-level section, 1 = line item, 2 = sub-item) */
  indent: number
  /** True if this line is a calculated total/subtotal (not directly mappable from SEC) */
  is_calculated: boolean
  /** If calculated, which codes are summed (or a formula description) */
  components?: string[]
  /** If calculated, the formula type */
  formula?: "sum" | "subtract" | "ratio" | "derived"
  /** True if this is a per-share item (displayed differently) */
  is_per_share: boolean
  /** True if this is a section header (not a data row) */
  is_header: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// Income Statement — S&P Capital IQ Template
// ═══════════════════════════════════════════════════════════════════════════

export const SNP_INCOME_STATEMENT: SnPTemplateItem[] = [
  // ── Interest Income ────────────────────────────────────────────────────
  { code: "IS_INTEREST_INCOME_LOANS",      label: "Interest Income On Loans",        order: 10,  statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_INTEREST_INCOME_INVESTMENTS",label: "Interest Income On Investments",  order: 20,  statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_TOTAL_INTEREST_INCOME",      label: "Total Interest Income",           order: 30,  statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_INTEREST_INCOME_LOANS", "IS_INTEREST_INCOME_INVESTMENTS"], formula: "sum" },

  // ── Interest Expense ───────────────────────────────────────────────────
  { code: "IS_INTEREST_EXPENSE_DEPOSITS",  label: "Interest On Deposits",            order: 40,  statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_INTEREST_EXPENSE_BORROWINGS",label: "Total Interest On Borrowings",    order: 50,  statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_TOTAL_INTEREST_EXPENSE",     label: "Total Interest Expense",          order: 60,  statement_type: "income_statement", category: "expense", indent: 1, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_INTEREST_EXPENSE_DEPOSITS", "IS_INTEREST_EXPENSE_BORROWINGS"], formula: "sum" },

  // ── Net Interest Income ────────────────────────────────────────────────
  { code: "IS_NET_INTEREST_INCOME",         label: "Net Interest Income",             order: 70,  statement_type: "income_statement", category: "revenue", indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_TOTAL_INTEREST_INCOME", "IS_TOTAL_INTEREST_EXPENSE"], formula: "subtract" },

  // ── Non-Interest Income ────────────────────────────────────────────────
  { code: "IS_SERVICE_CHARGES_DEPOSITS",    label: "Service Charges On Deposits",     order: 80,  statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_TRUST_INCOME",                label: "Trust Income",                    order: 90,  statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_MORTGAGE_BANKING",            label: "Total Mortgage Banking Activities",order: 100, statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_TRADING_INCOME",              label: "Income From Trading Activities",  order: 110, statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_OTHER_NONINTEREST_INCOME",    label: "Total Other Non-Interest Income", order: 120, statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_TOTAL_NONINTEREST_INCOME",    label: "Total Non Interest Income",       order: 130, statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_SERVICE_CHARGES_DEPOSITS", "IS_TRUST_INCOME", "IS_MORTGAGE_BANKING", "IS_TRADING_INCOME", "IS_OTHER_NONINTEREST_INCOME"], formula: "sum" },

  // ── Revenue & Provision ────────────────────────────────────────────────
  { code: "IS_REVENUE_BEFORE_PROVISION",    label: "Revenue Before Loan Losses",      order: 140, statement_type: "income_statement", category: "revenue", indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_NET_INTEREST_INCOME", "IS_TOTAL_NONINTEREST_INCOME"], formula: "sum" },
  { code: "IS_PROVISION_LOAN_LOSSES",       label: "Provision For Loan Losses",       order: 150, statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_TOTAL_REVENUE",               label: "Total Revenue",                   order: 160, statement_type: "income_statement", category: "revenue", indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_REVENUE_BEFORE_PROVISION", "IS_PROVISION_LOAN_LOSSES"], formula: "subtract" },

  // ── Non-Interest Expense ───────────────────────────────────────────────
  { code: "IS_SALARIES_BENEFITS",           label: "Salaries and Other Empl. Benefits",order: 170, statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_OCCUPANCY_EXPENSE",           label: "Occupancy Expense",               order: 180, statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_SGNA_EXPENSE",                label: "Selling General & Admin Exp.",    order: 190, statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_OTHER_NONINTEREST_EXPENSE",   label: "Total Other Non-Interest Expense",order: 200, statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_TOTAL_NONINTEREST_EXPENSE",   label: "Total Non-Interest Expense",      order: 210, statement_type: "income_statement", category: "expense", indent: 1, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_SALARIES_BENEFITS", "IS_OCCUPANCY_EXPENSE", "IS_SGNA_EXPENSE", "IS_OTHER_NONINTEREST_EXPENSE"], formula: "sum" },

  // ── Earnings ───────────────────────────────────────────────────────────
  { code: "IS_EBT_EXCL_UNUSUAL",            label: "EBT Excl Unusual Items",          order: 220, statement_type: "income_statement", category: "earnings", indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_TOTAL_REVENUE", "IS_TOTAL_NONINTEREST_EXPENSE"], formula: "subtract" },
  { code: "IS_OTHER_UNUSUAL_ITEMS",         label: "Other Unusual Items",             order: 230, statement_type: "income_statement", category: "earnings", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_EBT_INCL_UNUSUAL",            label: "EBT Incl. Unusual Items",         order: 240, statement_type: "income_statement", category: "earnings", indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_EBT_EXCL_UNUSUAL", "IS_OTHER_UNUSUAL_ITEMS"], formula: "sum" },
  { code: "IS_INCOME_TAX_EXPENSE",          label: "Income Tax Expense",              order: 250, statement_type: "income_statement", category: "earnings", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_EARNINGS_CONT_OPS",           label: "Earnings from Cont. Ops.",        order: 260, statement_type: "income_statement", category: "earnings", indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_EBT_INCL_UNUSUAL", "IS_INCOME_TAX_EXPENSE"], formula: "subtract" },
  { code: "IS_NET_INCOME_COMPANY",          label: "Net Income to Company",           order: 270, statement_type: "income_statement", category: "earnings", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_MINORITY_INTEREST",           label: "Minority Int. in Earnings",       order: 280, statement_type: "income_statement", category: "earnings", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_NET_INCOME",                  label: "Net Income",                       order: 290, statement_type: "income_statement", category: "earnings", indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_NET_INCOME_COMPANY", "IS_MINORITY_INTEREST"], formula: "subtract" },
  { code: "IS_PREF_DIVIDENDS",              label: "Pref. Dividends and Other Adj.",  order: 300, statement_type: "income_statement", category: "earnings", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_NI_COMMON_INCL_EXTRA",        label: "NI to Common Incl Extra Items",   order: 310, statement_type: "income_statement", category: "earnings", indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_NET_INCOME", "IS_PREF_DIVIDENDS"], formula: "subtract" },
  { code: "IS_NI_COMMON_EXCL_EXTRA",        label: "NI to Common Excl. Extra Items",  order: 320, statement_type: "income_statement", category: "earnings", indent: 0, is_calculated: false, is_per_share: false, is_header: false },

  // ── Per Share Items ────────────────────────────────────────────────────
  { code: "IS_PER_SHARE_HEADER",            label: "Per Share Items ($)",             order: 330, statement_type: "income_statement", category: "per_share", indent: 0, is_calculated: false, is_per_share: false, is_header: true },
  { code: "IS_BASIC_EPS",                   label: "Basic EPS",                        order: 340, statement_type: "income_statement", category: "per_share", indent: 1, is_calculated: false, is_per_share: true,  is_header: false },
  { code: "IS_BASIC_EPS_EXCL_EXTRA",        label: "Basic EPS Excl. Extra Items",      order: 350, statement_type: "income_statement", category: "per_share", indent: 1, is_calculated: false, is_per_share: true,  is_header: false },
  { code: "IS_DILUTED_EPS_INCL_EXTRA",      label: "Diluted EPS Incl. Extra Items",    order: 360, statement_type: "income_statement", category: "per_share", indent: 1, is_calculated: false, is_per_share: true,  is_header: false },
  { code: "IS_DILUTED_EPS_EXCL_EXTRA",      label: "Diluted EPS Excl. Extra Items",    order: 370, statement_type: "income_statement", category: "per_share", indent: 1, is_calculated: false, is_per_share: true,  is_header: false },
  { code: "IS_NORMALIZED_BASIC_EPS",        label: "Normalized Basic EPS",             order: 380, statement_type: "income_statement", category: "per_share", indent: 1, is_calculated: false, is_per_share: true,  is_header: false },
  { code: "IS_NORMALIZED_DILUTED_EPS",      label: "Normalized Diluted EPS",           order: 390, statement_type: "income_statement", category: "per_share", indent: 1, is_calculated: false, is_per_share: true,  is_header: false },
  { code: "IS_DIVIDENDS_PER_SHARE",         label: "Dividends per Share",              order: 400, statement_type: "income_statement", category: "per_share", indent: 1, is_calculated: false, is_per_share: true,  is_header: false },
  { code: "IS_PAYOUT_RATIO",                label: "Payout Ratio (%)",                order: 410, statement_type: "income_statement", category: "per_share", indent: 1, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_DIVIDENDS_PER_SHARE", "IS_BASIC_EPS"], formula: "ratio" },

  // ── Supplemental Items ─────────────────────────────────────────────────
  { code: "IS_SUPPLEMENTAL_HEADER",         label: "Supplemental Items ($M)",          order: 420, statement_type: "income_statement", category: "supplemental", indent: 0, is_calculated: false, is_per_share: false, is_header: true },
  { code: "IS_EFFECTIVE_TAX_RATE",          label: "Effective Tax Rate (%)",           order: 430, statement_type: "income_statement", category: "supplemental", indent: 1, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_INCOME_TAX_EXPENSE", "IS_EBT_INCL_UNUSUAL"], formula: "ratio" },
  { code: "IS_CURRENT_DOMESTIC_TAXES",      label: "Current Domestic Taxes",           order: 440, statement_type: "income_statement", category: "supplemental", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_CURRENT_FOREIGN_TAXES",       label: "Current Foreign Taxes",            order: 450, statement_type: "income_statement", category: "supplemental", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_TOTAL_CURRENT_TAXES",         label: "Total Current Taxes",              order: 460, statement_type: "income_statement", category: "supplemental", indent: 1, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_CURRENT_DOMESTIC_TAXES", "IS_CURRENT_FOREIGN_TAXES"], formula: "sum" },
  { code: "IS_DEFERRED_DOMESTIC_TAXES",     label: "Deferred Domestic Taxes",          order: 470, statement_type: "income_statement", category: "supplemental", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_DEFERRED_FOREIGN_TAXES",      label: "Deferred Foreign Taxes",           order: 480, statement_type: "income_statement", category: "supplemental", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_TOTAL_DEFERRED_TAXES",        label: "Total Deferred Taxes",             order: 490, statement_type: "income_statement", category: "supplemental", indent: 1, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_DEFERRED_DOMESTIC_TAXES", "IS_DEFERRED_FOREIGN_TAXES"], formula: "sum" },
  { code: "IS_NORMALIZED_NET_INCOME",       label: "Normalized Net Income",            order: 500, statement_type: "income_statement", category: "supplemental", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_NONCASH_PENSION_EXPENSE",     label: "Non-Cash Pension Expense",         order: 510, statement_type: "income_statement", category: "supplemental", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_STOCK_BASED_COMP_BEFORE_TAX", label: "Stock Based Comp. Exp., Before Tax",order: 520, statement_type: "income_statement", category: "supplemental", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_STOCK_BASED_COMP_TAX_EFFECT", label: "Stock Based Comp. Exp. Tax Effect",order: 530, statement_type: "income_statement", category: "supplemental", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "IS_STOCK_BASED_COMP_AFTER_TAX",  label: "Stock Based Comp. Exp., After Tax",order: 540, statement_type: "income_statement", category: "supplemental", indent: 1, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["IS_STOCK_BASED_COMP_BEFORE_TAX", "IS_STOCK_BASED_COMP_TAX_EFFECT"], formula: "subtract" },
]

// ═══════════════════════════════════════════════════════════════════════════
// Balance Sheet — S&P Capital IQ Template
// ═══════════════════════════════════════════════════════════════════════════

export const SNP_BALANCE_SHEET: SnPTemplateItem[] = [
  // ── ASSETS ─────────────────────────────────────────────────────────────
  { code: "BS_ASSETS_HEADER",               label: "Assets ($M)",                          order: 10,  statement_type: "balance_sheet", category: "header",  indent: 0, is_calculated: false, is_per_share: false, is_header: true },
  { code: "BS_CASH_AND_EQUIVALENTS",        label: "Cash and Equivalents",                 order: 20,  statement_type: "balance_sheet", category: "assets",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_INVESTMENT_SECURITIES",       label: "Investment Securities",                order: 30,  statement_type: "balance_sheet", category: "assets",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_TRADING_ASSET_SECURITIES",    label: "Trading Asset Securities",             order: 40,  statement_type: "balance_sheet", category: "assets",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_MORTGAGE_BACKED_SECURITIES",  label: "Mortgage Backed Securities",           order: 50,  statement_type: "balance_sheet", category: "assets",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_TOTAL_INVESTMENTS",           label: "Total Investments",                    order: 60,  statement_type: "balance_sheet", category: "assets",  indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["BS_INVESTMENT_SECURITIES", "BS_TRADING_ASSET_SECURITIES", "BS_MORTGAGE_BACKED_SECURITIES"], formula: "sum" },
  { code: "BS_GROSS_LOANS",                 label: "Gross Loans",                          order: 70,  statement_type: "balance_sheet", category: "assets",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_ALLOWANCE_LOAN_LOSSES",       label: "Allowance For Loan Losses",            order: 80,  statement_type: "balance_sheet", category: "assets",  indent: 2, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_OTHER_ADJ_GROSS_LOANS",       label: "Other Adj. to Gross Loans",            order: 90,  statement_type: "balance_sheet", category: "assets",  indent: 2, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_NET_LOANS",                   label: "Net Loans",                            order: 100, statement_type: "balance_sheet", category: "assets",  indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["BS_GROSS_LOANS", "BS_ALLOWANCE_LOAN_LOSSES", "BS_OTHER_ADJ_GROSS_LOANS"], formula: "subtract" },
  { code: "BS_NET_PPE",                     label: "Net Property, Plant & Equipment",       order: 110, statement_type: "balance_sheet", category: "assets",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_GOODWILL",                    label: "Goodwill",                              order: 120, statement_type: "balance_sheet", category: "assets",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_INVESTMENT_IN_FHLB",          label: "Investment in FHLB",                    order: 130, statement_type: "balance_sheet", category: "assets",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_LOANS_HELD_FOR_SALE",         label: "Loans Held For Sale",                   order: 140, statement_type: "balance_sheet", category: "assets",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_ACCRUED_INTEREST_RECEIVABLE", label: "Accrued Interest Receivable",           order: 150, statement_type: "balance_sheet", category: "assets",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_OTHER_RECEIVABLES",           label: "Other Receivables",                     order: 160, statement_type: "balance_sheet", category: "assets",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_RESTRICTED_CASH",             label: "Restricted Cash",                       order: 170, statement_type: "balance_sheet", category: "assets",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_OTHER_CURRENT_ASSETS",        label: "Other Current Assets",                  order: 180, statement_type: "balance_sheet", category: "assets",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_OREO_FORECLOSED",             label: "Other Real Estate Owned And Foreclosed",order: 190, statement_type: "balance_sheet", category: "assets",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_OTHER_LONG_TERM_ASSETS",      label: "Other Long-term Assets",                order: 200, statement_type: "balance_sheet", category: "assets",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_TOTAL_ASSETS",                label: "Total Assets",                          order: 210, statement_type: "balance_sheet", category: "assets",  indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: [], formula: "derived" },

  // ── LIABILITIES ────────────────────────────────────────────────────────
  { code: "BS_LIABILITIES_HEADER",          label: "Liabilities ($M)",                     order: 220, statement_type: "balance_sheet", category: "header",  indent: 0, is_calculated: false, is_per_share: false, is_header: true },
  { code: "BS_ACCRUED_EXPENSES",            label: "Accrued Exp.",                         order: 230, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_INTEREST_BEARING_DEPOSITS",   label: "Interest Bearing Deposits",            order: 240, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_INSTITUTIONAL_DEPOSITS",      label: "Institutional Deposits",               order: 250, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_NONINTEREST_BEARING_DEPOSITS",label: "Non-Interest Bearing Deposits",        order: 260, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_TOTAL_DEPOSITS",              label: "Total Deposits",                       order: 270, statement_type: "balance_sheet", category: "liabilities", indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["BS_INTEREST_BEARING_DEPOSITS", "BS_INSTITUTIONAL_DEPOSITS", "BS_NONINTEREST_BEARING_DEPOSITS"], formula: "sum" },
  { code: "BS_SHORT_TERM_BORROWINGS",       label: "Short-term Borrowings",                order: 280, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_CURRENT_PORTION_LT_DEBT",     label: "Curr. Port. of LT Debt",              order: 290, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_CURRENT_PORTION_LEASES",      label: "Current Portion of Leases",            order: 300, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_LONG_TERM_DEBT",              label: "Long-term Debt",                       order: 310, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_FHLB_DEBT_LT",                label: "Federal Home Loan Bank Debt - LT",     order: 320, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_LONG_TERM_LEASES",            label: "Long-term Leases",                     order: 330, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_TRUST_PREF_SECURITIES",       label: "Trust Pref. Securities",               order: 340, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_OTHER_CURRENT_LIABILITIES",   label: "Other Current Liabilities",            order: 350, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_DEF_TAX_LIABILITY_NONCURR",   label: "Def. Tax Liability, Non-Curr.",        order: 360, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_OTHER_NONCURRENT_LIABILITIES",label: "Other Non-Current Liabilities",        order: 370, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_TOTAL_LIABILITIES",           label: "Total Liabilities",                    order: 380, statement_type: "balance_sheet", category: "liabilities", indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: [], formula: "derived" },

  // ── EQUITY ─────────────────────────────────────────────────────────────
  { code: "BS_EQUITY_HEADER",               label: "Equity ($M)",                          order: 390, statement_type: "balance_sheet", category: "header",  indent: 0, is_calculated: false, is_per_share: false, is_header: true },
  { code: "BS_PREF_STOCK_REDEEMABLE",       label: "Pref. Stock, Redeemable",              order: 400, statement_type: "balance_sheet", category: "equity",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_PREF_STOCK_NONREDEEMABLE",    label: "Pref. Stock, Non-Redeem.",             order: 410, statement_type: "balance_sheet", category: "equity",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_PREF_STOCK_CONVERTIBLE",      label: "Pref. Stock, Convertible",             order: 420, statement_type: "balance_sheet", category: "equity",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_TOTAL_PREFERRED_EQUITY",      label: "Total Preferred Equity",               order: 430, statement_type: "balance_sheet", category: "equity",  indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["BS_PREF_STOCK_REDEEMABLE", "BS_PREF_STOCK_NONREDEEMABLE", "BS_PREF_STOCK_CONVERTIBLE"], formula: "sum" },
  { code: "BS_COMMON_STOCK",                label: "Common Stock",                         order: 440, statement_type: "balance_sheet", category: "equity",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_ADDITIONAL_PAID_IN_CAPITAL",  label: "Additional Paid In Capital",           order: 450, statement_type: "balance_sheet", category: "equity",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_RETAINED_EARNINGS",           label: "Retained Earnings",                    order: 460, statement_type: "balance_sheet", category: "equity",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_TREASURY_STOCK",              label: "Treasury Stock",                       order: 470, statement_type: "balance_sheet", category: "equity",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_COMPREHENSIVE_INCOME_OTHER",  label: "Comprehensive Inc. and Other",         order: 480, statement_type: "balance_sheet", category: "equity",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_TOTAL_COMMON_EQUITY",         label: "Total Common Equity",                  order: 490, statement_type: "balance_sheet", category: "equity",  indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["BS_COMMON_STOCK", "BS_ADDITIONAL_PAID_IN_CAPITAL", "BS_RETAINED_EARNINGS", "BS_TREASURY_STOCK", "BS_COMPREHENSIVE_INCOME_OTHER"], formula: "sum" },
  { code: "BS_MINORITY_INTEREST",           label: "Total Minority Interest",              order: 500, statement_type: "balance_sheet", category: "equity",  indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_TOTAL_EQUITY",                label: "Total Equity",                         order: 510, statement_type: "balance_sheet", category: "equity",  indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["BS_TOTAL_PREFERRED_EQUITY", "BS_TOTAL_COMMON_EQUITY", "BS_MINORITY_INTEREST"], formula: "sum" },
  { code: "BS_TOTAL_LIABILITIES_AND_EQUITY",label: "Total Liabilities And Equity",         order: 520, statement_type: "balance_sheet", category: "equity",  indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["BS_TOTAL_LIABILITIES", "BS_TOTAL_EQUITY"], formula: "sum" },

  // ── Supplemental Items ─────────────────────────────────────────────────
  { code: "BS_SUPPLEMENTAL_HEADER",         label: "Supplemental Items ($)",              order: 530, statement_type: "balance_sheet", category: "supplemental", indent: 0, is_calculated: false, is_per_share: false, is_header: true },
  { code: "BS_BOOK_VALUE_PER_SHARE",        label: "Book Value per Share",                 order: 540, statement_type: "balance_sheet", category: "supplemental", indent: 1, is_calculated: false, is_per_share: true,  is_header: false },
  { code: "BS_TANGIBLE_BOOK_VALUE",         label: "Tangible Book Value",                  order: 550, statement_type: "balance_sheet", category: "supplemental", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_TANGIBLE_BOOK_VALUE_PER_SHARE",label:"Tangible Book Value per Share",        order: 560, statement_type: "balance_sheet", category: "supplemental", indent: 1, is_calculated: false, is_per_share: true,  is_header: false },
  { code: "BS_AVERAGE_ASSETS",              label: "Average Assets",                       order: 570, statement_type: "balance_sheet", category: "supplemental", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_AVERAGE_LOANS",               label: "Average Loans",                        order: 580, statement_type: "balance_sheet", category: "supplemental", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_TOTAL_DEBT",                  label: "Total Debt",                           order: 590, statement_type: "balance_sheet", category: "supplemental", indent: 1, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["BS_SHORT_TERM_BORROWINGS", "BS_CURRENT_PORTION_LT_DEBT", "BS_LONG_TERM_DEBT", "BS_FHLB_DEBT_LT"], formula: "sum" },
  { code: "BS_NET_DEBT",                    label: "Net Debt",                             order: 600, statement_type: "balance_sheet", category: "supplemental", indent: 1, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["BS_TOTAL_DEBT", "BS_CASH_AND_EQUIVALENTS"], formula: "subtract" },
  { code: "BS_MORTGAGE_SERVICING_RIGHTS",   label: "Mortgage Servicing Rights",            order: 610, statement_type: "balance_sheet", category: "supplemental", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_RISK_WEIGHTED_ASSETS",        label: "Risk Adjusted Assets",                 order: 620, statement_type: "balance_sheet", category: "supplemental", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_AVG_INTEREST_EARNING_ASSETS", label: "Avg. Interest Earning Assets",         order: 630, statement_type: "balance_sheet", category: "supplemental", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_AVG_INTEREST_BEARING_LIAB",   label: "Avg. Interest Bearing Liabilities",    order: 640, statement_type: "balance_sheet", category: "supplemental", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_FULL_TIME_EMPLOYEES",         label: "Full Time Employees (actual)",         order: 650, statement_type: "balance_sheet", category: "supplemental", indent: 1, is_calculated: false, is_per_share: false, is_header: false },

  // ── Fair Value Measurements ────────────────────────────────────────────
  { code: "BS_FV_LEVEL1_ASSETS",            label: "Level 1 Assets - Quoted Prices",       order: 660, statement_type: "balance_sheet", category: "fair_value", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_FV_LEVEL2_ASSETS",            label: "Level 2 Assets - Observable Prices",   order: 670, statement_type: "balance_sheet", category: "fair_value", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_FV_LEVEL3_ASSETS",            label: "Level 3 Assets - Unobservable Prices", order: 680, statement_type: "balance_sheet", category: "fair_value", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_FV_NETTING_ADJ_ASSETS",       label: "Netting and Other Adjustments to Assets",order:690, statement_type: "balance_sheet", category: "fair_value", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_FAIR_VALUE_OF_ASSETS",         label: "Fair Value of Assets",                order: 700, statement_type: "balance_sheet", category: "fair_value", indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["BS_FV_LEVEL1_ASSETS", "BS_FV_LEVEL2_ASSETS", "BS_FV_LEVEL3_ASSETS", "BS_FV_NETTING_ADJ_ASSETS"], formula: "sum" },
  { code: "BS_FV_LEVEL1_LIABILITIES",       label: "Level 1 Liabilities - Quoted Prices",  order: 710, statement_type: "balance_sheet", category: "fair_value", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_FV_LEVEL2_LIABILITIES",       label: "Level 2 Liabilities - Observable Prices",order:720, statement_type: "balance_sheet", category: "fair_value", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_FV_LEVEL3_LIABILITIES",       label: "Level 3 Liabilities - Unobservable Prices",order:730,statement_type: "balance_sheet", category: "fair_value", indent: 1, is_calculated: false, is_per_share: false, is_header: false },
  { code: "BS_FV_NETTING_ADJ_LIABILITIES",  label: "Netting and Other Adjustments to Liabilities",order:740,statement_type:"balance_sheet",category:"fair_value",indent:1,is_calculated:false,is_per_share:false,is_header:false},
  { code: "BS_FAIR_VALUE_OF_LIABILITIES",   label: "Fair Value of Liabilities",            order: 750, statement_type: "balance_sheet", category: "fair_value", indent: 0, is_calculated: true,  is_per_share: false, is_header: false,
    components: ["BS_FV_LEVEL1_LIABILITIES", "BS_FV_LEVEL2_LIABILITIES", "BS_FV_LEVEL3_LIABILITIES", "BS_FV_NETTING_ADJ_LIABILITIES"], formula: "sum" },
]

// ═══════════════════════════════════════════════════════════════════════════
// Full combined template (for lookup)
// ═══════════════════════════════════════════════════════════════════════════

export const SNP_ALL_TEMPLATES: Record<string, SnPTemplateItem[]> = {
  income_statement: SNP_INCOME_STATEMENT,
  balance_sheet: SNP_BALANCE_SHEET,
}

/** Get all mappable (non-calculated) codes for a statement type */
export function getSnpMappableCodes(statementType: string): SnPTemplateItem[] {
  const templates = SNP_ALL_TEMPLATES[statementType] || []
  return templates.filter(t => !t.is_calculated && !t.is_header)
}

/** Get all template items for a statement type */
export function getSnpTemplate(statementType: string): SnPTemplateItem[] {
  return SNP_ALL_TEMPLATES[statementType] || []
}
