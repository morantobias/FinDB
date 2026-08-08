/**
 * GET /api/banks — List all banks, optionally filtered by region.
 */
import { NextRequest, NextResponse } from "next/server"
import { BankDB } from "@/lib/database"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const region = searchParams.get("region")

  try {
    const banks = await BankDB.getAll(region || undefined)
    return NextResponse.json({ banks })
  } catch (error) {
    console.error("Error fetching banks:", error)
    return NextResponse.json({ error: "Failed to fetch banks" }, { status: 500 })
  }
}
