/**
 * Seed SNL Financial standard template into template_line_items table.
 */
import { sql } from "../lib/database"
import { SNL_INCOME_STATEMENT, SNL_BALANCE_SHEET } from "../lib/snl-template"

async function main() {
  console.log("🔄 Seeding SNL Financial standard templates...")

  // Clear existing
  await sql`DELETE FROM template_line_items`
  await sql`DELETE FROM standardized_templates`

  const templateDefs = [
    { code: "snl_income_statement", name: "SNL Financial — Income Statement", order: 1, items: SNL_INCOME_STATEMENT },
    { code: "snl_balance_sheet", name: "SNL Financial — Balance Sheet", order: 2, items: SNL_BALANCE_SHEET },
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
