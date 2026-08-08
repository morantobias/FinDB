/**
 * GET /api/research — List recent research queries.
 * POST /api/research — Cross-bank AI research engine.
 */
import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { getOpenAIModel } from "@/lib/openai-config"
import { BankDB, FilingDB, FinancialDB, ResearchDB } from "@/lib/database"

export async function GET() {
  try {
    const queries = await ResearchDB.getRecent(20)
    return NextResponse.json({ queries })
  } catch (error) {
    console.error("Error fetching research history:", error)
    return NextResponse.json({ error: "Failed to fetch research history" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json()
    if (!question) {
      return NextResponse.json({ error: "Question required" }, { status: 400 })
    }

    // Create research query record
    const queryId = await ResearchDB.createQuery(question)

    // Update status to analyzing
    await ResearchDB.updateResult(queryId, { status: "analyzing" })

    // ── Gather all available data ────────────────────────────────────
    const allBanks = await BankDB.getAll()
    if (allBanks.length === 0) {
      return NextResponse.json({
        queryId,
        response: "No bank data is available yet. Please seed the database first.",
        status: "complete",
      })
    }

    // Build a comprehensive data context
    const bankDataPromises = allBanks.map(async (bank) => {
      const [filings, ratios] = await Promise.all([
        FilingDB.getByBankId(bank.id),
        FinancialDB.getRatios(bank.id),
      ])

      // Get latest key ratios
      const latestRatios = ratios
        .filter((r: any) => r.fiscal_year === Math.max(...ratios.map((x: any) => x.fiscal_year), 0))
        .slice(0, 20)

      return {
        bank_id: bank.id,
        bank_name: bank.name,
        ticker: bank.ticker,
        country: bank.country,
        region: bank.region,
        total_assets: bank.total_assets,
        filings_count: filings.length,
        latest_filing: filings[0] ? {
          type: filings[0].filing_type,
          period: filings[0].period_end,
          year: filings[0].fiscal_year,
        } : null,
        key_ratios: latestRatios.map((r: any) => ({
          name: r.ratio_name,
          value: r.value,
          unit: r.unit,
          category: r.category,
          period: r.period_end,
        })),
      }
    })

    const bankData = await Promise.all(bankDataPromises)

    // Build a dense financial context
    const contextParts = bankData.map(b => {
      const ratioStr = b.key_ratios
        .map((r: any) => `  - ${r.name}: ${r.value}${r.unit || ''} (${r.period})`)
        .join("\n")
      return `### ${b.bank_name} (${b.ticker || 'N/A'}) — ${b.country}, ${b.region}
Total Assets: ${b.total_assets ? `$${(b.total_assets / 1e9).toFixed(1)}B` : 'N/A'}
Latest Filing: ${b.latest_filing ? `${b.latest_filing.type} FY${b.latest_filing.year}` : 'None'}
Key Ratios:
${ratioStr || '  No ratio data available.'}`
    }).join("\n\n")

    // ── Generate research response ────────────────────────────────────
    const prompt = `You are a senior bank research analyst at a top-tier financial institution. You have access to a comprehensive database of global banks with standardized financial data.

AVAILABLE BANK DATA:
${contextParts}

RESEARCH QUESTION: "${question}"

Instructions:
1. Answer the question using ALL available data across banks
2. Compare and contrast banks, regions, and trends
3. Cite specific bank names, ratios, and figures
4. Use markdown extensively:
   - ## Headers for sections
   - **Bold** for key findings and figures
   - Tables for comparisons (| Bank | Metric | Value |)
   - Bullet points for lists
5. Provide "Analyst Take" — not just data, but what it MEANS
6. Identify outliers, trends, and risks
7. Note data gaps or limitations honestly
8. Structure your response:
   - Executive Summary (2-3 sentences)
   - Detailed Analysis (with tables where appropriate)
   - Key Takeaways
   - Risk Considerations (if applicable)
9. Be specific — use exact numbers, not approximations
10. If data is insufficient, specify what data would be needed

Respond in a comprehensive, professional analyst report format.`

    const { text: response } = await generateText({
      model: getOpenAIModel("chat"),
      prompt,
      temperature: 0.1,
    })

    // Save result
    const result = {
      question,
      answer: response,
      banks_analyzed: bankData.length,
      generated_at: new Date().toISOString(),
    }

    await ResearchDB.updateResult(queryId, result)

    return NextResponse.json({
      queryId,
      response,
      banksAnalyzed: bankData.length,
      dataPoints: bankData.reduce((sum, b) => sum + b.key_ratios.length, 0),
      generatedAt: result.generated_at,
    })
  } catch (error) {
    console.error("Research error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Research query failed" },
      { status: 500 }
    )
  }
}
