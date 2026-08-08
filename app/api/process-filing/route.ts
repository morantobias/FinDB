/**
 * POST /api/process-filing — AI-Powered Financial Data Extraction
 *
 * Downloads the filing PDF, parses it, and uses GPT to extract:
 *   1. Reported line items (balance sheet, income statement, cash flow)
 *   2. Standardized line items (mapped to common codes)
 *   3. Key ratios (auto-computed from standardized data)
 *
 * This is the core extraction engine that powers FinDB.
 */
import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { getOpenAIModel } from "@/lib/openai-config"
import { FilingDB, FinancialDB } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { filingId } = await request.json()
    if (!filingId) {
      return NextResponse.json({ error: "filingId required" }, { status: 400 })
    }

    const filing = await FilingDB.getById(filingId)
    if (!filing) {
      return NextResponse.json({ error: "Filing not found" }, { status: 404 })
    }

    // Update status
    await FilingDB.updateStatus(filingId, "processing")

    // Download PDF
    const pdfUrl = filing.blob_url || filing.pdf_url
    if (!pdfUrl) {
      throw new Error("No PDF URL available for this filing")
    }

    console.log(`📥 Downloading PDF for extraction: ${filingId}`)
    const pdfResponse = await fetch(pdfUrl)
    if (!pdfResponse.ok) throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`)
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer())
    console.log(`📄 PDF downloaded: ${(pdfBuffer.length / 1024 / 1024).toFixed(1)}MB`)

    // Parse PDF
    const pdfParse = (await import("pdf-parse")).default
    const pdfData = await pdfParse(pdfBuffer)
    const fullText = pdfData.text || ""

    if (fullText.length < 200) {
      throw new Error("PDF text extraction returned insufficient content")
    }

    console.log(`📖 Extracted ${fullText.length} characters of text`)

    // ── Extract Financial Statements with AI ──────────────────────────
    const extractionResult = await extractFinancialStatements(fullText, filing)
    console.log(`✅ AI extraction complete: ${extractionResult.reportedItems.length} line items, ${extractionResult.standardizedItems.length} standardized, ${extractionResult.ratios.length} ratios`)

    // ── Save to database ──────────────────────────────────────────────
    if (extractionResult.reportedItems.length > 0) {
      await FinancialDB.upsertReportedLineItems(extractionResult.reportedItems)
    }
    if (extractionResult.standardizedItems.length > 0) {
      await FinancialDB.upsertStandardizedLineItems(extractionResult.standardizedItems)
    }
    if (extractionResult.ratios.length > 0) {
      await FinancialDB.upsertRatios(extractionResult.ratios)
    }

    await FilingDB.updateStatus(filingId, "extracted")

    return NextResponse.json({
      success: true,
      filingId,
      summary: {
        reportedItems: extractionResult.reportedItems.length,
        standardizedItems: extractionResult.standardizedItems.length,
        ratios: extractionResult.ratios.length,
      },
    })
  } catch (error) {
    console.error("Processing error:", error)
    // Update status to error
    try {
      const { filingId } = await request.json().catch(() => ({ filingId: null }))
      if (filingId) await FilingDB.updateStatus(filingId, "error")
    } catch {}

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    )
  }
}

/**
 * AI-powered financial statement extraction.
 * Uses GPT to identify line items from raw PDF text and map them
 * to standardized codes.
 */
async function extractFinancialStatements(
  fullText: string,
  filing: any,
): Promise<{
  reportedItems: any[]
  standardizedItems: any[]
  ratios: any[]
}> {
  // Take representative chunks (first 15K chars for BS, middle for IS)
  const textSample = fullText.substring(0, 30000)

  const prompt = `You are a financial data extraction system. Extract structured financial data from this bank regulatory filing text.

FILING INFO:
- Bank: ${filing.bank_id}
- Type: ${filing.filing_type}
- Period: ${filing.period_end}
- Fiscal Year: ${filing.fiscal_year}

DOCUMENT TEXT (first 30,000 chars):
${textSample}

Extract the following into a STRICT JSON object with NO additional text:

