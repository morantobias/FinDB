/**
 * FinDB Database Initialization Script
 *
 * Creates all tables for the financial database.
 * Run: npx tsx scripts/init-database.ts
 */
import { neon } from "@neondatabase/serverless"

const databaseUrl =
  process.env.DATABASE_URL || process.env.POSTGRES_URL

if (!databaseUrl) {
  console.error("DATABASE_URL or POSTGRES_URL environment variable is required")
  process.exit(1)
}

const sql = neon(databaseUrl)

async function init() {
  console.log("🔧 Initializing FinDB database...")

  // ── Banks ───────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS banks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ticker TEXT,
      country TEXT NOT NULL,
      region TEXT NOT NULL CHECK (region IN ('north_america', 'south_america', 'europe', 'asia', 'apac')),
      headquarters TEXT,
      description TEXT,
      website TEXT,
      logo_url TEXT,
      total_assets DECIMAL,
      total_assets_currency TEXT DEFAULT 'USD',
      total_assets_date TEXT,
      employee_count INTEGER,
      founded_year INTEGER,
      regulatory_body TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log("  ✅ banks")

  // ── Filings ─────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS filings (
      id TEXT PRIMARY KEY,
      bank_id TEXT NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
      filing_type TEXT NOT NULL,
      period_end TEXT NOT NULL,
      fiscal_year INTEGER NOT NULL,
      filing_date TEXT NOT NULL,
      pdf_url TEXT,
      blob_url TEXT,
      status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'indexed', 'extracted', 'error')),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_filings_bank_id ON filings(bank_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_filings_fiscal_year ON filings(fiscal_year)`
  console.log("  ✅ filings")

  // ── Reported Line Items ─────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS reported_line_items (
      id TEXT PRIMARY KEY,
      filing_id TEXT NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
      statement_type TEXT NOT NULL CHECK (statement_type IN ('balance_sheet', 'income_statement', 'cash_flow')),
      line_item TEXT NOT NULL,
      value DECIMAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'millions',
      currency TEXT NOT NULL DEFAULT 'USD',
      period_end TEXT NOT NULL,
      fiscal_year INTEGER NOT NULL,
      category TEXT,
      subcategory TEXT,
      line_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_rli_filing_id ON reported_line_items(filing_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_rli_statement_type ON reported_line_items(statement_type)`
  console.log("  ✅ reported_line_items")

  // ── Standardized Line Items ─────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS standardized_line_items (
      id TEXT PRIMARY KEY,
      bank_id TEXT NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
      filing_id TEXT NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
      standardized_code TEXT NOT NULL,
      standardized_label TEXT NOT NULL,
      value DECIMAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'millions',
      currency TEXT NOT NULL DEFAULT 'USD',
      period_end TEXT NOT NULL,
      fiscal_year INTEGER NOT NULL,
      source_line_item_id TEXT REFERENCES reported_line_items(id),
      confidence DECIMAL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_sli_bank_id ON standardized_line_items(bank_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_sli_code ON standardized_line_items(standardized_code)`
  await sql`CREATE INDEX IF NOT EXISTS idx_sli_period ON standardized_line_items(period_end)`
  console.log("  ✅ standardized_line_items")

  // ── Key Ratios ──────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS key_ratios (
      id TEXT PRIMARY KEY,
      bank_id TEXT NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
      filing_id TEXT REFERENCES filings(id) ON DELETE SET NULL,
      ratio_code TEXT NOT NULL,
      ratio_name TEXT NOT NULL,
      value DECIMAL NOT NULL,
      unit TEXT DEFAULT '%',
      category TEXT NOT NULL CHECK (category IN ('earnings', 'asset_quality', 'capital', 'liquidity', 'funding', 'efficiency')),
      period_end TEXT NOT NULL,
      fiscal_year INTEGER NOT NULL,
      peer_group_median DECIMAL,
      peer_group_percentile DECIMAL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_kr_bank_id ON key_ratios(bank_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_kr_category ON key_ratios(category)`
  await sql`CREATE INDEX IF NOT EXISTS idx_kr_code ON key_ratios(ratio_code)`
  console.log("  ✅ key_ratios")

  // ── Chat ────────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filing_id TEXT NOT NULL UNIQUE REFERENCES filings(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      citations JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_cm_session_id ON chat_messages(session_id)`
  console.log("  ✅ chat_sessions / chat_messages")

  // ── Research ────────────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS research_queries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'complete', 'error')),
      result JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_rq_status ON research_queries(status)`
  console.log("  ✅ research_queries")

  console.log("🎉 FinDB database initialized successfully!")
}

init().catch(console.error)
