/**
 * Map all reported_line_items → S&P Capital IQ standardized codes.
 *
 * Run: npx tsx --env-file=.env.local scripts/map-to-snp.ts
 * Options:
 *   --bank=NA04     Map a single bank
 *   --dry-run       Show mapping results without saving
 */
import { FinancialDB, sql } from "../lib/database"
import { mapReportedToStandard, computeCalculatedItems } from "../lib/reported-to-standard-mapper-v2"
import { getSnpTemplate } from "../lib/snp-template"

const DRY_RUN = process.argv.includes("--dry-run")
const SINGLE_BANK = process.argv.find(a => a.startsWith("--bank="))?.split("=")[1]

async function main() {
  console.log("🔄 Mapping reported items → S&P Capital IQ standard codes")
  if (DRY_RUN) console.log("⚠️  DRY RUN — no data will be saved")
  console.log("")

  // Get all banks with reported data
  const banks = await sql`
    SELECT b.id, b.name, b.bank_code, b.ticker
    FROM (
      SELECT DISTINCT b2.id, b2.name, b2.bank_code, b2.ticker, b2.region
      FROM banks b2
      JOIN reported_line_items r2 ON r2.filing_id LIKE 'sec-' || b2.id || '-%'
      ${SINGLE_BANK ? sql`WHERE b2.bank_code = ${SINGLE_BANK}` : sql``}
    ) b
    ORDER BY b.region, b.name
  `

  console.log(`📋 Found ${banks.length} banks with reported data\n`)

  const results = {
    banksProcessed: 0,
    totalReported: 0,
    totalMapped: 0,
    matchRate: 0,
    errors: 0,
  }

  for (const bank of banks) {
    console.log(`${"═".repeat(60)}`)
    console.log(`📊 ${bank.bank_code || bank.id} — ${bank.name}`)

    try {
      // Get all reported items for this bank, grouped by filing
      const reportedItems = await sql`
        SELECT r.line_item, r.value, r.fiscal_year, r.period_end, 
               r.statement_type, r.filing_id
        FROM reported_line_items r
        WHERE r.filing_id LIKE ${'sec-' + bank.id + '-%'}
        ORDER BY r.fiscal_year DESC, r.line_item
      `

      console.log(`  📋 ${reportedItems.length} reported line items`)

      // Map Balance Sheet items
      const bsItems = reportedItems.filter((i: any) => i.statement_type === "balance_sheet")
      const bsMapped = mapReportedToStandard(bsItems, "balance_sheet")
      const bsTemplate = getSnpTemplate("balance_sheet")
      const bsWithCalc = computeCalculatedItems(bsMapped, bsTemplate)
      console.log(`  📊 Balance Sheet: ${bsItems.length} reported → ${bsMapped.length} mapped → ${bsWithCalc.length} with calculated`)

      // Map Income Statement items
      const isItems = reportedItems.filter((i: any) => i.statement_type === "income_statement")
      const isMapped = mapReportedToStandard(isItems, "income_statement")
      const isTemplate = getSnpTemplate("income_statement")
      const isWithCalc = computeCalculatedItems(isMapped, isTemplate)
      console.log(`  📊 Income Statement: ${isItems.length} reported → ${isMapped.length} mapped → ${isWithCalc.length} with calculated`)

      const allMapped = [...bsWithCalc, ...isWithCalc]
      results.totalReported += reportedItems.length
      results.totalMapped += allMapped.length

      if (bsItems.length + isItems.length > 0) {
        const matchRate = ((bsMapped.length + isMapped.length) / (bsItems.length + isItems.length) * 100).toFixed(1)
        console.log(`  🎯 Match rate: ${matchRate}%`)
        results.matchRate = parseFloat(matchRate)
      }

      if (DRY_RUN) {
        // Show sample mappings
        console.log("\n  📋 Sample Balance Sheet mappings:")
        const samples = bsMapped.filter(m => m.confidence > 0.5).slice(0, 10)
        for (const m of samples) {
          const sources = m.source_labels.slice(0, 2).join(", ")
          console.log(`    ${m.snp_code.padEnd(35)} ${m.snp_label.padEnd(40)} ${m.value.toFixed(0).padStart(8)}M  from: ${sources}`)
        }

        console.log("\n  📋 Sample Income Statement mappings:")
        const isSamples = isMapped.filter(m => m.confidence > 0.5).slice(0, 10)
        for (const m of isSamples) {
          const sources = m.source_labels.slice(0, 2).join(", ")
          console.log(`    ${m.snp_code.padEnd(35)} ${m.snp_label.padEnd(40)} ${m.value.toFixed(0).padStart(8)}M  from: ${sources}`)
        }
      } else {
        // Get existing S&P CIQ codes for this bank (from XBRL mapping) to avoid duplicates
        const existingCodes = await sql`
          SELECT DISTINCT standardized_code, fiscal_year FROM standardized_line_items WHERE bank_id = ${bank.id}
        `
        const existingSet = new Set(existingCodes.map((r: any) => `${r.standardized_code}|${r.fiscal_year}`))

        // Delete any old label-mapped items (but NOT XBRL-mapped ones — those have sec- prefix in filing_id)
        // We'll just use ON CONFLICT on ID to handle updates

        // Get a valid filing_id for this bank
        const firstFiling = await sql`
          SELECT id FROM filings WHERE bank_id = ${bank.id} LIMIT 1
        `
        const defaultFilingId = firstFiling[0]?.id || "unknown"

        // Save mapped items — skip if already populated by XBRL mapping
        let saved = 0
        let skipped = 0
        for (const item of allMapped) {
          const val = Number(item.value)
          if (!isFinite(val) || val === 0) continue

          const key = `${item.snp_code}|${item.fiscal_year}`
          if (existingSet.has(key)) {
            skipped++
            continue
          }

          const id = `snp-${bank.id}-${item.snp_code}-${item.fiscal_year}`
          try {
            await sql`
              INSERT INTO standardized_line_items (id, bank_id, filing_id, standardized_code, standardized_label, value, unit, currency, period_end, fiscal_year, source_line_item_id, confidence)
              VALUES (${id}, ${bank.id}, ${defaultFilingId}, ${item.snp_code}, ${item.snp_label}, ${val}, ${"millions"}, ${"USD"}, ${item.period_end}, ${item.fiscal_year}, ${null}, ${item.confidence.toFixed(4)})
              ON CONFLICT (id) DO UPDATE SET
                value = EXCLUDED.value,
                confidence = EXCLUDED.confidence,
                standardized_label = EXCLUDED.standardized_label
            `
            saved++
          } catch (err: any) {
            if (!err.message?.includes("duplicate") && !err.message?.includes("conflict")) {
              console.error(`    ⚠️  Save error for ${id}: ${err.message?.slice(0, 80)}`)
            }
          }
        }
        console.log(`  💾 Saved ${saved} new standardized items (${skipped} skipped — already from XBRL)`)
      }

      results.banksProcessed++

    } catch (err) {
      console.error(`  ❌ Error: ${err instanceof Error ? err.message : String(err)}`)
      results.errors++
    }
  }

  console.log(`\n${"═".repeat(60)}`)
  console.log("📊 MAPPING COMPLETE")
  console.log(`   Banks processed: ${results.banksProcessed}`)
  console.log(`   Total reported:  ${results.totalReported}`)
  console.log(`   Total mapped:    ${results.totalMapped}`)
  console.log(`   Errors:          ${results.errors}`)
}

main().catch(console.error)
