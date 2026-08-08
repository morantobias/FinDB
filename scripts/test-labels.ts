/**
 * Quick test: What labels does the SEC provide for XBRL facts?
 */
import { SecEdgarClient } from "../lib/sec-edgar-client"

async function test() {
  const client = new SecEdgarClient()
  const facts = await client.getCompanyFacts(72971) // Wells Fargo
  
  if (!facts) return
  
  const usGaap = facts.facts["us-gaap"]
  
  // Show a few facts with their labels
  const tags = ["Assets", "LoansAndLeasesReceivableNetReportedAmount", "Deposits", "InterestIncomeExpenseNet", "NetIncomeLoss"]
  
  console.log("SEC XBRL Fact Labels vs Descriptions:\n")
  for (const tag of tags) {
    const fact = usGaap[tag]
    if (fact) {
      console.log(`Tag: ${tag}`)
      console.log(`  Label:       ${fact.label}`)
      console.log(`  Description: ${fact.description}`)
      console.log()
    }
  }
}

test().catch(console.error)
