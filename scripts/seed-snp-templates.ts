/**
 * Seed S&P Capital IQ standard template into template_line_items table.
 */
import { sql } from "../lib/database"
import { SNP_INCOME_STATEMENT, SNP_BALANCE_SHEET } from "../lib/snp-template"

async function main() {
  console.log("🔄 Seeding S&P Capital IQ standard templates...")

  // Clear existing
  await sql`DELETE FROM template_line_items`
  await sql`DELETE FROM standardized_templates`

  const templateDefs = [
    { code: "snp_income_statement", name: "S&P Capital IQ — Income Statement", order: 1, items: SNP_INCOME_STATEMENT },
    { code: "snp_balance_sheet", name: "S&P Capital IQ — Balance Sheet", order: 2, items: SNP_BALANCE_SHEET },
  ]

  for (const tpl of templateDefs) {
    const tplResult = await sql`
      INSERT INTO standardized_templates (template_code, template_name, display_order)
      VALUES (${tpl.code}, ${tpl.name}, ${tpl.order})
      RETURNING id
    `
    const templateId = tplResult[0].id
    console.log(`  📋 Template: ${tpl.name} (${templateId})`)

    let count = 0
    for (const item of tpl.items) {
      await sql`
        INSERT INTO template_line_items (template_id, standardized_code, line_label, line_order, indent_level, is_bold, is_total, is_subtotal, category)
        VALUES (${templateId}, ${item.code}, ${item.label}, ${item.order}, ${item.indent}, ${item.is_calculated && item.formula === "sum" ? true : false}, ${item.is_calculated}, ${item.indent === 0 && item.is_calculated}, ${item.category})
      `
      count++
    }
    console.log(`    ✅ ${count} line items seeded`)
  }

  const count = await sql`SELECT COUNT(*) as cnt FROM template_line_items`
  console.log(`\n📊 Total template line items: ${count[0].cnt}`)
}

main().catch(console.error)
