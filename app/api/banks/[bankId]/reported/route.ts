/**
 * GET /api/banks/[bankId]/reported — ALL reported line items for a bank
 */
import { NextRequest, NextResponse } from "next/server"
import { BankDB, FinancialDB } from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bankId: string }> }
) {
  const { bankId } = await params
  const { searchParams } = new URL(request.url)
  const statementType = searchParams.get("type") || "balance_sheet"
  const fiscalYear = searchParams.get("year")

  try {
    const bank = await BankDB.getById(bankId)
    if (!bank) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 })
    }

    const items = await FinancialDB.getReportedLineItemsByBankId(bankId)

    // Filter by statement type and optionally by year
    let filtered = items.filter((i: any) => i.statement_type === statementType)

    if (fiscalYear) {
      filtered = filtered.filter((i: any) => i.fiscal_year === parseInt(fiscalYear))
    }

    return NextResponse.json({
      bank_id: bankId,
      statement_type: statementType,
      total: filtered.length,
      items: filtered,
    })
  } catch (error) {
    console.error("Error fetching reported items:", error)
    return NextResponse.json({ error: "Failed to fetch reported data" }, { status: 500 })
  }
}
