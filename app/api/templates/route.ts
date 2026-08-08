/**
 * GET /api/templates — Retrieve standardized financial template line items.
 * Query: ?type=balance_sheet|income_statement|cash_flow
 */
import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "balance_sheet"

  const templateCode = type === "income_statement" ? "IS_BANK"
    : type === "cash_flow" ? "CF_BANK"
    : "BS_BANK"

  try {
    const lines = await sql`
      SELECT tli.*
      FROM template_line_items tli
      JOIN standardized_templates st ON tli.template_id = st.id
      WHERE st.template_code = ${templateCode}
      ORDER BY tli.line_order
    `
    return NextResponse.json({ lines, templateCode })
  } catch (error) {
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}
