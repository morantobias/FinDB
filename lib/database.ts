/**
 * Database Service — Neon PostgreSQL via @neondatabase/serverless.
 *
 * Schema:
 *   banks              — global bank registry
 *   filings            — uploaded financial filings (10-K, Annual Report, etc.)
 *   reported_line_items — raw financial data as reported by each bank
 *   standardized_line_items — mapped to common codes for comparability
 *   key_ratios         — computed ratios (earnings, asset quality, capital, etc.)
 *   chat_sessions      — per-filing chat sessions
 *   chat_messages      — conversation history
 *   research_queries   — cross-bank AI research queries & results
 */
import { neon } from "@neondatabase/serverless"

const databaseUrl =
  process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!databaseUrl) {
  throw new Error("DATABASE_URL or POSTGRES_URL environment variable is required")
}

const sql = neon(databaseUrl)

export { sql }

// ═══════════════════════════════════════════════════════════════════════
// Banks
// ═══════════════════════════════════════════════════════════════════════

export interface BankRecord {
  id: string
  bank_code: string | null
  name: string
  ticker: string | null
  country: string
  region: string
  headquarters: string | null
  description: string | null
  website: string | null
  logo_url: string | null
  total_assets: number | null
  total_assets_currency: string | null
  total_assets_date: string | null
  employee_count: number | null
  founded_year: number | null
  regulatory_body: string | null
  created_at: string
  updated_at: string
}

export const BankDB = {
  async getAll(region?: string): Promise<BankRecord[]> {
    if (region) {
      return sql`SELECT * FROM banks WHERE region = ${region} ORDER BY total_assets DESC NULLS LAST`
    }
    return sql`SELECT * FROM banks ORDER BY region, total_assets DESC NULLS LAST`
  },

  async getById(id: string): Promise<BankRecord | null> {
    const rows = await sql`SELECT * FROM banks WHERE id = ${id}`
    return rows[0] || null
  },

  async getByTicker(ticker: string): Promise<BankRecord | null> {
    const rows = await sql`SELECT * FROM banks WHERE ticker = ${ticker}`
    return rows[0] || null
  },

  async create(bank: Omit<BankRecord, "created_at" | "updated_at">): Promise<BankRecord> {
    const rows = await sql`
      INSERT INTO banks (id, bank_code, name, ticker, country, region, headquarters, description, website, logo_url, total_assets, total_assets_currency, total_assets_date, employee_count, founded_year, regulatory_body)
      VALUES (${bank.id}, ${bank.bank_code}, ${bank.name}, ${bank.ticker}, ${bank.country}, ${bank.region}, ${bank.headquarters}, ${bank.description}, ${bank.website}, ${bank.logo_url}, ${bank.total_assets}, ${bank.total_assets_currency}, ${bank.total_assets_date}, ${bank.employee_count}, ${bank.founded_year}, ${bank.regulatory_body})
      ON CONFLICT (id) DO UPDATE SET
        bank_code = EXCLUDED.bank_code, name = EXCLUDED.name, ticker = EXCLUDED.ticker, country = EXCLUDED.country,
        region = EXCLUDED.region, total_assets = EXCLUDED.total_assets,
        updated_at = NOW()
      RETURNING *
    `
    return rows[0]
  },
}

// ═══════════════════════════════════════════════════════════════════════
// Filings
// ═══════════════════════════════════════════════════════════════════════

