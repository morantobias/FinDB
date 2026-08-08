/**
 * POST /api/standardize — Standardize reported line items and compute ratios.
 *
 * Chains: standardizeLineItems → upsert standardized → computeRatios → upsert ratios
 */
import { type NextRequest, NextResponse } from "next/server"
import { FinancialDB } from "@/lib/database"
import { standardizeLineItems, quickStandardize } from "@/lib/standardization-engine"
import { computeAllBankRatios } from "@/lib/ratio-calculator"

export async function POST(request: NextRequest) {
  try {
    const { filingId, bankId } = await request.json()
    if (!filingId || !bankId) {
      return NextResponse.json({ error: "filingId and bankId required" }, { status: 400 })
    }

    // Get reported line items
    const reportedItems = await FinancialDB.getReportedLineItems(filingId)
    if (reportedItems.length === 0) {
      return NextResponse.json({ error: "No reported line items found. Process filing first." }, { status: 400 })
    }

    console.log(`🔄 Standardizing ${reportedItems.length} line items for filing ${filingId}`)

    // Step 1: Quick rule-based standardization first (instant)
    const quickResults = quickStandardize(reportedItems)
    console.log(`📏 Quick standardization: ${quickResults.length} matches`)

    // Step 2: AI-powered standardization for remaining items
    const alreadyMapped = new Set(quickResults.map(r => r.reportedItemId))
    const unmappedItems = reportedItems.filter((i: any) => !alreadyMapped.has(i.id))

    let aiResults: any[] = []
    if (unmappedItems.length > 0) {
      console.log(`🤖 AI standardization for ${unmappedItems.length} remaining items...`)
      aiResults = await standardizeLineItems(unmappedItems)
      console.log(`🤖 AI standardization: ${aiResults.length} additional matches`)
    }

    const allResults = [...quickResults, ...aiResults]

    // Step 3: Build standardized line items
    const reportingItemMap = new Map(reportedItems.map((i: any) => [i.id, i]))
    const standardizedItems = allResults.map((result, idx) => {
      const sourceItem = reportingItemMap.get(result.reportedItemId)
      return {
        id: `${filingId}-std-${idx}`,
        bank_id: bankId,
        filing_id: filingId,
        standardized_code: result.standardizedCode,
        standardized_label: result.standardizedLabel || result.standardizedCode || "",
        value: sourceItem?.value || 0,
        unit: "millions",
        currency: "USD",
        period_end: sourceItem?.period_end || new Date().toISOString().split('T')[0],
        fiscal_year: sourceItem?.fiscal_year || new Date().getFullYear(),
        source_line_item_id: result.reportedItemId,
        confidence: result.confidence,
      }
    })

    // Save standardized items
    if (standardizedItems.length > 0) {
      await FinancialDB.upsertStandardizedLineItems(standardizedItems)
    }

    // Step 4: Compute ratios
    const ratios = computeAllBankRatios(bankId, standardizedItems)
    if (ratios.length > 0) {
      await FinancialDB.upsertRatios(ratios)
    }

    return NextResponse.json({
      success: true,
      filingId,
      summary: {
        reportedItems: reportedItems.length,
        standardizedItems: standardizedItems.length,
        ratios: ratios.length,
        quickMatches: quickResults.length,
        aiMatches: aiResults.length,
      },
    })
  } catch (error) {
    console.error("Standardization error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Standardization failed" },
      { status: 500 }
    )
  }
}
