/**
 * Standardization Engine — Maps reported financial line items to standardized codes.
 *
 * Uses AI (GPT) to match bank-specific line item names to FinDB's standardized
 * financial codes. Builds a mapping that can be cached and reused for the same
 * bank across future filings.
 */
import { generateText } from "ai"
import { getOpenAIModel } from "@/lib/openai-config"
import { STANDARDIZED_CODES, type StandardizedCode } from "@/types/financial"

interface MappingResult {
  reportedItemId: string
  reportedLineItem: string
  standardizedCode: StandardizedCode | null
  standardizedLabel: string | null
  confidence: number
}

/**
 * Map reported line items to standardized codes using AI.
 * Returns an array of mappings with confidence scores.
 */
export async function standardizeLineItems(
  reportedItems: Array<{ id: string; line_item: string; statement_type: string; value: number }>,
): Promise<MappingResult[]> {
  if (reportedItems.length === 0) return []

  const itemsList = reportedItems
    .map((item, i) => `${i}: [${item.statement_type}] ${item.line_item} = ${item.value}`)
    .join("\n")

  const codesList = Object.entries(STANDARDIZED_CODES)
    .map(([code, label]) => `${code}: ${label}`)
    .join("\n")

  const prompt = `You are a financial data standardization system. Map reported bank line items to standardized codes.

STANDARDIZED CODES:
${codesList}

REPORTED LINE ITEMS (format: index: [statement_type] line_item = value):
${itemsList}

For each reported item, determine which standardized code it maps to. Return a JSON array:
[
  {
    "index": number (the item index),
    "standardized_code": "CODE" or null if no match,
    "standardized_label": "Label" or null,
    "confidence": 0.0-1.0 (how certain you are of the match)
  }
]

Rules:
- Only map if you are reasonably confident (confidence >= 0.5)
- Set code to null if no clear match exists
- Total Assets → BS_TOTAL_ASSETS, Net Income → IS_NET_INCOME, etc.
- If an item is a subtotal or doesn't match any code, set code to null
- Return ONLY valid JSON array, no other text`

  const { text: result } = await generateText({
    model: getOpenAIModel("chat"),
    prompt,
    temperature: 0.1,
  })

  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    const mappings: Array<{ index: number; standardized_code: string | null; standardized_label: string | null; confidence: number }> =
      JSON.parse(jsonMatch[0])

    return mappings
      .filter(m => m.standardized_code && m.confidence >= 0.5)
      .map(m => ({
        reportedItemId: reportedItems[m.index]?.id || "",
        reportedLineItem: reportedItems[m.index]?.line_item || "",
        standardizedCode: m.standardized_code as StandardizedCode,
        standardizedLabel: m.standardized_label || STANDARDIZED_CODES[m.standardized_code as StandardizedCode] || m.standardized_code,
        confidence: m.confidence,
      }))
  } catch (err) {
    console.error("Standardization parse error:", err)
    return []
  }
}

/**
 * Rule-based fallback: keyword matching for common financial line items.
 * Used when AI standardization fails or as a fast path.
 */
