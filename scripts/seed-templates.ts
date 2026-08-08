/**
 * Seed S&P Capital IQ-Style Standardized Templates
 * Run: npx tsx --env-file=.env.local scripts/seed-templates.ts
 */
import { sql } from "../lib/database"

interface TemplateLine {
  code: string
  label: string
  order: number
  indent: number
  bold: boolean
  total: boolean
  subtotal: boolean
  category: string
  xbrlTags: string[]
}

async function seed() {
  console.log("📋 Seeding standardized financial templates...")

  // ── Balance Sheet — Bank Template ───────────────────────────────────
  const bsLines: TemplateLine[] = [
    // ASSETS
    { code: "BS_CATEGORY_ASSETS", label: "ASSETS", order: 1, indent: 0, bold: true, total: false, subtotal: false, category: "assets", xbrlTags: [] },
    { code: "BS_CASH_DUE_FROM_BANKS", label: "Cash & Due from Banks", order: 2, indent: 1, bold: false, total: false, subtotal: false, category: "assets", xbrlTags: ["us-gaap:CashAndDueFromBanks"] },
    { code: "BS_INTEREST_BEARING_BANK_DEPOSITS", label: "Interest-Bearing Deposits with Banks", order: 3, indent: 1, bold: false, total: false, subtotal: false, category: "assets", xbrlTags: ["us-gaap:InterestBearingDepositsInBanks"] },
    { code: "BS_TRADING_ASSETS", label: "Trading Assets", order: 4, indent: 1, bold: false, total: false, subtotal: false, category: "assets", xbrlTags: ["us-gaap:TradingAssets"] },
    { code: "BS_CATEGORY_INVESTMENTS", label: "Investment Securities", order: 5, indent: 1, bold: true, total: false, subtotal: true, category: "assets", xbrlTags: [] },
    { code: "BS_INVESTMENT_SECURITIES_AFS", label: "Available-for-Sale (AFS)", order: 6, indent: 2, bold: false, total: false, subtotal: false, category: "assets", xbrlTags: ["us-gaap:AvailableForSaleSecuritiesDebtSecurities"] },
    { code: "BS_HELD_TO_MATURITY", label: "Held-to-Maturity (HTM)", order: 7, indent: 2, bold: false, total: false, subtotal: false, category: "assets", xbrlTags: ["us-gaap:HeldToMaturitySecurities"] },
    { code: "BS_INVESTMENT_SECURITIES", label: "Total Investment Securities", order: 8, indent: 1, bold: true, total: true, subtotal: false, category: "assets", xbrlTags: ["us-gaap:AvailableForSaleSecuritiesDebtSecurities"] },
    { code: "BS_CATEGORY_LOANS", label: "Loans & Leases", order: 9, indent: 1, bold: true, total: false, subtotal: true, category: "assets", xbrlTags: [] },
    { code: "BS_LOANS_COMMERCIAL", label: "Commercial & Industrial", order: 10, indent: 2, bold: false, total: false, subtotal: false, category: "assets", xbrlTags: [] },
    { code: "BS_LOANS_CRE", label: "Commercial Real Estate (CRE)", order: 11, indent: 2, bold: false, total: false, subtotal: false, category: "assets", xbrlTags: [] },
    { code: "BS_LOANS_RESIDENTIAL", label: "Residential Mortgage", order: 12, indent: 2, bold: false, total: false, subtotal: false, category: "assets", xbrlTags: [] },
    { code: "BS_LOANS_CONSUMER", label: "Consumer / Credit Card", order: 13, indent: 2, bold: false, total: false, subtotal: false, category: "assets", xbrlTags: [] },
    { code: "BS_LOANS_OTHER", label: "Other Loans", order: 14, indent: 2, bold: false, total: false, subtotal: false, category: "assets", xbrlTags: [] },
    { code: "BS_GROSS_LOANS", label: "Gross Loans & Leases", order: 15, indent: 1, bold: true, total: true, subtotal: false, category: "assets", xbrlTags: ["us-gaap:LoansAndLeasesReceivableGrossCarryingAmount"] },
    { code: "BS_LOAN_LOSS_RESERVE", label: "Less: Allowance for Credit Losses (ALLL)", order: 16, indent: 1, bold: false, total: false, subtotal: false, category: "assets", xbrlTags: ["us-gaap:FinancingReceivableAllowanceForCreditLosses"] },
    { code: "BS_NET_LOANS", label: "Net Loans & Leases", order: 17, indent: 1, bold: true, total: true, subtotal: false, category: "assets", xbrlTags: ["us-gaap:LoansAndLeasesReceivableNetReportedAmount"] },
    { code: "BS_GOODWILL", label: "Goodwill", order: 18, indent: 1, bold: false, total: false, subtotal: false, category: "assets", xbrlTags: ["us-gaap:Goodwill"] },
    { code: "BS_INTANGIBLES", label: "Other Intangible Assets", order: 19, indent: 1, bold: false, total: false, subtotal: false, category: "assets", xbrlTags: ["us-gaap:IntangibleAssetsNetExcludingGoodwill"] },
    { code: "BS_OTHER_ASSETS", label: "Other Assets", order: 20, indent: 1, bold: false, total: false, subtotal: false, category: "assets", xbrlTags: ["us-gaap:OtherAssets"] },
    { code: "BS_TOTAL_ASSETS", label: "TOTAL ASSETS", order: 21, indent: 0, bold: true, total: true, subtotal: false, category: "assets", xbrlTags: ["us-gaap:Assets"] },

    // LIABILITIES
    { code: "BS_CATEGORY_LIABILITIES", label: "LIABILITIES", order: 22, indent: 0, bold: true, total: false, subtotal: false, category: "liabilities", xbrlTags: [] },
    { code: "BS_CATEGORY_DEPOSITS", label: "Deposits", order: 23, indent: 1, bold: true, total: false, subtotal: true, category: "liabilities", xbrlTags: [] },
    { code: "BS_DEMAND_DEPOSITS", label: "Non-Interest-Bearing Demand Deposits", order: 24, indent: 2, bold: false, total: false, subtotal: false, category: "liabilities", xbrlTags: ["us-gaap:DepositsNoninterestBearing"] },
    { code: "BS_INTEREST_BEARING_DEPOSITS", label: "Interest-Bearing Deposits", order: 25, indent: 2, bold: false, total: false, subtotal: false, category: "liabilities", xbrlTags: ["us-gaap:InterestBearingDepositLiabilities"] },
    { code: "BS_TIME_DEPOSITS", label: "Time Deposits", order: 26, indent: 2, bold: false, total: false, subtotal: false, category: "liabilities", xbrlTags: [] },
    { code: "BS_TOTAL_DEPOSITS", label: "Total Deposits", order: 27, indent: 1, bold: true, total: true, subtotal: false, category: "liabilities", xbrlTags: ["us-gaap:Deposits"] },
    { code: "BS_SHORT_TERM_BORROWINGS", label: "Short-Term Borrowings", order: 28, indent: 1, bold: false, total: false, subtotal: false, category: "liabilities", xbrlTags: ["us-gaap:ShortTermBorrowings"] },
    { code: "BS_LONG_TERM_DEBT", label: "Long-Term Debt", order: 29, indent: 1, bold: false, total: false, subtotal: false, category: "liabilities", xbrlTags: ["us-gaap:LongTermDebt"] },
    { code: "BS_TRADING_LIABILITIES", label: "Trading Liabilities", order: 30, indent: 1, bold: false, total: false, subtotal: false, category: "liabilities", xbrlTags: ["us-gaap:TradingLiabilities"] },
    { code: "BS_OTHER_LIABILITIES", label: "Other Liabilities", order: 31, indent: 1, bold: false, total: false, subtotal: false, category: "liabilities", xbrlTags: ["us-gaap:OtherLiabilities"] },
    { code: "BS_TOTAL_LIABILITIES", label: "TOTAL LIABILITIES", order: 32, indent: 0, bold: true, total: true, subtotal: false, category: "liabilities", xbrlTags: ["us-gaap:Liabilities"] },

    // EQUITY
    { code: "BS_CATEGORY_EQUITY", label: "SHAREHOLDERS' EQUITY", order: 33, indent: 0, bold: true, total: false, subtotal: false, category: "equity", xbrlTags: [] },
    { code: "BS_COMMON_STOCK", label: "Common Stock", order: 34, indent: 1, bold: false, total: false, subtotal: false, category: "equity", xbrlTags: ["us-gaap:CommonStockValue"] },
    { code: "BS_ADDITIONAL_PAID_IN", label: "Additional Paid-In Capital", order: 35, indent: 1, bold: false, total: false, subtotal: false, category: "equity", xbrlTags: ["us-gaap:AdditionalPaidInCapital"] },
    { code: "BS_RETAINED_EARNINGS", label: "Retained Earnings", order: 36, indent: 1, bold: false, total: false, subtotal: false, category: "equity", xbrlTags: ["us-gaap:RetainedEarningsAccumulatedDeficit"] },
    { code: "BS_AOCI", label: "Accumulated Other Comprehensive Income (AOCI)", order: 37, indent: 1, bold: false, total: false, subtotal: false, category: "equity", xbrlTags: ["us-gaap:AccumulatedOtherComprehensiveIncomeLossNetOfTax"] },
    { code: "BS_TREASURY_STOCK", label: "Less: Treasury Stock", order: 38, indent: 1, bold: false, total: false, subtotal: false, category: "equity", xbrlTags: ["us-gaap:TreasuryStockValue"] },
    { code: "BS_TOTAL_EQUITY", label: "TOTAL SHAREHOLDERS' EQUITY", order: 39, indent: 0, bold: true, total: true, subtotal: false, category: "equity", xbrlTags: ["us-gaap:StockholdersEquity"] },
    { code: "BS_TANGIBLE_COMMON_EQUITY", label: "Tangible Common Equity (TCE)", order: 40, indent: 1, bold: false, total: false, subtotal: false, category: "equity", xbrlTags: [] },
    { code: "BS_TOTAL_LIABILITIES_EQUITY", label: "TOTAL LIABILITIES & EQUITY", order: 41, indent: 0, bold: true, total: true, subtotal: false, category: "equity", xbrlTags: [] },

    // REGULATORY CAPITAL
    { code: "BS_CATEGORY_REG_CAPITAL", label: "REGULATORY CAPITAL", order: 42, indent: 0, bold: true, total: false, subtotal: false, category: "capital", xbrlTags: [] },
    { code: "BS_CET1_CAPITAL", label: "Common Equity Tier 1 (CET1)", order: 43, indent: 1, bold: false, total: false, subtotal: false, category: "capital", xbrlTags: ["us-gaap:CommonEquityTierOneCapital"] },
    { code: "BS_TIER_1_CAPITAL", label: "Tier 1 Capital", order: 44, indent: 1, bold: false, total: false, subtotal: false, category: "capital", xbrlTags: ["us-gaap:TierOneCapital"] },
    { code: "BS_TOTAL_CAPITAL", label: "Total Regulatory Capital", order: 45, indent: 1, bold: false, total: false, subtotal: false, category: "capital", xbrlTags: [] },
    { code: "CAP_RWA_TOTAL", label: "Risk-Weighted Assets (RWA)", order: 46, indent: 1, bold: false, total: false, subtotal: false, category: "capital", xbrlTags: ["us-gaap:RiskWeightedAssets"] },
  ]

  // ── Income Statement — Bank Template ────────────────────────────────
  const isLines: TemplateLine[] = [
    { code: "IS_CATEGORY_INTEREST_INCOME", label: "INTEREST INCOME", order: 1, indent: 0, bold: true, total: false, subtotal: false, category: "revenue", xbrlTags: [] },
    { code: "IS_INTEREST_LOANS", label: "Interest on Loans", order: 2, indent: 1, bold: false, total: false, subtotal: false, category: "revenue", xbrlTags: [] },
    { code: "IS_INTEREST_SECURITIES", label: "Interest on Securities", order: 3, indent: 1, bold: false, total: false, subtotal: false, category: "revenue", xbrlTags: [] },
    { code: "IS_INTEREST_OTHER", label: "Other Interest Income", order: 4, indent: 1, bold: false, total: false, subtotal: false, category: "revenue", xbrlTags: [] },
    { code: "IS_INTEREST_INCOME", label: "TOTAL INTEREST INCOME", order: 5, indent: 0, bold: true, total: true, subtotal: false, category: "revenue", xbrlTags: ["us-gaap:InterestIncome"] },
    { code: "IS_CATEGORY_INTEREST_EXPENSE", label: "INTEREST EXPENSE", order: 6, indent: 0, bold: true, total: false, subtotal: false, category: "expenses", xbrlTags: [] },
    { code: "IS_INTEREST_DEPOSITS", label: "Interest on Deposits", order: 7, indent: 1, bold: false, total: false, subtotal: false, category: "expenses", xbrlTags: [] },
    { code: "IS_INTEREST_BORROWINGS", label: "Interest on Borrowings", order: 8, indent: 1, bold: false, total: false, subtotal: false, category: "expenses", xbrlTags: [] },
    { code: "IS_INTEREST_OTHER_EXPENSE", label: "Other Interest Expense", order: 9, indent: 1, bold: false, total: false, subtotal: false, category: "expenses", xbrlTags: [] },
    { code: "IS_INTEREST_EXPENSE", label: "TOTAL INTEREST EXPENSE", order: 10, indent: 0, bold: true, total: true, subtotal: false, category: "expenses", xbrlTags: ["us-gaap:InterestExpense"] },
    { code: "IS_NET_INTEREST_INCOME", label: "NET INTEREST INCOME", order: 11, indent: 0, bold: true, total: true, subtotal: false, category: "revenue", xbrlTags: ["us-gaap:InterestIncomeExpenseNet"] },
    { code: "IS_PROVISION_EXPENSE", label: "(-) Provision for Credit Losses", order: 12, indent: 1, bold: false, total: false, subtotal: false, category: "expenses", xbrlTags: ["us-gaap:ProvisionForLoanLeaseAndOtherLosses"] },
    { code: "IS_NII_AFTER_PROVISION", label: "NET INTEREST INCOME AFTER PROVISION", order: 13, indent: 0, bold: true, total: true, subtotal: false, category: "revenue", xbrlTags: [] },
    { code: "IS_CATEGORY_NONINTEREST_INCOME", label: "NON-INTEREST INCOME", order: 14, indent: 0, bold: true, total: false, subtotal: false, category: "revenue", xbrlTags: [] },
    { code: "IS_FEE_INCOME", label: "Service Charges & Fees", order: 15, indent: 1, bold: false, total: false, subtotal: false, category: "revenue", xbrlTags: [] },
    { code: "IS_INVESTMENT_BANKING", label: "Investment Banking / Advisory", order: 16, indent: 1, bold: false, total: false, subtotal: false, category: "revenue", xbrlTags: [] },
    { code: "IS_TRADING_INCOME", label: "Trading Income", order: 17, indent: 1, bold: false, total: false, subtotal: false, category: "revenue", xbrlTags: [] },
    { code: "IS_ASSET_MANAGEMENT", label: "Asset Management Fees", order: 18, indent: 1, bold: false, total: false, subtotal: false, category: "revenue", xbrlTags: [] },
    { code: "IS_OTHER_NONINTEREST_INCOME", label: "Other Non-Interest Income", order: 19, indent: 1, bold: false, total: false, subtotal: false, category: "revenue", xbrlTags: [] },
    { code: "IS_NONINTEREST_INCOME", label: "TOTAL NON-INTEREST INCOME", order: 20, indent: 0, bold: true, total: true, subtotal: false, category: "revenue", xbrlTags: ["us-gaap:NoninterestIncome"] },
    { code: "IS_TOTAL_REVENUE", label: "TOTAL REVENUE (Net Interest + Non-Interest)", order: 21, indent: 0, bold: true, total: true, subtotal: false, category: "revenue", xbrlTags: ["us-gaap:Revenues"] },
    { code: "IS_CATEGORY_EXPENSES", label: "NON-INTEREST EXPENSE", order: 22, indent: 0, bold: true, total: false, subtotal: false, category: "expenses", xbrlTags: [] },
    { code: "IS_COMPENSATION", label: "Compensation & Benefits", order: 23, indent: 1, bold: false, total: false, subtotal: false, category: "expenses", xbrlTags: [] },
    { code: "IS_OCCUPANCY", label: "Occupancy & Equipment", order: 24, indent: 1, bold: false, total: false, subtotal: false, category: "expenses", xbrlTags: [] },
    { code: "IS_TECHNOLOGY", label: "Technology & Communications", order: 25, indent: 1, bold: false, total: false, subtotal: false, category: "expenses", xbrlTags: [] },
    { code: "IS_PROFESSIONAL_SERVICES", label: "Professional Services", order: 26, indent: 1, bold: false, total: false, subtotal: false, category: "expenses", xbrlTags: [] },
    { code: "IS_OTHER_OPEX", label: "Other Operating Expenses", order: 27, indent: 1, bold: false, total: false, subtotal: false, category: "expenses", xbrlTags: [] },
    { code: "IS_OPERATING_EXPENSE", label: "TOTAL NON-INTEREST EXPENSE", order: 28, indent: 0, bold: true, total: true, subtotal: false, category: "expenses", xbrlTags: ["us-gaap:OperatingExpenses"] },
    { code: "IS_PRE_PROVISION_PROFIT", label: "PRE-PROVISION NET REVENUE (PPNR)", order: 29, indent: 0, bold: true, total: true, subtotal: false, category: "revenue", xbrlTags: ["us-gaap:OperatingIncomeLoss"] },
    { code: "IS_INCOME_BEFORE_TAX", label: "INCOME BEFORE INCOME TAXES", order: 30, indent: 0, bold: true, total: true, subtotal: false, category: "revenue", xbrlTags: ["us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest"] },
    { code: "IS_INCOME_TAX", label: "(-) Income Tax Provision", order: 31, indent: 1, bold: false, total: false, subtotal: false, category: "expenses", xbrlTags: ["us-gaap:IncomeTaxExpenseBenefit"] },
    { code: "IS_NET_INCOME", label: "NET INCOME", order: 32, indent: 0, bold: true, total: true, subtotal: false, category: "revenue", xbrlTags: ["us-gaap:NetIncomeLoss"] },
    { code: "IS_EPS", label: "Earnings Per Share (Basic)", order: 33, indent: 1, bold: false, total: false, subtotal: false, category: "revenue", xbrlTags: ["us-gaap:EarningsPerShareBasic"] },
    { code: "IS_EPS_DILUTED", label: "Earnings Per Share (Diluted)", order: 34, indent: 1, bold: false, total: false, subtotal: false, category: "revenue", xbrlTags: ["us-gaap:EarningsPerShareDiluted"] },
    { code: "IS_DPS", label: "Dividends Per Share", order: 35, indent: 1, bold: false, total: false, subtotal: false, category: "revenue", xbrlTags: ["us-gaap:CommonStockDividendsPerShareDeclared"] },
  ]

  // ── Insert Templates ────────────────────────────────────────────────
  // Balance Sheet Template
  await sql`DELETE FROM template_line_items WHERE standardized_code LIKE 'BS_%' OR standardized_code LIKE 'CAP_%'`
  await sql`DELETE FROM standardized_templates WHERE template_code = 'BS_BANK'`
  const bsTemplate = await sql`
    INSERT INTO standardized_templates (template_code, template_name, display_order)
    VALUES ('BS_BANK', 'Balance Sheet — Bank', 1)
    ON CONFLICT (template_code) DO UPDATE SET template_name = EXCLUDED.template_name
    RETURNING id
  `
  const bsTemplateId = bsTemplate[0].id

  for (const line of bsLines) {
    await sql`
      INSERT INTO template_line_items (template_id, standardized_code, line_label, line_order, indent_level, is_bold, is_total, is_subtotal, xbrl_tags, category)
      VALUES (${bsTemplateId}, ${line.code}, ${line.label}, ${line.order}, ${line.indent}, ${line.bold}, ${line.total}, ${line.subtotal}, ${line.xbrlTags}, ${line.category})
      ON CONFLICT (standardized_code) DO UPDATE SET
        line_label = EXCLUDED.line_label, line_order = EXCLUDED.line_order,
        indent_level = EXCLUDED.indent_level, is_bold = EXCLUDED.is_bold,
        is_total = EXCLUDED.is_total, xbrl_tags = EXCLUDED.xbrl_tags
    `
  }
  console.log(`  ✅ Balance Sheet template: ${bsLines.length} line items`)

  // Income Statement Template
  await sql`DELETE FROM template_line_items WHERE standardized_code LIKE 'IS_%'`
  await sql`DELETE FROM standardized_templates WHERE template_code = 'IS_BANK'`
  const isTemplate = await sql`
    INSERT INTO standardized_templates (template_code, template_name, display_order)
    VALUES ('IS_BANK', 'Income Statement — Bank', 2)
    ON CONFLICT (template_code) DO UPDATE SET template_name = EXCLUDED.template_name
    RETURNING id
  `
  const isTemplateId = isTemplate[0].id

  for (const line of isLines) {
    await sql`
      INSERT INTO template_line_items (template_id, standardized_code, line_label, line_order, indent_level, is_bold, is_total, is_subtotal, xbrl_tags, category)
      VALUES (${isTemplateId}, ${line.code}, ${line.label}, ${line.order}, ${line.indent}, ${line.bold}, ${line.total}, ${line.subtotal}, ${line.xbrlTags}, ${line.category})
      ON CONFLICT (standardized_code) DO UPDATE SET
        line_label = EXCLUDED.line_label, line_order = EXCLUDED.line_order,
        indent_level = EXCLUDED.indent_level, is_bold = EXCLUDED.is_bold,
        is_total = EXCLUDED.is_total, xbrl_tags = EXCLUDED.xbrl_tags
    `
  }
  console.log(`  ✅ Income Statement template: ${isLines.length} line items`)

  console.log("🎉 Templates seeded successfully!")
}

seed().catch(console.error)
