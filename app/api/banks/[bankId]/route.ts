/**
 * GET /api/banks/[bankId] — Bank detail with filings, ratios, and financial summary.
 */
import { NextRequest, NextResponse } from "next/server"
import { BankDB, FilingDB, FinancialDB } from "@/lib/database"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bankId: string }> }
) {
  const { bankId } = await params

  try {
    const bank = await BankDB.getById(bankId)
    if (!bank) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 })
    }

    const [filings, standardizedItems, ratios] = await Promise.all([
      FilingDB.getByBankId(bankId),
      FinancialDB.getStandardizedLineItems(bankId),
      FinancialDB.getRatios(bankId),
    ])

    return NextResponse.json({
      bank,
      filings,
      standardizedFinancials: standardizedItems,
      ratios,
    })
  } catch (error) {
    console.error("Error fetching bank:", error)
    return NextResponse.json({ error: "Failed to fetch bank data" }, { status: 500 })
  }
}