export interface FilingRecord {
  id: string
  bank_id: string
  filing_type: string
  period_end: string
  fiscal_year: number
  filing_date: string
  pdf_url: string | null
  blob_url: string | null
  status: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export const FilingDB = {
  async getByBankId(bankId: string): Promise<FilingRecord[]> {
    return sql`SELECT * FROM filings WHERE bank_id = ${bankId} ORDER BY filing_date DESC`
  },

  async getById(id: string): Promise<FilingRecord | null> {
    const rows = await sql`SELECT * FROM filings WHERE id = ${id}`
    return rows[0] || null
  },

  async create(filing: Omit<FilingRecord, "created_at" | "updated_at">): Promise<FilingRecord> {
    const rows = await sql`
      INSERT INTO filings (id, bank_id, filing_type, period_end, fiscal_year, filing_date, pdf_url, blob_url, status, metadata)
      VALUES (${filing.id}, ${filing.bank_id}, ${filing.filing_type}, ${filing.period_end}, ${filing.fiscal_year}, ${filing.filing_date}, ${filing.pdf_url}, ${filing.blob_url}, ${filing.status}, ${JSON.stringify(filing.metadata)})
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status, metadata = EXCLUDED.metadata, updated_at = NOW()
      RETURNING *
    `
    return rows[0]
  },

  async updateStatus(id: string, status: string, metadata?: Record<string, any>): Promise<void> {
    await sql`
      UPDATE filings SET status = ${status}, metadata = ${metadata ? JSON.stringify(metadata) : sql`metadata`}, updated_at = NOW()
      WHERE id = ${id}
    `
  },
}

// ═══════════════════════════════════════════════════════════════════════
// Financial Data
// ═══════════════════════════════════════════════════════════════════════

export const FinancialDB = {
  async getReportedLineItems(filingId: string): Promise<any[]> {
    return sql`SELECT * FROM reported_line_items WHERE filing_id = ${filingId} ORDER BY line_order`
  },

  async getReportedLineItemsByBankId(bankId: string): Promise<any[]> {
    return sql`SELECT * FROM reported_line_items WHERE filing_id LIKE ${'sec-' + bankId + '-%'} ORDER BY fiscal_year DESC, line_order`
  },

  async deleteReportedLineItems(filingId: string): Promise<void> {
    await sql`DELETE FROM reported_line_items WHERE filing_id = ${filingId}`
  },

  async upsertReportedLineItems(items: any[]): Promise<void> {
    for (const item of items) {
      await sql`
        INSERT INTO reported_line_items (id, filing_id, statement_type, line_item, value, unit, currency, period_end, fiscal_year, category, subcategory, line_order)
        VALUES (${item.id}, ${item.filing_id}, ${item.statement_type}, ${item.line_item}, ${item.value}, ${item.unit}, ${item.currency}, ${item.period_end}, ${item.fiscal_year}, ${item.category}, ${item.subcategory}, ${item.line_order})
        ON CONFLICT (id) DO UPDATE SET
          value = EXCLUDED.value,
          category = EXCLUDED.category,
          statement_type = EXCLUDED.statement_type,
          line_item = EXCLUDED.line_item,
          line_order = EXCLUDED.line_order,
          unit = EXCLUDED.unit
      `
    }
  },

  async getStandardizedLineItems(bankId: string): Promise<any[]> {
    return sql`
      SELECT * FROM standardized_line_items WHERE bank_id = ${bankId}
      ORDER BY period_end DESC, standardized_code
    `
  },

  async getStandardizedByCode(bankId: string, code: string): Promise<any[]> {
    return sql`
      SELECT * FROM standardized_line_items
      WHERE bank_id = ${bankId} AND standardized_code = ${code}
      ORDER BY period_end DESC
    `
  },

  async upsertStandardizedLineItems(items: any[]): Promise<void> {
    for (const item of items) {
      await sql`
        INSERT INTO standardized_line_items (id, bank_id, filing_id, standardized_code, standardized_label, value, unit, currency, period_end, fiscal_year, source_line_item_id, confidence)
        VALUES (${item.id}, ${item.bank_id}, ${item.filing_id}, ${item.standardized_code}, ${item.standardized_label}, ${item.value}, ${item.unit}, ${item.currency}, ${item.period_end}, ${item.fiscal_year}, ${item.source_line_item_id}, ${item.confidence})
        ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, confidence = EXCLUDED.confidence
      `
    }
  },

  async getRatios(bankId: string, category?: string): Promise<any[]> {
    if (category) {
      return sql`SELECT * FROM key_ratios WHERE bank_id = ${bankId} AND category = ${category} ORDER BY period_end DESC`
    }
    return sql`SELECT * FROM key_ratios WHERE bank_id = ${bankId} ORDER BY category, period_end DESC`
  },

  async getRatiosByCode(bankId: string, ratioCode: string): Promise<any[]> {
    return sql`
      SELECT * FROM key_ratios
      WHERE bank_id = ${bankId} AND ratio_code = ${ratioCode}
      ORDER BY period_end DESC
    `
  },

  async upsertRatios(ratios: any[]): Promise<void> {
    for (const ratio of ratios) {
      await sql`
        INSERT INTO key_ratios (id, bank_id, filing_id, ratio_code, ratio_name, value, unit, category, period_end, fiscal_year, peer_group_median, peer_group_percentile)
        VALUES (${ratio.id}, ${ratio.bank_id}, ${ratio.filing_id}, ${ratio.ratio_code}, ${ratio.ratio_name}, ${ratio.value}, ${ratio.unit}, ${ratio.category}, ${ratio.period_end}, ${ratio.fiscal_year}, ${ratio.peer_group_median}, ${ratio.peer_group_percentile})
        ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, peer_group_median = EXCLUDED.peer_group_median
      `
    }
  },
}

// ═══════════════════════════════════════════════════════════════════════
// Chat
// ═══════════════════════════════════════════════════════════════════════

export const ChatDB = {
  async getOrCreateSession(filingId: string): Promise<string> {
    const rows = await sql`
      INSERT INTO chat_sessions (filing_id) VALUES (${filingId})
      ON CONFLICT (filing_id) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `
    return rows[0].id
  },

  async addMessage(sessionId: string, role: "user" | "assistant", content: string, citations?: any[]): Promise<void> {
    await sql`
      INSERT INTO chat_messages (session_id, role, content, citations)
      VALUES (${sessionId}, ${role}, ${content}, ${citations ? JSON.stringify(citations) : null})
    `
  },

  async getMessages(sessionId: string, limit: number = 20): Promise<any[]> {
    return sql`
      SELECT * FROM chat_messages WHERE session_id = ${sessionId}
      ORDER BY created_at ASC LIMIT ${limit}
    `
  },
}

// ═══════════════════════════════════════════════════════════════════════
// Research
// ═══════════════════════════════════════════════════════════════════════

export const ResearchDB = {
  async createQuery(question: string): Promise<string> {
    const rows = await sql`
      INSERT INTO research_queries (question, status) VALUES (${question}, 'pending') RETURNING id
    `
    return rows[0].id
  },

  async updateResult(id: string, result: any): Promise<void> {
    await sql`
      UPDATE research_queries SET status = 'complete', result = ${JSON.stringify(result)}, updated_at = NOW()
      WHERE id = ${id}
    `
  },

  async getRecent(limit: number = 20): Promise<any[]> {
    return sql`SELECT * FROM research_queries ORDER BY created_at DESC LIMIT ${limit}`
  },
}