export function quickStandardize(reportedItems: Array<{ id: string; line_item: string; statement_type: string; value: number }>): MappingResult[] {
  const keywordMap: Array<{ keywords: string[]; code: StandardizedCode }> = [
    { keywords: ["total assets", "total consolidated assets", "assets total"], code: "BS_TOTAL_ASSETS" },
    { keywords: ["cash and equivalents", "cash and due from banks", "cash & equivalents", "cash & due from"], code: "BS_CASH_AND_EQUIVALENTS" },
    { keywords: ["net loans", "loans net", "loans and leases net", "net loans and leases", "total loans net"], code: "BS_NET_LOANS" },
    { keywords: ["gross loans", "loans gross", "total loans gross"], code: "BS_GROSS_LOANS" },
    { keywords: ["investment securities", "total investment securities", "securities"], code: "BS_INVESTMENT_SECURITIES" },
    { keywords: ["allowance for credit losses", "allowance for loan losses", "loan loss reserve", "alll", "acl"], code: "BS_LOAN_LOSS_RESERVE" },
    { keywords: ["total deposits", "deposits total", "customer deposits"], code: "BS_TOTAL_DEPOSITS" },
    { keywords: ["total liabilities", "liabilities total"], code: "BS_TOTAL_LIABILITIES" },
    { keywords: ["total equity", "shareholders equity", "stockholders equity", "total shareholders' equity"], code: "BS_TOTAL_EQUITY" },
    { keywords: ["common equity tier 1", "cet1 capital", "cet1"], code: "BS_CET1_CAPITAL" },
    { keywords: ["tier 1 capital", "total tier 1"], code: "BS_TIER_1_CAPITAL" },
    { keywords: ["risk-weighted assets", "rwa", "risk weighted assets"], code: "BS_RWA" },
    { keywords: ["tangible common equity", "tce", "tangible equity"], code: "BS_TANGIBLE_COMMON_EQUITY" },
    { keywords: ["goodwill", "goodwill and intangibles", "goodwill & intangibles"], code: "BS_GOODWILL" },
    { keywords: ["total capital", "total regulatory capital", "total capital ratio denominator"], code: "BS_TOTAL_CAPITAL" },
    { keywords: ["net interest income", "interest income net"], code: "IS_NET_INTEREST_INCOME" },
    { keywords: ["interest income", "total interest income"], code: "IS_INTEREST_INCOME" },
    { keywords: ["interest expense", "total interest expense"], code: "IS_INTEREST_EXPENSE" },
    { keywords: ["noninterest income", "non interest income", "other income", "non-interest income"], code: "IS_NONINTEREST_INCOME" },
    { keywords: ["total revenue", "net revenue", "total net revenue", "operating revenue"], code: "IS_TOTAL_REVENUE" },
    { keywords: ["operating expense", "noninterest expense", "operating expenses", "non-interest expense", "total expenses"], code: "IS_OPERATING_EXPENSE" },
    { keywords: ["provision for credit losses", "provision expense", "credit loss provision", "provision for loan losses", "pcl"], code: "IS_PROVISION_EXPENSE" },
    { keywords: ["net income", "net profit", "net income attributable", "profit for the year", "net earnings"], code: "IS_NET_INCOME" },
    { keywords: ["pre-provision", "ppnr", "pre provision", "preprovision net revenue", "income before provision"], code: "IS_PRE_PROVISION_PROFIT" },
    { keywords: ["earnings per share", "eps", "basic earnings per share", "diluted earnings per share"], code: "IS_EPS" },
    { keywords: ["cet1 ratio", "common equity tier 1 ratio", "cet1 capital ratio"], code: "CAP_CET1_RATIO" },
    { keywords: ["tier 1 ratio", "tier 1 capital ratio"], code: "CAP_TIER1_RATIO" },
    { keywords: ["total capital ratio", "total regulatory capital ratio"], code: "CAP_TOTAL_CAPITAL_RATIO" },
    { keywords: ["leverage ratio", "tier 1 leverage ratio", "supplementary leverage ratio"], code: "CAP_LEVERAGE_RATIO" },
    { keywords: ["liquidity coverage ratio", "lcr"], code: "CAP_LCR" },
    { keywords: ["net stable funding ratio", "nsfr"], code: "CAP_NSFR" },
  ]

  return reportedItems
    .map(item => {
      const lowerItem = item.line_item.toLowerCase()
      for (const { keywords, code } of keywordMap) {
        if (keywords.some(kw => lowerItem.includes(kw))) {
          return {
            reportedItemId: item.id,
            reportedLineItem: item.line_item,
            standardizedCode: code,
            standardizedLabel: STANDARDIZED_CODES[code],
            confidence: 0.85,
          }
        }
      }
      return null
    })
    .filter((m): m is MappingResult => m !== null)
}
