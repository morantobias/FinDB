/**
 * Database Migration — Add filing sources and template tables.
 * Run: npx tsx --env-file=.env.local scripts/migrate-v2.ts
 */
import { sql } from "../lib/database"

async function migrate() {
  console.log("🔧 Running FinDB v2 migration...")

  // ── Filing Sources ──────────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS filing_sources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bank_id TEXT NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
      source_type TEXT NOT NULL CHECK (source_type IN ('sec_edgar', 'sedar', 'esef', 'edinet', 'hkex', 'pdf_scrape', 'manual')),
      source_url TEXT,
      source_identifier TEXT,
      last_checked_at TIMESTAMP,
      last_filing_date TEXT,
      refresh_frequency TEXT DEFAULT 'weekly',
      status TEXT DEFAULT 'active',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(bank_id, source_type)
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_fs_bank_id ON filing_sources(bank_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_fs_status ON filing_sources(status)`
  console.log("  ✅ filing_sources")

  // ── Standardized Templates ──────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS standardized_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      template_code TEXT NOT NULL UNIQUE,
      template_name TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log("  ✅ standardized_templates")

  // ── Template Line Items ─────────────────────────────────────────────
  await sql`
    CREATE TABLE IF NOT EXISTS template_line_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      template_id UUID REFERENCES standardized_templates(id) ON DELETE CASCADE,
      standardized_code TEXT NOT NULL UNIQUE,
      line_label TEXT NOT NULL,
      line_order INTEGER NOT NULL,
      indent_level INTEGER DEFAULT 0,
      is_bold BOOLEAN DEFAULT false,
      is_total BOOLEAN DEFAULT false,
      is_subtotal BOOLEAN DEFAULT false,
      xbrl_tags TEXT[],
      category TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_tli_template ON template_line_items(template_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_tli_order ON template_line_items(line_order)`
  console.log("  ✅ template_line_items")

  console.log("🎉 Migration v2 complete!")
}

migrate().catch(console.error)
