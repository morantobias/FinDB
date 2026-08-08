/**
 * FinDB Type Definitions — Banks
 */

export interface Bank {
  id: string
  bank_code: string | null  // e.g. "NA01", "EU03", "AS07" — structured alphanumeric ID
  name: string
  ticker?: string
  country: string
  region: "north_america" | "south_america" | "europe" | "asia" | "apac"
  headquarters?: string
  description?: string
  website?: string
  logo_url?: string
  total_assets?: number
  total_assets_currency?: string
  total_assets_date?: string
  employee_count?: number
  founded_year?: number
  regulatory_body?: string
  created_at: string
  updated_at: string
}

export interface BankFiling {
  id: string
  bank_id: string
  filing_type: string // "10-K", "10-Q", "Annual Report", "Pillar 3", etc.
  period_end: string
  fiscal_year: number
  filing_date: string
  pdf_url?: string
  blob_url?: string
  status: "uploaded" | "processing" | "indexed" | "extracted" | "error"
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export type BankRegion = Bank["region"]

export const REGION_LABELS: Record<BankRegion, string> = {
  north_america: "North America",
  south_america: "South America",
  europe: "Europe",
  asia: "Asia",
  apac: "APAC / Australia",
}
