/**
 * Register Filing Sources — Map all 50 banks to their data sources.
 * Run: npx tsx --env-file=.env.local scripts/register-filing-sources.ts
 */
import { sql, BankDB } from "../lib/database"

// CIK mappings for US banks (from SEC EDGAR)
const US_CIKS: Record<string, number> = {
  "bank-na-01": 19617,   // JPMorgan Chase
  "bank-na-02": 70858,   // Bank of America
  "bank-na-03": 831001,  // Citigroup
  "bank-na-04": 72971,   // Wells Fargo
  "bank-na-05": 886982,  // Goldman Sachs
  "bank-na-06": 895421,  // Morgan Stanley
  "bank-na-07": 1000275, // Royal Bank of Canada (cross-listed on NYSE)
  "bank-na-08": 947263,  // Toronto-Dominion (cross-listed)
  "bank-na-09": 927971,  // Bank of Montreal (cross-listed)
  "bank-na-10": 9631,    // Bank of Nova Scotia (cross-listed)
}

// SEDAR+ identifiers for Canadian banks
const SEDAR_IDS: Record<string, string> = {
  "bank-na-07": "Royal Bank of Canada",
  "bank-na-08": "Toronto-Dominion Bank",
  "bank-na-09": "Bank of Montreal",
  "bank-na-10": "Bank of Nova Scotia",
}

// Source configurations by region
const SOURCE_CONFIGS: Record<string, { type: string; baseUrl: string }> = {
  north_america: { type: "sec_edgar", baseUrl: "https://data.sec.gov/api" },
  south_america: { type: "pdf_scrape", baseUrl: "" },
  europe: { type: "pdf_scrape", baseUrl: "" },
  asia: { type: "pdf_scrape", baseUrl: "" },
  apac: { type: "pdf_scrape", baseUrl: "" },
}

async function register() {
  console.log("🔧 Registering filing sources for all 50 banks...")

  const banks = await BankDB.getAll()
  let registered = 0
  let skipped = 0

  for (const bank of banks) {
    // Check if already registered
    const existing = await sql`
      SELECT id FROM filing_sources WHERE bank_id = ${bank.id}
    `
    if (existing.length > 0) {
      skipped++
      continue
    }

    try {
      if (bank.region === "north_america") {
        const cik = US_CIKS[bank.id]
        if (cik) {
          // SEC EDGAR source
          const sourceIdentifier = String(cik)
          const paddedCik = String(cik).padStart(10, "0")
          const sourceUrl = `https://data.sec.gov/api/xbrl/companyfacts/CIK${paddedCik}.json`
          const meta = JSON.stringify({ ticker: bank.ticker || null })
          await sql`
            INSERT INTO filing_sources (bank_id, source_type, source_identifier, source_url, metadata)
            VALUES (${bank.id}, 'sec_edgar', ${sourceIdentifier}, ${sourceUrl}, ${meta}::jsonb)
          `
          console.log(`  ✅ ${bank.name}: SEC EDGAR (CIK ${cik})`)
        }

        // Also add SEDAR for Canadian banks
        if (bank.country === "Canada") {
          const sedarId = SEDAR_IDS[bank.id] || bank.name
          await sql`
            INSERT INTO filing_sources (bank_id, source_type, source_identifier, source_url, metadata)
            VALUES (${bank.id}, 'sedar', ${sedarId}, 'https://www.sedarplus.ca/', ${'{}'}::jsonb)
          `
          console.log(`  ✅ ${bank.name}: SEDAR+`)
        }
      } else {
        // Non-US banks: register as pdf_scrape for now
        const sourceType = bank.region === "europe" ? "esef" :
                          bank.country === "Japan" ? "edinet" :
                          bank.region === "apac" && bank.country === "Australia" ? "pdf_scrape" :
                          "pdf_scrape"

        await sql`
          INSERT INTO filing_sources (bank_id, source_type, source_identifier, source_url, metadata)
          VALUES (${bank.id}, ${sourceType}, ${bank.ticker || bank.name}, ${sourceType === 'esef' ? 'https://filings.xbrl.org/' : ''}, ${JSON.stringify({ country: bank.country, regulatory_body: bank.regulatory_body })}::jsonb)
        `
        console.log(`  ✅ ${bank.name}: ${sourceType}`)
      }
      registered++
    } catch (err) {
      console.error(`  ❌ ${bank.name}:`, (err as Error).message)
    }
  }

  console.log(`\n🎉 Registered ${registered} sources, ${skipped} already existed`)
}

register().catch(console.error)
