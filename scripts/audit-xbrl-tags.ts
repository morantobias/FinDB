/**
 * Audit: What XBRL tags does SEC provide that we're NOT mapping?
 */
import { SecEdgarClient } from "../lib/sec-edgar-client"

async function audit() {
  const client = new SecEdgarClient()
  const facts = await client.getCompanyFacts(19617) // JPMorgan
  
  if (!facts) return
  
  const usGaap = facts.facts["us-gaap"]
  const allTags = Object.keys(usGaap)
  
  // Tags with USD data that could be financial line items
  const financialTags = allTags.filter(tag => {
    const fact = usGaap[tag]
    return fact?.units?.["USD"] && fact.units["USD"].length > 0
  })

  console.log(`Total us-gaap tags: ${allTags.length}`)
  console.log(`Tags with USD data: ${financialTags.length}`)
  console.log()

  // Group by likely statement type
  const bsTags: string[] = []
  const isTags: string[] = []
  const cfTags: string[] = []
  const otherTags: string[] = []

  const bsKeywords = ["asset", "liabilit", "deposit", "loan", "borrowing", "debt", "equity", "stockholder", "goodwill", "intangible", "capital", "rwa", "risk.weighted", "allowance", "reserve", "cash", "securit", "trading", "property", "premises", "treasury", "retained", "aoci", "common.stock", "paid.in", "tier"]
  const isKeywords = ["income", "revenue", "expense", "earning", "interest", "provision", "tax", "dividend", "fee", "commission", "compensation", "occupancy", "salary", "benefit", "profit", "loss"]
  const cfKeywords = ["cash.flow", "depreciation", "amortization", "investing", "financing", "operating.activ"]

  for (const tag of financialTags) {
    const lower = tag.toLowerCase()
    if (bsKeywords.some(k => lower.includes(k))) bsTags.push(tag)
    else if (isKeywords.some(k => lower.includes(k))) isTags.push(tag)
    else if (cfKeywords.some(k => lower.includes(k))) cfTags.push(tag)
    else otherTags.push(tag)
  }

  console.log(`\n=== BALANCE SHEET TAGS (${bsTags.length}) ===`)
  for (const tag of bsTags.sort()) {
    const fact = usGaap[tag]
    const hasData = fact?.units?.["USD"]?.some((d: any) => d.form === "10-K" && d.fy >= 2023)
    console.log(`${hasData ? '✅' : '❌'} ${tag.padEnd(55)} ${fact.label}`)
  }

  console.log(`\n=== INCOME STATEMENT TAGS (${isTags.length}) ===`)
  for (const tag of isTags.sort()) {
    const fact = usGaap[tag]
    const hasData = fact?.units?.["USD"]?.some((d: any) => d.form === "10-K" && d.fy >= 2023)
    console.log(`${hasData ? '✅' : '❌'} ${tag.padEnd(55)} ${fact.label}`)
  }
}

audit().catch(console.error)
