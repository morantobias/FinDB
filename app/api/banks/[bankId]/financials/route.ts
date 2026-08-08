/**
 * GET /api/banks/[bankId]/financials — Standardized financial data for a bank.
 * Query params: ?codes=BS_TOTAL_ASSETS,IS_NET_INCOME (optional filter)
 */
import { NextRequest, NextResponse } from "next/server"
import { BankDB, FinancialDB } from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bankId: string }> }
) {
  const { bankId } = await params
  const { searchParams } = new URL(request.url)
  const codesParam = searchParams.get("codes")

  try {
    const bank = await BankDB.getById(bankId)
    if (!bank) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 })
    }

    if (codesParam) {
      const codes = codesParam.split(",")
      const results: Record<string, any[]> = {}
      for (const code of codes) {
        results[code] = await FinancialDB.getStandardizedByCode(bankId, code.trim())
      }
      return NextResponse.json({ bank_id: bankId, financials: results })
    }

    const items = await FinancialDB.getStandardizedLineItems(bankId)
    return NextResponse.json({ bank_id: bankId, financials: items })
  } catch (error) {
    console.error("Error fetching financials:", error)
    return NextResponse.json({ error: "Failed to fetch financial data" }, { status: 500 })
  }
}
