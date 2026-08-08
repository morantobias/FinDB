/**
 * GET /api/compare — Cross-bank comparison data for charts.
 *
 * Query params:
 *   ?codes=BS_TOTAL_ASSETS,IS_NET_INCOME  — standardized codes to compare
 *   &region=north_america                   — optional region filter
 *   &period=2024                            — optional fiscal year filter
 *
 * Returns chart-ready data for BankComparisonChart.
 */
import { NextRequest, NextResponse } from "next/server"
import { BankDB, FinancialDB } from "@/lib/database"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const codesParam = searchParams.get("codes")
  const region = searchParams.get("region")
  const period = searchParams.get("period")

  if (!codesParam) {
    return NextResponse.json({ error: "codes query parameter required (comma-separated)" }, { status: 400 })
  }

  const codes = codesParam.split(",").map(c => c.trim())

  try {
    const banks = await BankDB.getAll(region || undefined)
    if (banks.length === 0) {
      return NextResponse.json({ error: "No banks found" }, { status: 404 })
    }

    const results: any[] = []

    for (const code of codes) {
      for (const bank of banks) {
        const items = await FinancialDB.getStandardizedByCode(bank.id, code)
        if (items.length > 0) {
          // Get latest period or specified period
          const item = period
            ? items.find((i: any) => String(i.fiscal_year) === period)
            : items[0]
          if (item) {
            results.push({
              bank_id: bank.id,
              bank_name: bank.name,
              ticker: bank.ticker,
              region: bank.region,
              country: bank.country,
              code,
              value: Number(item.value),
              unit: item.unit,
              period: item.period_end,
              fiscal_year: item.fiscal_year,
            })
          }
        }
      }
    }

    return NextResponse.json({ results, codes, banksCompared: banks.length })
  } catch (error) {
    console.error("Comparison error:", error)
    return NextResponse.json({ error: "Failed to fetch comparison data" }, { status: 500 })
  }
}
