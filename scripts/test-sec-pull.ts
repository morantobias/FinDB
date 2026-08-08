/**
 * TEST: Pull SEC EDGAR data for a single bank.
 * Run: npx tsx --env-file=.env.local scripts/test-sec-pull.ts
 */
import { SecEdgarClient } from "../lib/sec-edgar-client"

async function test() {
  const client = new SecEdgarClient()

  // Test with JPMorgan (CIK 19617)
  console.log("🔄 Testing SEC EDGAR pull for JPMorgan (CIK 19617)...")
  
  const facts = await client.getCompanyFacts(19617)
  if (!facts) {
    console.log("❌ No data returned")
    return
  }

  console.log(`✅ Got company facts for: ${facts.entityName}`)
  console.log(`   CIK: ${facts.cik}`)
  
  const financials = client.extractFinancials(facts)
  console.log(`\n📊 Extracted ${financials.length} financial data points`)
  
  // Show sample
  const sample = financials.filter(f => f.form === "10-K").slice(0, 10)
  console.log("\nSample 10-K items:")
  for (const item of sample) {
    console.log(`  ${item.standardized_code.padEnd(25)} FY${item.fiscal_year}  ${item.value.toFixed(1)}M  (${item.standardized_label})`)
  }

  // Show ratios
  const ratioItems = financials.filter(f => f.unit === "%")
  console.log(`\n📈 Ratio items: ${ratioItems.length}`)
  for (const r of ratioItems.slice(0, 6)) {
    console.log(`  ${r.standardized_code.padEnd(25)} FY${r.fiscal_year}  ${r.value.toFixed(2)}${r.unit}`)
  }
}

test().catch(console.error)
