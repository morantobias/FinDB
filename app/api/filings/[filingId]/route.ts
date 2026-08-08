/**
 * GET /api/filings/[filingId] — Filing details with reported line items.
 */
import { NextRequest, NextResponse } from "next/server"
import { FilingDB, FinancialDB, BankDB } from "@/lib/database"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filingId: string }> }
) {
  const { filingId } = await params

  try {
    const filing = await FilingDB.getById(filingId)
    if (!filing) {
      return NextResponse.json({ error: "Filing not found" }, { status: 404 })
    }

    const [bank, lineItems] = await Promise.all([
      BankDB.getById(filing.bank_id),
      FinancialDB.getReportedLineItems(filingId),
    ])

    return NextResponse.json({
      filing,
      bank: bank ? { id: bank.id, name: bank.name, ticker: bank.ticker, country: bank.country, region: bank.region } : null,
      reportedLineItems: lineItems,
    })
  } catch (error) {
    console.error("Error fetching filing:", error)
    return NextResponse.json({ error: "Failed to fetch filing" }, { status: 500 })
  }
}