1. REPORTED LINE ITEMS — Extract key financial line items as reported in the document:
{
  "reportedItems": [
    {
      "statement_type": "balance_sheet" | "income_statement" | "cash_flow",
      "line_item": "exact name as in document",
      "value": number (in millions USD),
      "unit": "millions",
      "currency": "USD",
      "category": "Assets" | "Liabilities" | "Equity" | "Revenue" | "Expenses" | etc,
      "line_order": number
    }
  ]
}

2. STANDARDIZED ITEMS — Map reported items to standardized codes:
Available codes: BS_TOTAL_ASSETS, BS_CASH_AND_EQUIVALENTS, BS_NET_LOANS, BS_TOTAL_DEPOSITS, BS_TOTAL_EQUITY, BS_TOTAL_LIABILITIES, BS_CET1_CAPITAL, BS_RWA, IS_NET_INTEREST_INCOME, IS_NONINTEREST_INCOME, IS_TOTAL_REVENUE, IS_OPERATING_EXPENSE, IS_PROVISION_EXPENSE, IS_NET_INCOME, CAP_CET1_RATIO, CAP_TIER1_RATIO, CAP_TOTAL_CAPITAL_RATIO, CAP_LEVERAGE_RATIO
{
  "standardizedItems": [
    {
      "standardized_code": "BS_TOTAL_ASSETS",
      "standardized_label": "Total Assets",
      "value": number (in millions USD),
      "confidence": 0.0-1.0
    }
  ]
}

3. KEY RATIOS — Calculate or extract key financial ratios:
{
  "ratios": [
    {
      "ratio_code": "ROA",
      "ratio_name": "Return on Assets",
      "value": number,
      "unit": "%",
      "category": "earnings"
    }
  ]
}

IMPORTANT: 
- Return ONLY valid JSON, no markdown, no explanations
- All values in millions USD
- Extract as many line items as you can find
- Only include items you can actually find in the text
- Set confidence based on how clearly the value is stated`

  const { text: result } = await generateText({
    model: getOpenAIModel("chat"),
    prompt,
    temperature: 0.1,
  })

  // Parse the JSON response
  let data: any = { reportedItems: [], standardizedItems: [], ratios: [] }
  try {
    // Try to find JSON in the response
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      data = JSON.parse(jsonMatch[0])
    }
  } catch (err) {
    console.error("Failed to parse extraction result:", err)
    console.log("Raw result:", result.substring(0, 500))
  }

  // Assign IDs and filing references
  const now = new Date().toISOString()
  const filingId = filing.id
  const bankId = filing.bank_id

  const reportedItems = (data.reportedItems || []).map((item: any, i: number) => ({
    id: `${filingId}-reported-${i}`,
    filing_id: filingId,
    statement_type: item.statement_type || "balance_sheet",
    line_item: item.line_item || "Unknown",
    value: Number(item.value) || 0,
    unit: item.unit || "millions",
    currency: item.currency || "USD",
    period_end: filing.period_end,
    fiscal_year: filing.fiscal_year,
    category: item.category || null,
    subcategory: null,
    line_order: item.line_order || i + 1,
  }))

  const standardizedItems = (data.standardizedItems || []).map((item: any, i: number) => ({
    id: `${filingId}-std-${i}`,
    bank_id: bankId,
    filing_id: filingId,
    standardized_code: item.standardized_code || "UNKNOWN",
    standardized_label: item.standardized_label || item.standardized_code || "Unknown",
    value: Number(item.value) || 0,
    unit: "millions",
    currency: "USD",
    period_end: filing.period_end,
    fiscal_year: filing.fiscal_year,
    source_line_item_id: null,
    confidence: Number(item.confidence) || 0.5,
  }))

  const ratios = (data.ratios || []).map((item: any, i: number) => ({
    id: `${filingId}-ratio-${i}`,
    bank_id: bankId,
    filing_id: filingId,
    ratio_code: item.ratio_code || `RATIO-${i}`,
    ratio_name: item.ratio_name || item.ratio_code || `Ratio ${i}`,
    value: Number(item.value) || 0,
    unit: item.unit || "%",
    category: item.category || "earnings",
    period_end: filing.period_end,
    fiscal_year: filing.fiscal_year,
    peer_group_median: null,
    peer_group_percentile: null,
  }))

  return { reportedItems, standardizedItems, ratios }
}
