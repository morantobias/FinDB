import { sql } from "../lib/database"

async function inspect(bankCode: string) {
  const bank = await sql`SELECT id, name FROM banks WHERE bank_code = ${bankCode}`
  if (!bank[0]) { console.log("Bank not found"); return }
  const bankId = bank[0].id
  console.log(`\n=== ${bank[0].name} (${bankCode}) ===\n`)

  // Codes we have data for
  const items = await sql`
    SELECT standardized_code, standardized_label, COUNT(*) as cnt, MAX(fiscal_year) as latest
    FROM standardized_line_items WHERE bank_id = ${bankId}
    GROUP BY standardized_code, standardized_label ORDER BY standardized_code
  `
  console.log(`${items.length} unique standardized codes with data:`)
  for (const i of items) {
    console.log(`  ${i.standardized_code.padEnd(35)} ${String(i.cnt).padStart(2)} periods  latest: FY${i.latest}`)
  }

  // Template vs data comparison
  console.log(`\nBalance Sheet Template Coverage:`)
  const templates = await sql`
    SELECT tli.standardized_code, tli.line_label
    FROM template_line_items tli
    JOIN standardized_templates st ON tli.template_id = st.id
    WHERE st.template_code = 'BS_BANK' ORDER BY tli.line_order
  `
  let matched = 0
  for (const t of templates) {
    const has = items.find((i: any) => i.standardized_code === t.standardized_code)
    console.log(`${has ? '✅' : '❌'} ${t.standardized_code.padEnd(40)} ${t.line_label}`)
    if (has) matched++
  }
  console.log(`\nMatched: ${matched}/${templates.length}`)

  // Income Statement
  console.log(`\nIncome Statement Template Coverage:`)
  const isTemplates = await sql`
    SELECT tli.standardized_code, tli.line_label
    FROM template_line_items tli
    JOIN standardized_templates st ON tli.template_id = st.id
    WHERE st.template_code = 'IS_BANK' ORDER BY tli.line_order
  `
  let isMatched = 0
  for (const t of isTemplates) {
    const has = items.find((i: any) => i.standardized_code === t.standardized_code)
    console.log(`${has ? '✅' : '❌'} ${t.standardized_code.padEnd(40)} ${t.line_label}`)
    if (has) isMatched++
  }
  console.log(`\nMatched: ${isMatched}/${isTemplates.length}`)
}

const bankCode = process.argv.find(a => a.startsWith("--bank="))?.split("=")[1] || "NA01"
inspect(bankCode).catch(console.error)
