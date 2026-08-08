/**
 * Full Data Pull — SEC EDGAR → Extract → Standardize → Ratios
 *
 * Pulls financial data for ALL SEC-registered banks, processes through
 * the full pipeline, and stores in the database.
 *
 * Run: npx tsx --env-file=.env.local scripts/pull-all-data.ts
 *
 * Options:
 *   --bank=NA01     Pull a single bank
 *   --dry-run       Show what would be pulled without saving
 *   --years=5       How many years of history (default: all available)
 */
import { SecEdgarClient, type ExtractedFinancial } from "../lib/sec-edgar-client"
import { BankDB, FilingDB, FinancialDB, sql } from "../lib/database"
import { computeAllBankRatios } from "../lib/ratio-calculator"

const DRY_RUN = process.argv.includes("--dry-run")
const SINGLE_BANK = process.argv.find(a => a.startsWith("--bank="))?.split("=")[1]

async function main() {
  console.log("🚀 FinDB Data Pull Engine")
  console.log(DRY_RUN ? "⚠️  DRY RUN — no data will be saved" : "💾 LIVE — data will be saved to database")
  console.log("")

  // Get SEC EDGAR filing sources
  const sources = await sql`
    SELECT fs.*, b.name as bank_name, b.ticker, b.region, b.bank_code
    FROM filing_sources fs
    JOIN banks b ON fs.bank_id = b.id
    WHERE fs.source_type = 'sec_edgar'
    ${SINGLE_BANK ? sql`AND b.bank_code = ${SINGLE_BANK}` : sql``}
    ORDER BY b.region, b.name
  `

  console.log(`📋 Found ${sources.length} SEC-registered banks to pull`)
  if (sources.length === 0) {
    console.log("No SEC sources found. Run scripts/register-filing-sources.ts first.")
    return
  }

  const client = new SecEdgarClient()
  const results = {
    banksProcessed: 0,
    filingsCreated: 0,
    dataPoints: 0,
    ratiosCreated: 0,
    errors: 0,
    skipped: 0,
  }

  for (const source of sources) {
    const label = `${source.bank_code || source.bank_id} — ${source.bank_name}`
    console.log(`\n${"═".repeat(60)}`)
    console.log(`📊 ${label}`)

    try {
      const cik = parseInt(source.source_identifier)
      if (!cik || isNaN(cik)) {
        console.log(`  ⚠️  No valid CIK, skipping`)
        results.skipped++
        continue
      }

      // ── Step 1: Fetch from SEC ──────────────────────────────────────
      console.log(`  📡 Fetching SEC data (CIK ${cik})...`)
      const facts = await client.getCompanyFacts(cik)

      if (!facts) {
        console.log(`  ⚠️  No SEC data returned`)
        results.skipped++
        await markChecked(source.id)
        continue
      }

      // ── Step 2: Extract financials ───────────────────────────────────
      const financials = client.extractFinancials(facts)
      if (financials.length === 0) {
        console.log(`  ⚠️  No financial data extracted`)
        results.skipped++
        await markChecked(source.id)
        continue
      }

      console.log(`  📊 Extracted ${financials.length} data points`)

      // ── Step 3: Get unique fiscal years ──────────────────────────────
      const years = [...new Set(financials.map(f => f.fiscal_year))].sort((a, b) => b - a)
      console.log(`  📅 Fiscal years: ${years.join(", ")}`)

      if (DRY_RUN) {
        // Show what would be saved
        const sample = financials.filter(f => f.form === "10-K").slice(0, 5)
        console.log("  📋 Sample (10-K):")
        for (const item of sample) {
          console.log(`     ${item.standardized_code.padEnd(28)} FY${item.fiscal_year}  ${item.value.toFixed(1)}M`)
        }
        results.banksProcessed++
        continue
      }

      // ── Step 4: Create filing records & save data ────────────────────
      for (const year of years) {
        const yearItems = financials.filter(f => f.fiscal_year === year && (f.form === "10-K" || f.form === "10-K/A" || f.form === "40-F" || f.form === "20-F"))
        if (yearItems.length === 0) continue

        const filingId = `sec-${source.bank_id}-${year}`

        // Check if filing already exists
        const existing = await FilingDB.getById(filingId).catch(() => null)
        if (existing) {
          console.log(`  ⏭️  FY${year} already imported, skipping`)
          continue
        }

        // Create filing record
        const firstItem = yearItems[0]
        const filingType = firstItem.form === "40-F" ? "40-F" : firstItem.form === "20-F" ? "20-F" : "10-K"
        await FilingDB.create({
          id: filingId,
          bank_id: source.bank_id,
          filing_type: filingType,
          period_end: firstItem.period_end,
          fiscal_year: year,
          filing_date: firstItem.filed_date,
          pdf_url: null,
          blob_url: null,
          status: "extracted",
          metadata: {
            source: "sec_edgar",
            cik: source.source_identifier,
            auto_imported: true,
            imported_at: new Date().toISOString(),
          },
        })
        results.filingsCreated++

        // Save standardized line items for this year
        const stdItems = yearItems.map((item, idx) => ({
          id: `${filingId}-std-${idx}`,
          bank_id: source.bank_id,
          filing_id: filingId,
          standardized_code: item.standardized_code,
          standardized_label: item.standardized_label,
          value: item.value,
          unit: item.unit,
          currency: "USD",
          period_end: item.period_end,
          fiscal_year: item.fiscal_year,
          source_line_item_id: null,
          confidence: item.confidence,
        }))

        if (stdItems.length > 0) {
          await FinancialDB.upsertStandardizedLineItems(stdItems)
          results.dataPoints += stdItems.length
        }

        // Also save REPORTED line items (as the bank originally reported them)
        const reportedItems = yearItems.map((item, idx) => ({
          id: `${filingId}-reported-${idx}`,
          filing_id: filingId,
          statement_type: item.standardized_code.startsWith("BS_") ? "balance_sheet"
            : item.standardized_code.startsWith("IS_") ? "income_statement" : "cash_flow",
          line_item: `${item.xbrl_tag} — ${item.standardized_label}`,
          value: item.value,
          unit: item.unit,
          currency: "USD",
          period_end: item.period_end,
          fiscal_year: item.fiscal_year,
          category: item.standardized_code.startsWith("BS_") ? "balance_sheet" : "income_statement",
          subcategory: null,
          line_order: idx + 1,
        }))

        if (reportedItems.length > 0) {
          await FinancialDB.upsertReportedLineItems(reportedItems)
        }

        console.log(`  ✅ FY${year}: ${stdItems.length} standardized, ${reportedItems.length} reported items saved`)
      }

      // ── Step 5: Compute ratios ───────────────────────────────────────
      const allStdItems = await FinancialDB.getStandardizedLineItems(source.bank_id)
      if (allStdItems.length > 0) {
        const computedRatios = computeAllBankRatios(source.bank_id, allStdItems)
        if (computedRatios.length > 0) {
          await FinancialDB.upsertRatios(computedRatios)
          results.ratiosCreated += computedRatios.length
          console.log(`  📈 ${computedRatios.length} ratios computed`)
        }
      }

      // Mark source as checked
      await markChecked(source.id)
      results.banksProcessed++

    } catch (err) {
      console.error(`  ❌ Error: ${err instanceof Error ? err.message : String(err)}`)
      results.errors++
      try { await markChecked(source.id) } catch {}
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────
  console.log(`\n${"═".repeat(60)}`)
  console.log("📊 PULL COMPLETE")
  console.log(`   Banks processed: ${results.banksProcessed}`)
  console.log(`   Filings created: ${results.filingsCreated}`)
  console.log(`   Data points:     ${results.dataPoints}`)
  console.log(`   Ratios computed: ${results.ratiosCreated}`)
  console.log(`   Errors:          ${results.errors}`)
  console.log(`   Skipped:         ${results.skipped}`)

  if (DRY_RUN) console.log("\n⚠️  This was a dry run. Remove --dry-run to save data.")
}

async function markChecked(sourceId: string) {
  await sql`UPDATE filing_sources SET last_checked_at = NOW() WHERE id = ${sourceId}`
}

main().catch(console.error)
