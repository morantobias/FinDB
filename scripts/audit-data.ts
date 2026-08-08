import { sql } from "../lib/database"

async function audit() {
  const banks = await sql`SELECT COUNT(*) FROM banks`
  const filings = await sql`SELECT COUNT(*) FROM filings`
  const std = await sql`SELECT COUNT(*) FROM standardized_line_items`
  const ratios = await sql`SELECT COUNT(*) FROM key_ratios`
  const sources = await sql`SELECT source_type, COUNT(*) as cnt FROM filing_sources GROUP BY source_type`

  console.log("=== FinDB Data Audit ===")
  console.log(`Banks:              ${banks[0].count}`)
  console.log(`Filings:            ${filings[0].count}`)
  console.log(`Standardized items: ${std[0].count}`)
  console.log(`Ratios:             ${ratios[0].count}`)
  console.log(`\nFiling Sources:`)
  for (const s of sources) console.log(`  ${s.source_type}: ${s.cnt}`)
}

audit().catch(console.error)
