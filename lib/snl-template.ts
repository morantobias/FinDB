/**
 * SNL Financial Standardized Template — Bank Financial Statements
 *
 * Adapted from: Wells Fargo SNL template.xlsx
 * Source: SNL Financial (S&P Global Market Intelligence)
 */

export interface SnlTemplateItem {
  code: string
  label: string
  order: number
  statement_type: "income_statement" | "balance_sheet"
  category: string
  indent: number          // 0 = section, 1 = line item, 2 = sub-item
  is_calculated: boolean
  components?: string[]   // codes that sum/subtract to this
  formula?: "sum" | "subtract" | "ratio"
  is_header: boolean
  is_per_share: boolean
  is_memo: boolean        // Memo item (supplemental)
  is_average: boolean     // Average balance item
}

// ═══════════════════════════════════════════════════════════════════════════
// SNL Income Statement
// ═══════════════════════════════════════════════════════════════════════════

export const SNL_INCOME_STATEMENT: SnlTemplateItem[] = [
  // ── Interest Income / Expense ──────────────────────────────────────────
  { code: "SNL_IS_INTEREST_INCOME",         label: "Interest Income",                   order: 10,  statement_type: "income_statement", category: "revenue", indent: 0, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_INTEREST_EXPENSE",        label: "Interest Expense",                  order: 20,  statement_type: "income_statement", category: "expense", indent: 0, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_NET_INTEREST_INCOME",     label: "Net Interest Income",               order: 30,  statement_type: "income_statement", category: "revenue", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_IS_INTEREST_INCOME", "SNL_IS_INTEREST_EXPENSE"], formula: "subtract" },
  { code: "SNL_IS_FTE_NET_INTEREST_INCOME", label: "FTE Net Interest Income",           order: 40,  statement_type: "income_statement", category: "revenue", indent: 0, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },

  // ── Provisions ─────────────────────────────────────────────────────────
  { code: "SNL_IS_PROVISION_LOAN_LOSSES",   label: "Provision for Loan Losses",          order: 50,  statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_PROVISION_UNFUNDED",      label: "Provision for Unfunded & Other Financial Losses", order: 60, statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_PROVISION_CREDIT_LOSSES", label: "Provision for Credit Losses",        order: 70,  statement_type: "income_statement", category: "expense", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_IS_PROVISION_LOAN_LOSSES", "SNL_IS_PROVISION_UNFUNDED"], formula: "sum" },

  // ── Noninterest Income ─────────────────────────────────────────────────
  { code: "SNL_IS_TRADING_INCOME",          label: "Trading Account Income",             order: 80,  statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_FX_INCOME",               label: "Foreign Exchange Income",            order: 90,  statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_TRUST_REVENUE",           label: "Trust Revenue",                      order: 100, statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_SERVICE_CHARGES_DEPOSITS",label: "Service Charges on Deposits",        order: 110, statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_GAIN_SALE_LOANS",         label: "Gain on Sale of Loans",              order: 120, statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_LOAN_FEES",               label: "Loan Fees & Charges",                order: 130, statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_BOLI_REVENUE",            label: "Bank-owned Life Insurance Revenue",  order: 140, statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_INSURANCE_REVENUE",       label: "Insurance Revenue",                  order: 150, statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_INVESTMENT_BANKING",      label: "Investment Banking & Brokerage",     order: 160, statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_OTHER_NONINTEREST_INCOME",label: "Other Noninterest Income",           order: 170, statement_type: "income_statement", category: "revenue", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_TOTAL_NONINTEREST_INCOME",label: "Total Noninterest Income",           order: 180, statement_type: "income_statement", category: "revenue", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_IS_TRADING_INCOME","SNL_IS_FX_INCOME","SNL_IS_TRUST_REVENUE","SNL_IS_SERVICE_CHARGES_DEPOSITS","SNL_IS_GAIN_SALE_LOANS","SNL_IS_LOAN_FEES","SNL_IS_BOLI_REVENUE","SNL_IS_INSURANCE_REVENUE","SNL_IS_INVESTMENT_BANKING","SNL_IS_OTHER_NONINTEREST_INCOME"], formula: "sum" },

  // ── Additional Revenue Items ───────────────────────────────────────────
  { code: "SNL_IS_REALIZED_GAIN_SECURITIES",label: "Realized Gain on Securities",        order: 190, statement_type: "income_statement", category: "revenue", indent: 0, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_NONRECURRING_REVENUE",    label: "Nonrecurring Revenue",               order: 200, statement_type: "income_statement", category: "revenue", indent: 0, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },

  // ── Noninterest Expense ────────────────────────────────────────────────
  { code: "SNL_IS_COMPENSATION",            label: "Compensation & Benefits",            order: 210, statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_OCCUPANCY",               label: "Occupancy & Equipment",              order: 220, statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_MARKETING",               label: "Marketing and Promotion Expense",    order: 230, statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_PROFESSIONAL_FEES",       label: "Professional Fees",                  order: 240, statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_TECH_COMMS",              label: "Tech & Communications Expense",      order: 250, statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_AMORT_INTANG_GOODWILL",   label: "Amrt of Intang & Goodwill Impair",  order: 260, statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_FORECLOSURE_REPO",        label: "Foreclosure & Repo",                 order: 270, statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_OTHER_EXPENSE",           label: "Other Expense",                      order: 280, statement_type: "income_statement", category: "expense", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_TOTAL_NONINTEREST_EXPENSE",label:"Total Noninterest Expense",          order: 290, statement_type: "income_statement", category: "expense", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_IS_COMPENSATION","SNL_IS_OCCUPANCY","SNL_IS_MARKETING","SNL_IS_PROFESSIONAL_FEES","SNL_IS_TECH_COMMS","SNL_IS_AMORT_INTANG_GOODWILL","SNL_IS_FORECLOSURE_REPO","SNL_IS_OTHER_EXPENSE"], formula: "sum" },

  // ── Nonrecurring Expense ───────────────────────────────────────────────
  { code: "SNL_IS_NONRECURRING_EXPENSE",    label: "Nonrecurring Expense",               order: 300, statement_type: "income_statement", category: "expense", indent: 0, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },

  // ── Earnings ───────────────────────────────────────────────────────────
  { code: "SNL_IS_PRE_PROVISION_NET_REVENUE",label:"Pre-Provision Net Revenue",          order: 310, statement_type: "income_statement", category: "earnings", indent: 0, is_calculated: true, is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_IS_NET_INTEREST_INCOME","SNL_IS_TOTAL_NONINTEREST_INCOME","SNL_IS_TOTAL_NONINTEREST_EXPENSE"], formula: "subtract" },
  { code: "SNL_IS_NON_FTE_PRE_PROVISION",   label: "Non-FTE Pre-Provision Net Revenue",  order: 320, statement_type: "income_statement", category: "earnings", indent: 0, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_NET_INCOME_BEFORE_TAX",   label: "Net Income before Taxes",            order: 330, statement_type: "income_statement", category: "earnings", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_IS_PRE_PROVISION_NET_REVENUE","SNL_IS_PROVISION_CREDIT_LOSSES","SNL_IS_REALIZED_GAIN_SECURITIES","SNL_IS_NONRECURRING_REVENUE","SNL_IS_NONRECURRING_EXPENSE"], formula: "subtract" },
  { code: "SNL_IS_PROVISION_FOR_TAXES",     label: "Provision for Taxes",                order: 340, statement_type: "income_statement", category: "earnings", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_EFFECTIVE_TAX_RATE",      label: "Effective Tax Rate (%)",             order: 350, statement_type: "income_statement", category: "earnings", indent: 1, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_IS_PROVISION_FOR_TAXES","SNL_IS_NET_INCOME_BEFORE_TAX"], formula: "ratio" },
  { code: "SNL_IS_MINORITY_INTEREST",       label: "Min Int & Oth after-tax Items",      order: 360, statement_type: "income_statement", category: "earnings", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_EXTRAORDINARY_ITEMS",     label: "Extraordinary Items",                order: 370, statement_type: "income_statement", category: "earnings", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_NET_INCOME",              label: "Net Income",                          order: 380, statement_type: "income_statement", category: "earnings", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_IS_NET_INCOME_BEFORE_TAX","SNL_IS_PROVISION_FOR_TAXES","SNL_IS_MINORITY_INTEREST","SNL_IS_EXTRAORDINARY_ITEMS"], formula: "subtract" },
  { code: "SNL_IS_NI_NONCONTROLLING",       label: "Net Income Attributable to Noncontrolling Int", order: 390, statement_type: "income_statement", category: "earnings", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_NI_PARENT",               label: "Net Income Attributable to Parent",   order: 400, statement_type: "income_statement", category: "earnings", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_IS_NET_INCOME","SNL_IS_NI_NONCONTROLLING"], formula: "subtract" },
  { code: "SNL_IS_PREFERRED_DIVIDENDS",     label: "Preferred Dividends",                 order: 410, statement_type: "income_statement", category: "earnings", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_NI_AVAIL_COMMON",         label: "Net Income Avail to Common",          order: 420, statement_type: "income_statement", category: "earnings", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_IS_NI_PARENT","SNL_IS_PREFERRED_DIVIDENDS"], formula: "subtract" },
  { code: "SNL_IS_NI_DILUTED_EPS",          label: "Net Income for Diluted EPS",          order: 430, statement_type: "income_statement", category: "earnings", indent: 0, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },

  // ── Per Share ──────────────────────────────────────────────────────────
  { code: "SNL_IS_EPS_AFTER_EXTRA",         label: "EPS after Extra ($)",                 order: 440, statement_type: "income_statement", category: "per_share", indent: 0, is_calculated: false, is_header: false, is_per_share: true,  is_memo: false, is_average: false },
  { code: "SNL_IS_PRE_PROVISION_EPS",       label: "Pre-Provision Earnings per Share ($)",order: 450, statement_type: "income_statement", category: "per_share", indent: 0, is_calculated: false, is_header: false, is_per_share: true,  is_memo: false, is_average: false },

  // ── Comprehensive Income ───────────────────────────────────────────────
  { code: "SNL_IS_COMPREHENSIVE_INCOME",    label: "Comprehensive Income",                order: 460, statement_type: "income_statement", category: "comprehensive", indent: 0, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_NET_INCOME_CI",           label: "Net Income",                           order: 470, statement_type: "income_statement", category: "comprehensive", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_PREF_DIV_ADJ_CI",         label: "Preferred Dividend Adjustment to Comprehensive Inc", order: 480, statement_type: "income_statement", category: "comprehensive", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_TOTAL_OTHER_CI",          label: "Total Other Comprehensive Income",    order: 490, statement_type: "income_statement", category: "comprehensive", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_COMPREHENSIVE_INCOME_TOTAL",label:"Comprehensive Income",               order: 500, statement_type: "income_statement", category: "comprehensive", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_IS_NET_INCOME_CI","SNL_IS_PREF_DIV_ADJ_CI","SNL_IS_TOTAL_OTHER_CI"], formula: "sum" },

  // ── Interest Income/Expense Detail ─────────────────────────────────────
  { code: "SNL_IS_INT_INCOME_LOANS",        label: "Interest Earned on Loans",            order: 510, statement_type: "income_statement", category: "interest_detail", indent: 0, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_INT_INCOME_SECURITIES",   label: "Int Inc: Securities",                 order: 520, statement_type: "income_statement", category: "interest_detail", indent: 0, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_INT_INCOME_OTHER_EARN",   label: "Int Inc: Other Earn Assets",          order: 530, statement_type: "income_statement", category: "interest_detail", indent: 0, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_INT_INCOME_SECS_OTHER",   label: "Int Inc: Secs & Oth Earn Assets",     order: 540, statement_type: "income_statement", category: "interest_detail", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_IS_INT_INCOME_SECURITIES","SNL_IS_INT_INCOME_OTHER_EARN"], formula: "sum" },
  { code: "SNL_IS_INT_INCOME_TOTAL_EARN",   label: "Int Inc: Total Earn Assets",          order: 550, statement_type: "income_statement", category: "interest_detail", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_IS_INT_INCOME_LOANS","SNL_IS_INT_INCOME_SECS_OTHER"], formula: "sum" },
  { code: "SNL_IS_INT_EXP_CDS",             label: "Int Exp: CDs",                        order: 560, statement_type: "income_statement", category: "interest_detail", indent: 0, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_INT_EXP_OTHER_DEPOSITS",  label: "Int Exp: Other Deposits",             order: 570, statement_type: "income_statement", category: "interest_detail", indent: 0, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_INT_EXP_TOTAL_DEPOSITS",  label: "Int Exp: Total Deposits",             order: 580, statement_type: "income_statement", category: "interest_detail", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_IS_INT_EXP_CDS","SNL_IS_INT_EXP_OTHER_DEPOSITS"], formula: "sum" },
  { code: "SNL_IS_INT_EXP_DEBT",            label: "Int Exp: Debt",                       order: 590, statement_type: "income_statement", category: "interest_detail", indent: 0, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_IS_INT_EXP_TOTAL_LIAB",      label: "Int Exp: Total Int-bearing Liab",     order: 600, statement_type: "income_statement", category: "interest_detail", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_IS_INT_EXP_TOTAL_DEPOSITS","SNL_IS_INT_EXP_DEBT"], formula: "sum" },
]

// ═══════════════════════════════════════════════════════════════════════════
// SNL Balance Sheet
// ═══════════════════════════════════════════════════════════════════════════

export const SNL_BALANCE_SHEET: SnlTemplateItem[] = [
  // ── ASSETS ─────────────────────────────────────────────────────────────
  { code: "SNL_BS_CASH_DUE_FROM_BANKS",     label: "Cash and Due from Banks",            order: 10,  statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_FED_FUNDS_SOLD",          label: "Fed Funds Sold",                     order: 20,  statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_DEPOSITS_AT_FI",          label: "Deposits at Financial Institutions",  order: 30,  statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_SECURITIES_PURCHASED_RESELL",label:"Securities Purchased, to Resell",  order: 40,  statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_OTHER_CASH_EQUIV",        label: "Other Cash & Cash Equivalents",      order: 50,  statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_CASH_AND_EQUIVALENTS",    label: "Cash and Cash Equivalents",          order: 60,  statement_type: "balance_sheet", category: "assets", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_BS_CASH_DUE_FROM_BANKS","SNL_BS_FED_FUNDS_SOLD","SNL_BS_DEPOSITS_AT_FI","SNL_BS_SECURITIES_PURCHASED_RESELL","SNL_BS_OTHER_CASH_EQUIV"], formula: "sum" },
  
  { code: "SNL_BS_TRADING_SECURITIES",      label: "Trading Account Securities",         order: 70,  statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_AFS_SECURITIES",          label: "Available for Sale Securities",      order: 80,  statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_HTM_SECURITIES",          label: "Held to Maturity Securities",        order: 90,  statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_OTHER_SECURITIES",        label: "Other Securities",                   order: 100, statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_TOTAL_CASH_SECURITIES",   label: "Total Cash & Securities",            order: 110, statement_type: "balance_sheet", category: "assets", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_BS_CASH_AND_EQUIVALENTS","SNL_BS_TRADING_SECURITIES","SNL_BS_AFS_SECURITIES","SNL_BS_HTM_SECURITIES","SNL_BS_OTHER_SECURITIES"], formula: "sum" },

  { code: "SNL_BS_GROSS_LOANS_HFI",         label: "Gross Loans Held for Investment",    order: 120, statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_LOAN_LOSS_RESERVE",       label: "Loan Loss Reserve",                  order: 130, statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_LOANS_HELD_FOR_SALE",     label: "Loans Held for Sale",                order: 140, statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_TOTAL_NET_LOANS",         label: "Total Net Loans",                    order: 150, statement_type: "balance_sheet", category: "assets", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_BS_GROSS_LOANS_HFI","SNL_BS_LOAN_LOSS_RESERVE","SNL_BS_LOANS_HELD_FOR_SALE"], formula: "subtract" },

  { code: "SNL_BS_REAL_ESTATE_OWNED",       label: "Real Estate Owned and Held for Investment", order: 160, statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_GOODWILL",                label: "Goodwill",                           order: 170, statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_CORE_DEPOSIT_INTANGIBLES",label: "Core Deposit Intangibles",           order: 180, statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_OTHER_INTANGIBLES",       label: "Other Intangibles",                  order: 190, statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_INTANGIBLE_ASSETS_OTHER", label: "Intangible Assets other than Goodwill", order: 200, statement_type: "balance_sheet", category: "assets", indent: 0, is_calculated: true, is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_BS_CORE_DEPOSIT_INTANGIBLES","SNL_BS_OTHER_INTANGIBLES"], formula: "sum" },
  { code: "SNL_BS_TOTAL_INTANGIBLE_ASSETS", label: "Total Intangible Assets",            order: 210, statement_type: "balance_sheet", category: "assets", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_BS_GOODWILL","SNL_BS_INTANGIBLE_ASSETS_OTHER"], formula: "sum" },
  { code: "SNL_BS_LOAN_SERVICING_RIGHTS",   label: "Loan Servicing Rights",              order: 220, statement_type: "balance_sheet", category: "assets", indent: 0, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_FIXED_ASSETS",            label: "Fixed Assets",                       order: 230, statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_INTEREST_RECEIVABLE",     label: "Interest Receivable",                order: 240, statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_PREPAID_EXPENSE",         label: "Prepaid Expense",                    order: 250, statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_BOLI",                    label: "Bank-owned Life Insurance",          order: 260, statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_OTHER_ASSETS",            label: "Other Assets",                       order: 270, statement_type: "balance_sheet", category: "assets", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_TOTAL_OTHER_ASSETS",      label: "Total Other Assets",                 order: 280, statement_type: "balance_sheet", category: "assets", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_BS_FIXED_ASSETS","SNL_BS_INTEREST_RECEIVABLE","SNL_BS_PREPAID_EXPENSE","SNL_BS_BOLI","SNL_BS_OTHER_ASSETS"], formula: "sum" },
  { code: "SNL_BS_TOTAL_ASSETS",            label: "Total Assets",                       order: 290, statement_type: "balance_sheet", category: "assets", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: [], formula: "derived" },

  // ── LIABILITIES ────────────────────────────────────────────────────────
  { code: "SNL_BS_TOTAL_DEPOSITS",          label: "Total Deposits",                     order: 300, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_FHLB_BORROWINGS",         label: "FHLB Borrowings",                    order: 310, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_SENIOR_DEBT",             label: "Senior Debt",                        order: 320, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_TRUST_PREFERRED_FAS150",  label: "Trust Preferred (FAS 150)",           order: 330, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_SUBORDINATED_DEBT",       label: "Total Subordinated Debt",            order: 340, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_REDEEMABLE_FIN_INSTRUMENTS",label:"Redeemable Financial Instruments (FAS 150)", order: 350, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_TOTAL_DEBT",              label: "Total Debt",                         order: 360, statement_type: "balance_sheet", category: "liabilities", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_BS_FHLB_BORROWINGS","SNL_BS_SENIOR_DEBT","SNL_BS_TRUST_PREFERRED_FAS150","SNL_BS_SUBORDINATED_DEBT","SNL_BS_REDEEMABLE_FIN_INSTRUMENTS"], formula: "sum" },
  { code: "SNL_BS_OTHER_LIABILITIES",       label: "Total Other Liabilities",            order: 370, statement_type: "balance_sheet", category: "liabilities", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_TOTAL_LIABILITIES",       label: "Total Liabilities",                  order: 380, statement_type: "balance_sheet", category: "liabilities", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_BS_TOTAL_DEPOSITS","SNL_BS_TOTAL_DEBT","SNL_BS_OTHER_LIABILITIES"], formula: "sum" },

  // ── MEZZANINE ──────────────────────────────────────────────────────────
  { code: "SNL_BS_REDEEMABLE_PREFERRED",    label: "Redeemable Preferred",               order: 390, statement_type: "balance_sheet", category: "mezzanine", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_TRUST_PREFERRED_SECURITIES",label:"Trust Preferred Securities",        order: 400, statement_type: "balance_sheet", category: "mezzanine", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_MINORITY_INTEREST",       label: "Total Minority Interest",            order: 410, statement_type: "balance_sheet", category: "mezzanine", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_OTHER_MEZZANINE",         label: "Other Mezzanine Items",              order: 420, statement_type: "balance_sheet", category: "mezzanine", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_TOTAL_MEZZANINE",         label: "Total Mezzanine Level Items",        order: 430, statement_type: "balance_sheet", category: "mezzanine", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_BS_REDEEMABLE_PREFERRED","SNL_BS_TRUST_PREFERRED_SECURITIES","SNL_BS_MINORITY_INTEREST","SNL_BS_OTHER_MEZZANINE"], formula: "sum" },

  // ── EQUITY ─────────────────────────────────────────────────────────────
  { code: "SNL_BS_TARP_PREFERRED",          label: "TARP Preferred Equity",              order: 440, statement_type: "balance_sheet", category: "equity", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_OTHER_PREFERRED_EQUITY",  label: "Other Preferred Equity",             order: 450, statement_type: "balance_sheet", category: "equity", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_TOTAL_PREFERRED_EQUITY",  label: "Total Preferred Equity",             order: 460, statement_type: "balance_sheet", category: "equity", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_BS_TARP_PREFERRED","SNL_BS_OTHER_PREFERRED_EQUITY"], formula: "sum" },
  { code: "SNL_BS_COMMON_EQUITY",           label: "Common Equity",                      order: 470, statement_type: "balance_sheet", category: "equity", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_EQUITY_PARENT",           label: "Equity Attributable to Parent Company", order: 480, statement_type: "balance_sheet", category: "equity", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_NONCONTROLLING_INTERESTS",label: "Noncontrolling Interests",           order: 490, statement_type: "balance_sheet", category: "equity", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_TOTAL_EQUITY",            label: "Total Equity",                       order: 500, statement_type: "balance_sheet", category: "equity", indent: 0, is_calculated: true,  is_header: false, is_per_share: false, is_memo: false, is_average: false,
    components: ["SNL_BS_TOTAL_PREFERRED_EQUITY","SNL_BS_COMMON_EQUITY","SNL_BS_NONCONTROLLING_INTERESTS"], formula: "sum" },
  { code: "SNL_BS_NET_UNREALIZED_GAIN",     label: "Net Unrealized Gain",                order: 510, statement_type: "balance_sheet", category: "equity", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },
  { code: "SNL_BS_TOTAL_AOCI",              label: "Tot Acc Other Comprehensive Inc",    order: 520, statement_type: "balance_sheet", category: "equity", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: false, is_average: false },

  // ── Supplemental / Fair Value ──────────────────────────────────────────
  { code: "SNL_BS_LEVEL1_ASSETS",           label: "Level 1 Assets ($M)",                 order: 530, statement_type: "balance_sheet", category: "fair_value", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: true,  is_average: false },
  { code: "SNL_BS_LEVEL2_ASSETS",           label: "Level 2 Assets ($M)",                 order: 540, statement_type: "balance_sheet", category: "fair_value", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: true,  is_average: false },
  { code: "SNL_BS_LEVEL3_ASSETS",           label: "Level 3 Assets ($M)",                 order: 550, statement_type: "balance_sheet", category: "fair_value", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: true,  is_average: false },
  { code: "SNL_BS_LEVEL1_LIABILITIES",      label: "Level 1 Liabilities ($M)",            order: 560, statement_type: "balance_sheet", category: "fair_value", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: true,  is_average: false },
  { code: "SNL_BS_LEVEL2_LIABILITIES",      label: "Level 2 Liabilities ($M)",            order: 570, statement_type: "balance_sheet", category: "fair_value", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: true,  is_average: false },
  { code: "SNL_BS_LEVEL3_LIABILITIES",      label: "Level 3 Liabilities ($M)",            order: 580, statement_type: "balance_sheet", category: "fair_value", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: true,  is_average: false },
  { code: "SNL_BS_FTE_EMPLOYEES",           label: "FTE Employees (actual)",              order: 590, statement_type: "balance_sheet", category: "supplemental", indent: 1, is_calculated: false, is_header: false, is_per_share: false, is_memo: true, is_average: false },
]

// ═══════════════════════════════════════════════════════════════════════════
// Combined template map
// ═══════════════════════════════════════════════════════════════════════════

export const SNL_ALL_TEMPLATES: Record<string, SnlTemplateItem[]> = {
  income_statement: SNL_INCOME_STATEMENT,
  balance_sheet: SNL_BALANCE_SHEET,
}

export function getSnlMappableCodes(stmtType: string): SnlTemplateItem[] {
  return (SNL_ALL_TEMPLATES[stmtType] || []).filter(t => !t.is_calculated && !t.is_header)
}

export function getSnlTemplate(stmtType: string): SnlTemplateItem[] {
  return SNL_ALL_TEMPLATES[stmtType] || []
}
