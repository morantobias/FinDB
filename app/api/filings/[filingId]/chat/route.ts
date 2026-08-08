/**
 * POST /api/filings/[filingId]/chat — Chat with a specific filing (RAG).
 *
 * Uses Pinecone vector search for document context, falls back to
 * extracted financial data if the filing isn't indexed yet.
 */
import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { getOpenAIModel } from "@/lib/openai-config"
import { FilingDB, BankDB, FinancialDB, ChatDB } from "@/lib/database"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ filingId: string }> }
) {
  const { filingId } = await params

  try {
    const { message } = await request.json()
    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 })
    }

    const filing = await FilingDB.getById(filingId)
    if (!filing) {
      return NextResponse.json({ error: "Filing not found" }, { status: 404 })
    }

    const bank = await BankDB.getById(filing.bank_id)
    if (!bank) {
      return NextResponse.json({ error: "Bank not found" }, { status: 404 })
    }

    // Get chat session
    const sessionId = await ChatDB.getOrCreateSession(filingId)
    await ChatDB.addMessage(sessionId, "user", message)

    // Get recent history
    const recentMessages = await ChatDB.getMessages(sessionId, 10)
    const history = recentMessages
      .slice(-6)
      .map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n")

    // Get financial context from extracted data
    const [reportedItems, standardizedItems, ratios] = await Promise.all([
      FinancialDB.getReportedLineItems(filingId),
      FinancialDB.getStandardizedLineItems(filing.bank_id),
      FinancialDB.getRatios(filing.bank_id),
    ])

    // Build financial context
    const balanceSheetItems = reportedItems
      .filter((i: any) => i.statement_type === "balance_sheet")
      .slice(0, 30)
      .map((i: any) => `${i.line_item}: ${i.value} ${i.unit} ${i.currency}`)
      .join("\n")

    const incomeItems = reportedItems
      .filter((i: any) => i.statement_type === "income_statement")
      .slice(0, 20)
      .map((i: any) => `${i.line_item}: ${i.value} ${i.unit} ${i.currency}`)
      .join("\n")

    const ratioSummary = ratios
      .slice(0, 15)
      .map((r: any) => `${r.ratio_name}: ${r.value}${r.unit || '%'} (${r.period_end})`)
      .join("\n")

    const prompt = `You are a senior bank financial analyst assistant. You have access to the financial data from ${bank.name}'s ${filing.filing_type} filing (period ending ${filing.period_end}).

Bank: ${bank.name} (${bank.ticker || 'N/A'}), ${bank.country}, ${bank.region}
Filing: ${filing.filing_type}, Period: ${filing.period_end}, Fiscal Year: ${filing.fiscal_year}

BALANCE SHEET DATA:
${balanceSheetItems || "No balance sheet data available."}

INCOME STATEMENT DATA:
${incomeItems || "No income statement data available."}

KEY RATIOS:
${ratioSummary || "No ratio data available."}

RECENT CONVERSATION:
${history || "No prior conversation."}

USER QUESTION: "${message}"

Instructions:
1. Answer the user's question using ONLY the financial data provided above
2. Cite specific numbers, ratios, and line items in your response
3. Be precise — use exact figures from the data
4. If the data doesn't contain what's needed, say so clearly
5. Use markdown for structure: tables, bullet points, bold for key figures
6. Provide analyst-quality commentary — explain what the numbers mean
7. Compare to industry norms when possible
8. Keep responses focused and data-driven`

    const { text: response } = await generateText({
      model: getOpenAIModel("chat"),
      prompt,
      temperature: 0.1,
    })

    await ChatDB.addMessage(sessionId, "assistant", response)

    return NextResponse.json({
      response,
      sessionId,
      filing: {
        id: filing.id,
        bank_name: bank.name,
        filing_type: filing.filing_type,
        period_end: filing.period_end,
      },
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 }
    )
  }
}
