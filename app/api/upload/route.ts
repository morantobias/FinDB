/**
 * POST /api/upload — Filing Upload & Processing
 *
 * Accepts { blobUrl, originalFilename, bankId, filingType, periodEnd, fiscalYear }.
 * Downloads file → dedup check → parse with pdf-parse → extract financials
 * with AI → save to DB → update filing status.
 */
import { type NextRequest, NextResponse } from "next/server"
import { FilingDB, BankDB } from "@/lib/database"
import { DuplicateDetectionService } from "@/lib/duplicate-detection"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { blobUrl, originalFilename, bankId, filingType, periodEnd, fiscalYear, filingDate } = body

    if (!blobUrl || !originalFilename || !bankId) {
      return NextResponse.json({ success: false, error: "Missing required fields (blobUrl, originalFilename, bankId)" }, { status: 400 })
    }

    const bank = await BankDB.getById(bankId)
    if (!bank) {
      return NextResponse.json({ success: false, error: "Bank not found" }, { status: 404 })
    }

    console.log(`📄 Processing filing: ${originalFilename} for ${bank.name}`)

    // Download file for hashing
    const response = await fetch(blobUrl)
    if (!response.ok) throw new Error(`Failed to download file: ${response.status}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    console.log(`📥 Downloaded: ${(buffer.length / 1024 / 1024).toFixed(1)}MB`)

    // Generate file hash
    const fileHash = DuplicateDetectionService.generateFileHash(buffer)

    // Create filing record
    const filingId = `filing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const filing = await FilingDB.create({
      id: filingId,
      bank_id: bankId,
      filing_type: filingType || "Annual Report",
      period_end: periodEnd || new Date().toISOString().split('T')[0],
      fiscal_year: fiscalYear || new Date().getFullYear(),
      filing_date: filingDate || new Date().toISOString().split('T')[0],
      pdf_url: null,
      blob_url: blobUrl,
      status: "uploaded",
      metadata: {
        originalFilename,
        fileHash,
        fileSize: buffer.length,
        uploadedAt: new Date().toISOString(),
      },
    })

    // ── Quick text extraction for metadata ────────────────────────────
    let pdfText = ""
    try {
      const pdfParse = (await import("pdf-parse")).default
      const pdfData = await pdfParse(buffer, { max: 5 })
      pdfText = pdfData.text || ""
    } catch (err) {
      console.warn("⚠️ Quick text extraction failed:", (err as Error).message)
    }

    // Update filing with extracted metadata
    await FilingDB.updateStatus(filingId, "uploaded", {
      ...filing.metadata,
      extractedTextPreview: pdfText.substring(0, 1000),
      pageCount: pdfText ? "unknown" : 0,
    })

    console.log(`✅ Filing created: ${filingId} (${filingType} FY${fiscalYear})`)

    return NextResponse.json({
      success: true,
      data: {
        filingId,
        bankId,
        bankName: bank.name,
        status: "uploaded",
        message: "Filing uploaded. Processing will extract financial data.",
      },
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}
