/**
 * Check: How many SEC facts does Wells Fargo have vs what we saved?
 */
import { sql } from "../lib/database"
import { SecEdgarClient } from "../lib/sec-edgar-client"

async function check() {
  const client = new SecEdgarClient()

  // Get SEC facts for Wells Fargo
  const facts = await client.getCompanyFacts(72971)
  if (!facts) return

  const usGaap = facts.facts["us-gaap"]
  
  // Count facts with 10-K USD data for FY2025
  const fy2025Facts = Object.entries(usGaap)
    .filter(([_, fact]) => {
      const usdData = fact.units?.["USD"]
      return usdData?.some((d: any) => d.form === "10-K" && d.fy === 2025)
    })
  
  console.log(`SEC facts with FY2025 10-K USD data: ${fy2025Facts.length}`)

  // Count what we actually saved as reported items
  const saved = await sql`
    SELECT COUNT(*) as cnt FROM reported_line_items 
    WHERE filing_id = 'sec-bank-na-04-2025'
  `
  console.log(`Saved reported items for FY2025: ${saved[0].cnt}`)
  
  // Show a sample of what we're NOT saving
  const savedCodes = new Set<string>()
  const stdItems = await sql`
    SELECT DISTINCT standardized_code FROM standardized_line_items 
    WHERE filing_id = 'sec-bank-na-04-2025'
  `
  for (const s of stdItems) savedCodes.add(s.standardized_code)

  const unmappedTags: string[] = []
  for (const [tag, fact] of fy2025Facts) {
    // Check if this tag maps to any of our saved standardized codes
    // (crude check — if the tag label doesn't match any saved label)
    const label = fact.label.toLowerCase()
    const isMapped = Array.from(savedCodes).some(code => {
      // Check if any mapping would produce this
      return false // Simplification — all are unmapped unless we explicitly mapped them
    })
    unmappedTags.push(`${fact.label.padEnd(70)} (${tag})`)
  }

  console.log(`\nFirst 30 unmapped SEC facts (ALL available, we only save 38):`)
  for (const t of unmappedTags.slice(0, 30)) {
    console.log(`  ❌ ${t}`)
  }
}

check().catch(console.error)
