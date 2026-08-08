/**
 * GET /api/cron/refresh-financials — Weekly financial data refresh.
 *
 * Invoked by Vercel Cron (every Monday 06:00 UTC).
 * For each active filing source: check for new filings → fetch → standardize → store.
 *
 * Protected by CRON_SECRET header.
 */
import { NextRequest, NextResponse } from "next/server"
import { SecEdgarClient, type ExtractedFinancial } from "@/lib/sec-edgar-client"
import { BankDB, FilingDB, FinancialDB } from "@/lib/database"
import { sql } from "@/lib/database"

export const maxDuration = 300 // 5 minutes max (Vercel Pro)

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()
  const log: string[] = []
  const results = { banksProcessed: 0, filingsCreated: 0, dataPoints: 0, errors: 0 }

  try {
    // Get all active filing sources
    const sources = await sql`
      SELECT fs.*, b.name as bank_name, b.ticker, b.country
      FROM filing_sources fs
      JOIN banks b ON fs.bank_id = b.id
      WHERE fs.status = 'active'
      AND (fs.last_checked_at IS NULL OR fs.last_checked_at < NOW() - INTERVAL '6 days')
      ORDER BY fs.source_type = 'sec_edgar' DESC
    `

    log.push(`Found ${sources.length} sources to check`)

    const secClient = new SecEdgarClient()

    for (const source of sources) {
      try {
        log.push(`\n📊 Processing: ${source.bank_name} (${source.ticker || 'N/A'}) — ${source.source_type}`)

        if (source.source_type === "sec_edgar" && source.source_identifier) {
          const cik = parseInt(source.source_identifier)
          const facts = await secClient.getCompanyFacts(cik)

          if (!facts) {
            log.push(`  ⚠️ No SEC data found for CIK ${cik}`)
            await markChecked(source.id)
            continue
          }

          const financials = secClient.extractFinancials(facts)
          if (financials.length === 0) {
            log.push(`  ⚠️ No financial data extracted`)
            await markChecked(source.id)
            continue
          }

          // Create a filing record for the latest annual report
          const latestAnnual = financials.find(f => f.form === "10-K")
          if (latestAnnual) {
            const filingId = `sec-${source.bank_id}-${latestAnnual.fiscal_year}`

            // Check if we already have this filing
            const existing = await FilingDB.getById(filingId).catch(() => null)
            if (existing) {
              log.push(`  ⏭️ Filing ${filingId} already exists, skipping`)
            } else {
              await FilingDB.create({
                id: filingId,
                bank_id: source.bank_id,
                filing_type: "10-K",
                period_end: latestAnnual.period_end,
                fiscal_year: latestAnnual.fiscal_year,
                filing_date: latestAnnual.filed_date,
                pdf_url: null,
                blob_url: null,
                status: "extracted",
                metadata: { source: "sec_edgar", cik: source.source_identifier, auto_imported: true },
              })
              results.filingsCreated++
              log.push(`  ✅ Created 10-K filing FY${latestAnnual.fiscal_year}`)
            }

            // Break into annual and quarterly
            const annualItems = financials.filter(f => f.form === "10-K")
            const quarterlyItems = financials.filter(f => f.form === "10-Q")

            // Save standardized line items for each period
            await saveStandardizedItems(source.bank_id, filingId, annualItems, results, log)
            await saveStandardizedItems(source.bank_id, filingId, quarterlyItems, results, log)
          }

          results.banksProcessed++

          // Update last filing date
          const latestDate = financials[0]?.filed_date
          await sql`
            UPDATE filing_sources
            SET last_checked_at = NOW(), last_filing_date = ${latestDate || null}
            WHERE id = ${source.id}
          `
        } else {
          log.push(`  ⏭️ Unsupported source type: ${source.source_type}`)
        }
      } catch (err) {
        log.push(`  ❌ Error: ${err instanceof Error ? err.message : String(err)}`)
        results.errors++
        // Still mark as checked so we don't retry endlessly
        await markChecked(source.id)
      }
    }
  } catch (error) {
    console.error("Cron refresh error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      log,
    }, { status: 500 })
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1)
  log.push(`\n✅ Refresh complete in ${duration}s — ${results.banksProcessed} banks, ${results.filingsCreated} filings, ${results.dataPoints} data points, ${results.errors} errors`)

  return NextResponse.json({
    success: true,
    duration: `${duration}s`,
    ...results,
    log,
  })
}

async function markChecked(sourceId: string) {
  await sql`UPDATE filing_sources SET last_checked_at = NOW() WHERE id = ${sourceId}`
}

async function saveStandardizedItems(
  bankId: string,
  filingId: string,
  items: ExtractedFinancial[],
  results: { dataPoints: number },
  _log: string[],
) {
  if (items.length === 0) return

  const toInsert = items.map((item, idx) => ({
    id: `${filingId}-std-sec-${item.fiscal_year}-${item.form}-${idx}`,
    bank_id: bankId,
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

  try {
    await FinancialDB.upsertStandardizedLineItems(toInsert)
    results.dataPoints += toInsert.length
  } catch (err) {
    // Individual item failures shouldn't block the pipeline
    console.error(`Failed to save standardized items for ${filingId}:`, (err as Error).message)
  }
}
