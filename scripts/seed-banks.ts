/**
 * FinDB Bank Seed Script — Top 50 Global Banks
 *
 * Seeds the database with the 10 largest banking groups in each region.
 * Run: npx tsx scripts/seed-banks.ts
 *
 * Data sourced from public filings (SEC, annual reports) and is approximate.
 * Total assets in USD (converted at latest reported exchange rates).
 */
import { BankDB } from "../lib/database"

interface SeedBank {
  id: string
  name: string
  ticker: string | null
  country: string
  region: string
  headquarters: string
  description: string
  total_assets: number // in USD
  employee_count: number | null
  founded_year: number | null
  regulatory_body: string
}

const BANKS: SeedBank[] = [
  // ═══════════════════════════════════════════════════════════════════
  // NORTH AMERICA (10)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "bank-na-01", name: "JPMorgan Chase & Co.", ticker: "JPM", country: "United States", region: "north_america",
    headquarters: "New York, NY", description: "Largest US bank by assets. Universal banking: consumer, commercial, investment banking, asset management.",
    total_assets: 3_900_000_000_000, employee_count: 310_000, founded_year: 1799, regulatory_body: "Federal Reserve / OCC",
  },
  {
    id: "bank-na-02", name: "Bank of America Corporation", ticker: "BAC", country: "United States", region: "north_america",
    headquarters: "Charlotte, NC", description: "Second-largest US bank. Leading consumer banking franchise with strong wealth management.",
    total_assets: 3_200_000_000_000, employee_count: 213_000, founded_year: 1904, regulatory_body: "Federal Reserve / OCC",
  },
  {
    id: "bank-na-03", name: "Citigroup Inc.", ticker: "C", country: "United States", region: "north_america",
    headquarters: "New York, NY", description: "Global diversified financial services. Strong international presence across 160+ countries.",
    total_assets: 2_400_000_000_000, employee_count: 239_000, founded_year: 1812, regulatory_body: "Federal Reserve / OCC",
  },
  {
    id: "bank-na-04", name: "Wells Fargo & Company", ticker: "WFC", country: "United States", region: "north_america",
    headquarters: "San Francisco, CA", description: "Major US diversified bank. Strong in mortgage, commercial lending, and wealth management.",
    total_assets: 1_900_000_000_000, employee_count: 226_000, founded_year: 1852, regulatory_body: "Federal Reserve / OCC",
  },
  {
    id: "bank-na-05", name: "Goldman Sachs Group, Inc.", ticker: "GS", country: "United States", region: "north_america",
    headquarters: "New York, NY", description: "Leading global investment banking, securities and investment management firm.",
    total_assets: 1_600_000_000_000, employee_count: 45_300, founded_year: 1869, regulatory_body: "Federal Reserve / SEC",
  },
  {
    id: "bank-na-06", name: "Morgan Stanley", ticker: "MS", country: "United States", region: "north_america",
    headquarters: "New York, NY", description: "Global financial services firm: institutional securities, wealth management, investment management.",
    total_assets: 1_200_000_000_000, employee_count: 80_000, founded_year: 1935, regulatory_body: "Federal Reserve / SEC",
  },
  {
    id: "bank-na-07", name: "Royal Bank of Canada", ticker: "RY", country: "Canada", region: "north_america",
    headquarters: "Toronto, ON", description: "Largest Canadian bank by market cap. Strong in personal/commercial banking, wealth management, capital markets.",
    total_assets: 1_500_000_000_000, employee_count: 97_000, founded_year: 1864, regulatory_body: "OSFI (Canada)",
  },
  {
    id: "bank-na-08", name: "Toronto-Dominion Bank", ticker: "TD", country: "Canada", region: "north_america",
    headquarters: "Toronto, ON", description: "Second-largest Canadian bank. Major US retail presence through TD Bank, N.A.",
    total_assets: 1_400_000_000_000, employee_count: 103_000, founded_year: 1955, regulatory_body: "OSFI (Canada)",
  },
  {
    id: "bank-na-09", name: "Bank of Montreal", ticker: "BMO", country: "Canada", region: "north_america",
    headquarters: "Montreal, QC", description: "Diversified Canadian bank with significant US operations via BMO Harris.",
    total_assets: 950_000_000_000, employee_count: 55_000, founded_year: 1817, regulatory_body: "OSFI (Canada)",
  },
  {
    id: "bank-na-10", name: "Bank of Nova Scotia (Scotiabank)", ticker: "BNS", country: "Canada", region: "north_america",
    headquarters: "Toronto, ON", description: "Canada's most international bank. Strong presence in Latin America (Pacific Alliance).",
    total_assets: 1_100_000_000_000, employee_count: 90_000, founded_year: 1832, regulatory_body: "OSFI (Canada)",
  },

  // ═══════════════════════════════════════════════════════════════════
  // SOUTH AMERICA (10)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "bank-sa-01", name: "Itaú Unibanco Holding S.A.", ticker: "ITUB", country: "Brazil", region: "south_america",
    headquarters: "São Paulo, Brazil", description: "Largest bank in Latin America by assets. Full-service banking across Brazil and Latin America.",
    total_assets: 450_000_000_000, employee_count: 99_000, founded_year: 2008, regulatory_body: "Banco Central do Brasil",
  },
  {
    id: "bank-sa-02", name: "Banco do Brasil S.A.", ticker: "BBAS3", country: "Brazil", region: "south_america",
    headquarters: "Brasília, Brazil", description: "State-controlled bank. Largest Brazilian bank by assets; major agricultural lender.",
    total_assets: 380_000_000_000, employee_count: 86_000, founded_year: 1808, regulatory_body: "Banco Central do Brasil",
  },
  {
    id: "bank-sa-03", name: "Banco Bradesco S.A.", ticker: "BBD", country: "Brazil", region: "south_america",
    headquarters: "Osasco, Brazil", description: "Second-largest private bank in Brazil. Extensive branch network and insurance operations.",
    total_assets: 350_000_000_000, employee_count: 87_000, founded_year: 1943, regulatory_body: "Banco Central do Brasil",
  },
  {
    id: "bank-sa-04", name: "Banco Santander (Brasil) S.A.", ticker: "SANB11", country: "Brazil", region: "south_america",
    headquarters: "São Paulo, Brazil", description: "Brazilian subsidiary of Spain's Santander. Third-largest private bank in Brazil.",
    total_assets: 220_000_000_000, employee_count: 55_000, founded_year: 1982, regulatory_body: "Banco Central do Brasil",
  },
  {
    id: "bank-sa-05", name: "Banco BTG Pactual S.A.", ticker: "BPAC11", country: "Brazil", region: "south_america",
    headquarters: "São Paulo, Brazil", description: "Largest independent investment bank in Latin America. Strong in asset management and wealth management.",
    total_assets: 100_000_000_000, employee_count: 6_500, founded_year: 1983, regulatory_body: "Banco Central do Brasil",
  },
  {
    id: "bank-sa-06", name: "Banco de Crédito e Inversiones (BCI)", ticker: "BCI", country: "Chile", region: "south_america",
    headquarters: "Santiago, Chile", description: "Third-largest bank in Chile. Strong corporate and retail banking franchise.",
    total_assets: 85_000_000_000, employee_count: 16_000, founded_year: 1937, regulatory_body: "CMF (Chile)",
  },
  {
    id: "bank-sa-07", name: "Banco Santander Chile", ticker: "BSAC", country: "Chile", region: "south_america",
    headquarters: "Santiago, Chile", description: "Largest bank in Chile by assets. Subsidiary of Spain's Banco Santander.",
    total_assets: 90_000_000_000, employee_count: 11_000, founded_year: 1978, regulatory_body: "CMF (Chile)",
  },
  {
    id: "bank-sa-08", name: "Banco de Chile", ticker: "BCH", country: "Chile", region: "south_america",
    headquarters: "Santiago, Chile", description: "Second-largest bank in Chile. Controlled by Quiñenco group and Citigroup.",
    total_assets: 70_000_000_000, employee_count: 13_000, founded_year: 1893, regulatory_body: "CMF (Chile)",
  },
  {
    id: "bank-sa-09", name: "Bancolombia S.A.", ticker: "CIB", country: "Colombia", region: "south_america",
    headquarters: "Medellín, Colombia", description: "Largest bank in Colombia. Operations across Central America (Banistmo, Banagrícola).",
    total_assets: 85_000_000_000, employee_count: 32_000, founded_year: 1945, regulatory_body: "Superfinanciera (Colombia)",
  },
  {
    id: "bank-sa-10", name: "Banco de la Nación Argentina", ticker: null, country: "Argentina", region: "south_america",
    headquarters: "Buenos Aires, Argentina", description: "Largest bank in Argentina by assets. State-owned national bank.",
    total_assets: 60_000_000_000, employee_count: 23_000, founded_year: 1891, regulatory_body: "BCRA (Argentina)",
  },

  // ═══════════════════════════════════════════════════════════════════
  // EUROPE (10)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "bank-eu-01", name: "HSBC Holdings plc", ticker: "HSBC", country: "United Kingdom", region: "europe",
    headquarters: "London, UK", description: "Largest European bank by assets. Global universal bank with strong Asia franchise.",
    total_assets: 3_000_000_000_000, employee_count: 221_000, founded_year: 1865, regulatory_body: "PRA / FCA (UK)",
  },
  {
    id: "bank-eu-02", name: "BNP Paribas S.A.", ticker: "BNP", country: "France", region: "europe",
    headquarters: "Paris, France", description: "Largest bank in the Eurozone. Leading European corporate and institutional bank.",
    total_assets: 2_700_000_000_000, employee_count: 185_000, founded_year: 1848, regulatory_body: "ECB / ACPR (France)",
  },
  {
    id: "bank-eu-03", name: "Crédit Agricole Group", ticker: "ACA", country: "France", region: "europe",
    headquarters: "Montrouge, France", description: "Second-largest French bank. World's largest cooperative financial institution.",
    total_assets: 2_500_000_000_000, employee_count: 145_000, founded_year: 1894, regulatory_body: "ECB / ACPR (France)",
  },
  {
    id: "bank-eu-04", name: "Banco Santander, S.A.", ticker: "SAN", country: "Spain", region: "europe",
    headquarters: "Madrid, Spain", description: "Largest bank in Spain. Major retail/commercial presence across Europe and Americas.",
    total_assets: 1_800_000_000_000, employee_count: 212_000, founded_year: 1857, regulatory_body: "ECB / Banco de España",
  },
  {
    id: "bank-eu-05", name: "Barclays PLC", ticker: "BCS", country: "United Kingdom", region: "europe",
    headquarters: "London, UK", description: "Major UK universal bank. Strong investment banking and transatlantic franchise.",
    total_assets: 1_600_000_000_000, employee_count: 92_000, founded_year: 1690, regulatory_body: "PRA / FCA (UK)",
  },
  {
    id: "bank-eu-06", name: "Deutsche Bank AG", ticker: "DB", country: "Germany", region: "europe",
    headquarters: "Frankfurt, Germany", description: "Largest German bank. Global investment bank with strong European corporate banking.",
    total_assets: 1_400_000_000_000, employee_count: 90_000, founded_year: 1870, regulatory_body: "ECB / BaFin (Germany)",
  },
  {
    id: "bank-eu-07", name: "Société Générale S.A.", ticker: "GLE", country: "France", region: "europe",
    headquarters: "Paris, France", description: "Third-largest French bank. Strong in equity derivatives and structured finance.",
    total_assets: 1_500_000_000_000, employee_count: 126_000, founded_year: 1864, regulatory_body: "ECB / ACPR (France)",
  },
  {
    id: "bank-eu-08", name: "UBS Group AG", ticker: "UBS", country: "Switzerland", region: "europe",
    headquarters: "Zurich, Switzerland", description: "Largest Swiss bank (post-Credit Suisse merger). World's largest wealth manager.",
    total_assets: 1_700_000_000_000, employee_count: 112_000, founded_year: 1862, regulatory_body: "FINMA (Switzerland)",
  },
  {
    id: "bank-eu-09", name: "ING Groep N.V.", ticker: "ING", country: "Netherlands", region: "europe",
    headquarters: "Amsterdam, Netherlands", description: "Largest Dutch bank. Leading digital retail bank across Europe.",
    total_assets: 1_000_000_000_000, employee_count: 60_000, founded_year: 1991, regulatory_body: "ECB / DNB (Netherlands)",
  },
  {
    id: "bank-eu-10", name: "Intesa Sanpaolo S.p.A.", ticker: "ISP", country: "Italy", region: "europe",
    headquarters: "Turin, Italy", description: "Largest Italian bank by assets. Dominant domestic retail and commercial franchise.",
    total_assets: 1_000_000_000_000, employee_count: 95_000, founded_year: 2007, regulatory_body: "ECB / Banca d'Italia",
  },

  // ═══════════════════════════════════════════════════════════════════
  // ASIA (10)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "bank-as-01", name: "Industrial and Commercial Bank of China (ICBC)", ticker: "1398.HK", country: "China", region: "asia",
    headquarters: "Beijing, China", description: "Largest bank in the world by total assets. State-controlled commercial bank.",
    total_assets: 6_300_000_000_000, employee_count: 420_000, founded_year: 1984, regulatory_body: "CBIRC (China)",
  },
  {
    id: "bank-as-02", name: "China Construction Bank Corporation", ticker: "0939.HK", country: "China", region: "asia",
    headquarters: "Beijing, China", description: "Second-largest bank globally. Dominant in infrastructure and housing finance.",
    total_assets: 5_400_000_000_000, employee_count: 375_000, founded_year: 1954, regulatory_body: "CBIRC (China)",
  },
  {
    id: "bank-as-03", name: "Agricultural Bank of China Limited", ticker: "1288.HK", country: "China", region: "asia",
    headquarters: "Beijing, China", description: "Third-largest bank globally. Extensive rural and agricultural lending network.",
    total_assets: 5_200_000_000_000, employee_count: 450_000, founded_year: 1951, regulatory_body: "CBIRC (China)",
  },
  {
    id: "bank-as-04", name: "Bank of China Limited", ticker: "3988.HK", country: "China", region: "asia",
    headquarters: "Beijing, China", description: "Most internationally oriented Chinese bank. Major trade finance and FX operations.",
    total_assets: 4_600_000_000_000, employee_count: 305_000, founded_year: 1912, regulatory_body: "CBIRC (China)",
  },
  {
    id: "bank-as-05", name: "Mitsubishi UFJ Financial Group (MUFG)", ticker: "MUFG", country: "Japan", region: "asia",
    headquarters: "Tokyo, Japan", description: "Largest Japanese bank. Dominant across all financial segments in Japan + growing Asian presence.",
    total_assets: 3_100_000_000_000, employee_count: 140_000, founded_year: 2005, regulatory_body: "FSA (Japan)",
  },
  {
    id: "bank-as-06", name: "Sumitomo Mitsui Financial Group (SMFG)", ticker: "SMFG", country: "Japan", region: "asia",
    headquarters: "Tokyo, Japan", description: "Second-largest Japanese banking group. Strong corporate and consumer finance.",
    total_assets: 2_200_000_000_000, employee_count: 105_000, founded_year: 2002, regulatory_body: "FSA (Japan)",
  },
  {
    id: "bank-as-07", name: "Mizuho Financial Group, Inc.", ticker: "MFG", country: "Japan", region: "asia",
    headquarters: "Tokyo, Japan", description: "Third-largest Japanese megabank. Formed from merger of Dai-Ichi Kangyo, Fuji, and IBJ.",
    total_assets: 1_900_000_000_000, employee_count: 57_000, founded_year: 2000, regulatory_body: "FSA (Japan)",
  },
  {
    id: "bank-as-08", name: "State Bank of India", ticker: "SBIN", country: "India", region: "asia",
    headquarters: "Mumbai, India", description: "Largest Indian bank. State-controlled with dominant domestic market share.",
    total_assets: 700_000_000_000, employee_count: 235_000, founded_year: 1955, regulatory_body: "RBI (India)",
  },
  {
    id: "bank-as-09", name: "HDFC Bank Limited", ticker: "HDB", country: "India", region: "asia",
    headquarters: "Mumbai, India", description: "Largest Indian private sector bank by market cap. Strong retail and digital banking.",
    total_assets: 400_000_000_000, employee_count: 173_000, founded_year: 1994, regulatory_body: "RBI (India)",
  },
  {
    id: "bank-as-10", name: "China Merchants Bank Co., Ltd.", ticker: "3968.HK", country: "China", region: "asia",
    headquarters: "Shenzhen, China", description: "Leading Chinese joint-stock commercial bank. Renowned for retail banking and wealth management.",
    total_assets: 1_500_000_000_000, employee_count: 110_000, founded_year: 1987, regulatory_body: "CBIRC (China)",
  },

  // ═══════════════════════════════════════════════════════════════════
  // APAC / AUSTRALIA (10)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: "bank-ap-01", name: "Commonwealth Bank of Australia", ticker: "CBA", country: "Australia", region: "apac",
    headquarters: "Sydney, Australia", description: "Largest Australian bank by market cap. Dominant domestic retail banking franchise.",
    total_assets: 800_000_000_000, employee_count: 53_000, founded_year: 1911, regulatory_body: "APRA (Australia)",
  },
  {
    id: "bank-ap-02", name: "Australia and New Zealand Banking Group (ANZ)", ticker: "ANZ", country: "Australia", region: "apac",
    headquarters: "Melbourne, Australia", description: "Major Australian bank with large institutional franchise across Asia-Pacific.",
    total_assets: 700_000_000_000, employee_count: 40_000, founded_year: 1835, regulatory_body: "APRA (Australia)",
  },
  {
    id: "bank-ap-03", name: "Westpac Banking Corporation", ticker: "WBC", country: "Australia", region: "apac",
    headquarters: "Sydney, Australia", description: "Australia's first bank. Strong retail, business, and institutional banking.",
    total_assets: 700_000_000_000, employee_count: 36_000, founded_year: 1817, regulatory_body: "APRA (Australia)",
  },
  {
    id: "bank-ap-04", name: "National Australia Bank (NAB)", ticker: "NAB", country: "Australia", region: "apac",
    headquarters: "Melbourne, Australia", description: "Major Australian bank with largest business banking franchise in Australia.",
    total_assets: 700_000_000_000, employee_count: 38_000, founded_year: 1858, regulatory_body: "APRA (Australia)",
  },
  {
    id: "bank-ap-05", name: "DBS Group Holdings Ltd", ticker: "DBS", country: "Singapore", region: "apac",
    headquarters: "Singapore", description: "Largest bank in Southeast Asia by assets. 'World's Best Digital Bank' (Euromoney).",
    total_assets: 550_000_000_000, employee_count: 36_000, founded_year: 1968, regulatory_body: "MAS (Singapore)",
  },
  {
    id: "bank-ap-06", name: "Oversea-Chinese Banking Corporation (OCBC)", ticker: "O39", country: "Singapore", region: "apac",
    headquarters: "Singapore", description: "Second-largest Singapore bank. Strong in Greater China and Southeast Asia.",
    total_assets: 420_000_000_000, employee_count: 33_000, founded_year: 1932, regulatory_body: "MAS (Singapore)",
  },
  {
    id: "bank-ap-07", name: "United Overseas Bank (UOB)", ticker: "U11", country: "Singapore", region: "apac",
    headquarters: "Singapore", description: "Third-largest Singapore bank. Dominant in ASEAN with 500+ branches regionally.",
    total_assets: 380_000_000_000, employee_count: 25_000, founded_year: 1935, regulatory_body: "MAS (Singapore)",
  },
  {
    id: "bank-ap-08", name: "Macquarie Group Limited", ticker: "MQG", country: "Australia", region: "apac",
    headquarters: "Sydney, Australia", description: "Global infrastructure asset manager. World's largest infrastructure investor.",
    total_assets: 270_000_000_000, employee_count: 20_000, founded_year: 1969, regulatory_body: "APRA (Australia)",
  },
  {
    id: "bank-ap-09", name: "Korea Development Bank (KDB)", ticker: null, country: "South Korea", region: "apac",
    headquarters: "Seoul, South Korea", description: "South Korean policy bank. Major corporate and project finance lender.",
    total_assets: 250_000_000_000, employee_count: 3_400, founded_year: 1954, regulatory_body: "FSC (South Korea)",
  },
  {
    id: "bank-ap-10", name: "KB Financial Group Inc.", ticker: "KB", country: "South Korea", region: "apac",
    headquarters: "Seoul, South Korea", description: "Largest South Korean banking group by assets. Full-service financial holding company.",
    total_assets: 530_000_000_000, employee_count: 25_000, founded_year: 2008, regulatory_body: "FSC (South Korea)",
  },
]

async function seed() {
  console.log(`🌱 Seeding ${BANKS.length} banks...`)

  let created = 0
  for (const bank of BANKS) {
    try {
      await BankDB.create({
        id: bank.id,
        name: bank.name,
        ticker: bank.ticker,
        country: bank.country,
        region: bank.region,
        headquarters: bank.headquarters,
        description: bank.description,
        website: null,
        logo_url: null,
        total_assets: bank.total_assets,
        total_assets_currency: "USD",
        total_assets_date: "2024-12-31",
        employee_count: bank.employee_count,
        founded_year: bank.founded_year,
        regulatory_body: bank.regulatory_body,
      })
      created++
      console.log(`  ✅ ${bank.name} (${bank.ticker || 'N/A'}) — ${bank.region}`)
    } catch (err) {
      console.error(`  ❌ ${bank.name}:`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`\n🎉 Seeded ${created}/${BANKS.length} banks successfully!`)
}

seed().catch(console.error)
