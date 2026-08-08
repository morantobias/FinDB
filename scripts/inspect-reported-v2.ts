import { FinancialDB, sql } from "../lib/database"

async function main() {
  // Count BS vs IS for FY2025
  const items = await sql`
    SELECT statement_type, COUNT(*) as cnt, 
           MIN(line_item) as sample_label,
           AVG(ABS(value)) as avg_val
    FROM reported_line_items 
    WHERE filing_id = 'sec-bank-na-04-2025'
    GROUP BY statement_type
    ORDER BY cnt DESC
  `
  console.log("📊 Wells Fargo FY2025 — Reported Items by Statement Type:")
  for (const r of items) {
    console.log(`  ${r.statement_type.padEnd(20)} ${String(r.cnt).padEnd(5)} items  avg val: ${Number(r.avg_val).toFixed(1)}M  sample: ${r.sample_label}`)
  }

  // Show first 15 BS items
  const bs = await sql`
    SELECT line_item, value, fiscal_year
    FROM reported_line_items
    WHERE filing_id = 'sec-bank-na-04-2025' AND statement_type = 'balance_sheet'
    LIMIT 15
  `
  console.log("\n📋 First 15 BS items:")
  for (const r of bs) {
    console.log(`  ${(r.line_item || "(no label)").padEnd(75)} ${String(r.value).padEnd(12)} FY${r.fiscal_year}`)
  }

  // Show first 15 IS items
  const is_items = await sql`
    SELECT line_item, value, fiscal_year
    FROM reported_line_items
    WHERE filing_id = 'sec-bank-na-04-2025' AND statement_type = 'income_statement'
    LIMIT 15
  `
  console.log("\n📋 First 15 IS items:")
  for (const r of is_items) {
    console.log(`  ${(r.line_item || "(no label)").padEnd(75)} ${String(r.value).padEnd(12)} FY${r.fiscal_year}`)
  }

  process.exit(0)
}

main()
