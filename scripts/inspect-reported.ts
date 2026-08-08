import { sql } from "../lib/database"

async function inspect(bankCode: string, year: number) {
  const bank = await sql`SELECT id, name FROM banks WHERE bank_code = ${bankCode}`
  const bankId = bank[0].id
  const filingId = `sec-${bankId}-${year}`

  console.log(`\n=== ${bank[0].name} FY${year} ===`)
  
  console.log(`\nREPORTED LINE ITEMS (first 15):`)
  const reported = await sql`
    SELECT line_item, value, unit, statement_type 
    FROM reported_line_items WHERE filing_id = ${filingId} 
    ORDER BY line_order LIMIT 15
  `
  for (const r of reported) {
    console.log(`  ${r.statement_type.padEnd(14)} ${r.line_item.padEnd(65)} ${String(r.value).padStart(12)} ${r.unit}`)
  }

  console.log(`\nSTANDARDIZED (first 15):`)
  const std = await sql`
    SELECT standardized_code, standardized_label, value, unit 
    FROM standardized_line_items WHERE filing_id = ${filingId} 
    ORDER BY standardized_code LIMIT 15
  `
  for (const s of std) {
    console.log(`  ${s.standardized_code.padEnd(38)} ${s.standardized_label.padEnd(45)} ${String(s.value).padStart(12)} ${s.unit}`)
  }
}

inspect(process.argv.find(a => a.startsWith("--bank="))?.split("=")[1] || "NA02", 2025).catch(console.error)
