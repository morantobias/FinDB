import { sql } from "../lib/database"

async function clear() {
  await sql`DELETE FROM reported_line_items`
  await sql`DELETE FROM standardized_line_items`
  await sql`DELETE FROM key_ratios`
  await sql`DELETE FROM filings`
  console.log("Cleared all financial data.")
}
clear().catch(console.error)
