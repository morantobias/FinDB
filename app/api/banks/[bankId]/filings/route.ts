/**
 * GET /api/banks/[bankId]/filings — List filings for a bank.
 */
import { NextRequest, NextResponse } from "next/server"
import { BankDB, FilingDB } from "@/lib/database"

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

    const filings = await FilingDB.getByBankId(bankId)
    return NextResponse.json({ filings })
  } catch (error) {
    console.error("Error fetching filings:", error)
    return NextResponse.json({ error: "Failed to fetch filings" }, { status: 500 })
  }
}
