/**
 * Migration v3 — Add bank_code column for structured alphanumeric bank IDs.
 * Format: NA01-NA10 (North America), SA01-SA10 (South America),
 *         EU01-EU10 (Europe), AS01-AS10 (Asia), AP01-AP10 (APAC)
 * Run: npx tsx --env-file=.env.local scripts/migrate-v3.ts
 */
import { sql } from "../lib/database"

const REGION_PREFIXES: Record<string, string> = {
  north_america: "NA",
  south_america: "SA",
  europe: "EU",
  asia: "AS",
  apac: "AP",
}

const BANK_CODE_MAP: Record<string, string> = {
  "bank-na-01": "NA01", "bank-na-02": "NA02", "bank-na-03": "NA03",
  "bank-na-04": "NA04", "bank-na-05": "NA05", "bank-na-06": "NA06",
  "bank-na-07": "NA07", "bank-na-08": "NA08", "bank-na-09": "NA09",
  "bank-na-10": "NA10",
  "bank-sa-01": "SA01", "bank-sa-02": "SA02", "bank-sa-03": "SA03",
  "bank-sa-04": "SA04", "bank-sa-05": "SA05", "bank-sa-06": "SA06",
  "bank-sa-07": "SA07", "bank-sa-08": "SA08", "bank-sa-09": "SA09",
  "bank-sa-10": "SA10",
  "bank-eu-01": "EU01", "bank-eu-02": "EU02", "bank-eu-03": "EU03",
  "bank-eu-04": "EU04", "bank-eu-05": "EU05", "bank-eu-06": "EU06",
  "bank-eu-07": "EU07", "bank-eu-08": "EU08", "bank-eu-09": "EU09",
  "bank-eu-10": "EU10",
  "bank-as-01": "AS01", "bank-as-02": "AS02", "bank-as-03": "AS03",
  "bank-as-04": "AS04", "bank-as-05": "AS05", "bank-as-06": "AS06",
  "bank-as-07": "AS07", "bank-as-08": "AS08", "bank-as-09": "AS09",
  "bank-as-10": "AS10",
  "bank-ap-01": "AP01", "bank-ap-02": "AP02", "bank-ap-03": "AP03",
  "bank-ap-04": "AP04", "bank-ap-05": "AP05", "bank-ap-06": "AP06",
  "bank-ap-07": "AP07", "bank-ap-08": "AP08", "bank-ap-09": "AP09",
  "bank-ap-10": "AP10",
}

async function migrate() {
  console.log("🔧 Running FinDB v3 migration — bank codes...")

  // Add bank_code column
  await sql`ALTER TABLE banks ADD COLUMN IF NOT EXISTS bank_code TEXT UNIQUE`
  console.log("  ✅ bank_code column added")

  // Populate bank_code for all banks using the mapping
  for (const [oldId, newCode] of Object.entries(BANK_CODE_MAP)) {
    await sql`
      UPDATE banks SET bank_code = ${newCode} WHERE id = ${oldId}
    `
  }
  console.log(`  ✅ ${Object.keys(BANK_CODE_MAP).length} bank codes assigned`)

  // Create index
  await sql`CREATE INDEX IF NOT EXISTS idx_banks_bank_code ON banks(bank_code)`
  console.log("  ✅ bank_code index created")

  console.log("🎉 Migration v3 complete!")
}

migrate().catch(console.error)
