"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BankComparisonChart } from "@/components/charts"

interface TemplateLineItem {
  id: string
  standardized_code: string
  line_label: string
  line_order: number
  indent_level: number
  is_bold: boolean
  is_total: boolean
  is_subtotal: boolean
  category: string
}

// Multi-period data: code → array of period values
interface PeriodDataPoint {
  period_end: string
  fiscal_year: number
  value: number
  form?: string
}

type MultiPeriodData = Record<string, PeriodDataPoint[]>

interface StatementTableProps {
  bankId: string
  bankName: string
}

type PeriodType = "annual" | "quarterly" | "ytd"
type ViewMode = "standardized" | "reported"

const COLUMN_WIDTH = 140

export function FinancialStatementTable({ bankId, bankName }: StatementTableProps) {
  const [activeStatement, setActiveStatement] = useState("balance_sheet")
  const [viewMode, setViewMode] = useState<ViewMode>("standardized")
  const [periodType, setPeriodType] = useState<PeriodType>("annual")
  const [isLoading, setIsLoading] = useState(true)
  const [templateLines, setTemplateLines] = useState<TemplateLineItem[]>([])
  const [financialData, setFinancialData] = useState<MultiPeriodData>({})
  const [allPeriods, setAllPeriods] = useState<PeriodDataPoint[]>([])
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set())
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [ratios, setRatios] = useState<any[]>([])

  // Load data
  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankId, activeStatement, viewMode, periodType])

  // Default select latest 3 years
  useEffect(() => {
    if (availableYears.length > 0 && selectedYears.size === 0) {
      setSelectedYears(new Set(availableYears.slice(0, 3)))
    }
  }, [availableYears])

  async function loadData() {
    setIsLoading(true)
    try {
      if (viewMode === "standardized") {
        // Load template lines
        const templateRes = await fetch(`/api/templates?type=${activeStatement}`)
        const templateData = await templateRes.json()
        setTemplateLines(templateData.lines || [])

        // Load ALL standardized financial data for this bank
        const finRes = await fetch(`/api/banks/${bankId}/financials`)
        const finData = await finRes.json()

        if (finData.financials) {
          const items = Array.isArray(finData.financials)
            ? finData.financials
            : Object.values(finData.financials).flat()

          buildDataMap(items, viewMode)
        }
      } else {
        // "As Reported" view — fetch ALL reported items for this bank
        const repRes = await fetch(`/api/banks/${bankId}/reported?type=${activeStatement}`)
        const repData = await repRes.json()

        if (repData.items) {
          // Build dynamic line list from reported items
          const seenLabels = new Map<string, any>()
          const lineList: any[] = []

          for (const item of repData.items) {
            const label = item.line_item
            if (!seenLabels.has(label)) {
              seenLabels.set(label, item)
              lineList.push({
                id: item.id,
                standardized_code: label, // Use label as key
                line_label: label,
                line_order: item.line_order || lineList.length + 1,
                indent_level: 0,
                is_bold: false,
                is_total: false,
                is_subtotal: false,
                category: item.category || item.statement_type,
              })
            }
          }

          // Sort by line_order
          lineList.sort((a, b) => a.line_order - b.line_order)
          setTemplateLines(lineList)

          buildDataMap(repData.items, viewMode)
        }
      }

      // Load ratios
      const ratioRes = await fetch(`/api/banks/${bankId}`)
      const ratioData = await ratioRes.json()
      setRatios(ratioData.ratios || [])
    } catch (err) {
      console.error("Failed to load financial data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  function buildDataMap(items: any[], vm: ViewMode) {
    const dataMap: MultiPeriodData = {}
    const allPeriodsList: PeriodDataPoint[] = []

    for (const item of items) {
      // Use standardized_code for standardized view, line_item for reported
      const code = vm === "standardized" ? item.standardized_code : item.line_item
      if (!code) continue
      if (!dataMap[code]) dataMap[code] = []

      // Filter by period type
      const isQuarterly = item.form === "10-Q" || item.period_end?.includes("Q")
      const isAnnual = item.form === "10-K" || !isQuarterly

      if (periodType === "annual" && !isAnnual) continue
      if (periodType === "quarterly" && !isQuarterly) continue

      dataMap[code].push({
        period_end: item.period_end,
        fiscal_year: item.fiscal_year,
        value: Number(item.value),
        form: item.form,
      })

      allPeriodsList.push({
        period_end: item.period_end,
        fiscal_year: item.fiscal_year,
        value: Number(item.value),
        form: item.form,
      })
    }

    // Sort each code's periods by fiscal_year desc
    for (const code of Object.keys(dataMap)) {
      dataMap[code].sort((a, b) => b.fiscal_year - a.fiscal_year)
    }

    setFinancialData(dataMap)
    setAllPeriods(allPeriodsList)

    // Get unique years
    const years = [...new Set(allPeriodsList.map(p => p.fiscal_year))].sort((a, b) => b - a)
    setAvailableYears(years)
  }

  const toggleYear = (year: number) => {
    setSelectedYears(prev => {
      const next = new Set(prev)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  }

  const selectAllYears = () => setSelectedYears(new Set(availableYears))
  const deselectAllYears = () => setSelectedYears(new Set())

  // Columns to display (sorted ascending: oldest left, newest right)
  const displayYears = useMemo(() =>
    availableYears.filter(y => selectedYears.has(y)).sort((a, b) => a - b),
    [availableYears, selectedYears])

  const formatValue = (val: number): string => {
    if (val === 0) return "—"
    const abs = Math.abs(val)
    if (abs >= 1_000_000) return (val / 1_000_000).toFixed(2) + "T"
    if (abs >= 1_000) return (val / 1_000).toFixed(1) + "B"
    if (abs >= 1) return val.toFixed(1) + "M"
    return val.toFixed(2) + "M"
  }

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      assets: "text-blue-400", liabilities: "text-red-400", equity: "text-green-400",
      capital: "text-purple-400", revenue: "text-emerald-400", expenses: "text-orange-400",
    }
    return colors[category] || "text-slate-300"
  }

  // Ratio categories
  const ratiosByCategory = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const r of ratios) {
      if (!map[r.category]) map[r.category] = []
      map[r.category].push(r)
    }
    return map
  }, [ratios])

  // Column grid template
  const colGrid = `minmax(250px, 1fr) repeat(${displayYears.length}, ${COLUMN_WIDTH}px)`

  if (isLoading) {
    return (
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardContent className="p-8 space-y-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-6 bg-slate-700" style={{ width: `${50 + Math.random() * 50}%` }} />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Controls Bar — Period Type + Year Selector */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            {/* Statement Selector */}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Statement</label>
              <select
                value={activeStatement}
                onChange={(e) => setActiveStatement(e.target.value)}
                className="rounded-md bg-slate-700 border border-slate-600 text-white text-sm px-3 py-2"
              >
                <option value="balance_sheet">Balance Sheet</option>
                <option value="income_statement">Income Statement</option>
                <option value="cash_flow">Cash Flow</option>
              </select>
            </div>

            {/* Period Type */}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Period Type</label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as PeriodType)}
                className="rounded-md bg-slate-700 border border-slate-600 text-white text-sm px-3 py-2"
              >
                <option value="annual">Annual</option>
                <option value="quarterly">Quarterly</option>
                <option value="ytd">YTD / LTM</option>
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="text-xs text-slate-500 block mb-1">View</label>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <TabsList className="bg-slate-800/50 h-8">
                  <TabsTrigger value="standardized" className="text-xs h-7 data-[state=active]:bg-slate-700">Standardized</TabsTrigger>
                  <TabsTrigger value="reported" className="text-xs h-7 data-[state=active]:bg-slate-700">As Reported</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex-1" />

            <Button size="sm" variant="outline" className="border-slate-600 text-xs h-8">
              ⬇️ Export
            </Button>
          </div>

          {/* Year Checkboxes — S&P Style */}
          <div className="mt-4 pt-3 border-t border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-500">Periods:</span>
              <button onClick={selectAllYears} className="text-xs text-blue-400 hover:text-blue-300">Select All</button>
              <span className="text-slate-600">|</span>
              <button onClick={deselectAllYears} className="text-xs text-blue-400 hover:text-blue-300">Deselect All</button>
              <span className="text-xs text-slate-500 ml-2">{selectedYears.size} of {availableYears.length} selected</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => toggleYear(year)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    selectedYears.has(year)
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  FY{year}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Financial Statement Table */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Card className="bg-slate-800/30 border-slate-700/50 overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-slate-700/50">
          <CardTitle className="text-base text-white flex items-center gap-2">
            {activeStatement === "balance_sheet" ? "Balance Sheet" :
             activeStatement === "income_statement" ? "Income Statement" : "Cash Flow"}
            <Badge variant="secondary" className="text-xs">{viewMode === "standardized" ? "Standardized" : "As Reported"}</Badge>
            <span className="text-slate-500 text-xs font-normal ml-auto">
              USD Millions • {bankName} ({periodType})
            </span>
          </CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <div style={{ minWidth: 400 + displayYears.length * COLUMN_WIDTH }}>
            {/* Column Headers */}
            <div
              className="grid px-4 py-2 bg-slate-800/50 border-b border-slate-700/30 text-xs text-slate-500 uppercase tracking-wider sticky top-0 z-10"
              style={{ gridTemplateColumns: colGrid }}
            >
              <span>Line Item</span>
              {displayYears.map(year => (
                <span key={year} className="text-right">FY {year}</span>
              ))}
            </div>

            {/* Line Items */}
            <div className="divide-y divide-slate-700/20 max-h-[600px] overflow-y-auto">
              {templateLines.map((line) => {
                const periods = financialData[line.standardized_code] || []

                return (
                  <div
                    key={line.id}
                    className={`grid px-4 py-1.5 hover:bg-slate-800/30 transition-colors ${
                      line.is_total ? "bg-slate-800/40 border-t border-b border-slate-600/50 font-bold" : ""
                    } ${line.is_subtotal ? "bg-slate-800/20" : ""}`}
                    style={{ gridTemplateColumns: colGrid }}
                  >
                    {/* Line label with indentation */}
                    <span
                      className={`text-sm truncate ${
                        line.is_bold || line.is_total ? "font-bold text-white" :
                        line.is_subtotal ? "font-semibold text-slate-200" :
                        getCategoryColor(line.category)
                      }`}
                      style={{ paddingLeft: `${line.indent_level * 16}px` }}
                    >
                      {line.line_label}
                    </span>

                    {/* Value columns */}
                    {displayYears.map(year => {
                      const dp = periods.find(p => p.fiscal_year === year)
                      const val = dp?.value
                      const hasValue = val !== undefined && val !== null && val !== 0

                      return (
                        <span
                          key={year}
                          className={`text-sm text-right font-mono tabular-nums ${
                            line.is_total || line.is_bold ? "font-bold text-white" :
                            hasValue ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          {hasValue ? formatValue(val!) : "—"}
                        </span>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {templateLines.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                <p className="mb-2">No financial data available for this statement.</p>
                <p className="text-sm">Data is populated automatically from SEC filings and other sources.</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Key Ratios Section */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardHeader className="py-3 px-4 border-b border-slate-700/50">
          <CardTitle className="text-base text-white">Key Ratios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {Object.keys(ratiosByCategory).length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p>No ratio data available yet. Ratios are auto-computed when financial data is loaded.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {Object.entries(ratiosByCategory).map(([category, categoryRatios]) => {
                // Group ratios by code to show multi-year
                const byCode: Record<string, any[]> = {}
                for (const r of categoryRatios) {
                  if (!byCode[r.ratio_code]) byCode[r.ratio_code] = []
                  byCode[r.ratio_code].push(r)
                }

                return (
                  <div key={category} className="py-4 px-4">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 capitalize">
                      {category.replace(/_/g, " ")}
                    </h3>
                    <div className="overflow-x-auto">
                      <div style={{ minWidth: 400 + displayYears.length * COLUMN_WIDTH }}>
                        {/* Ratio Headers */}
                        <div
                          className="grid px-2 py-1.5 text-xs text-slate-500 uppercase"
                          style={{ gridTemplateColumns: colGrid }}
                        >
                          <span>Ratio</span>
                          {displayYears.map(year => (
                            <span key={year} className="text-right">FY {year}</span>
                          ))}
                        </div>

                        {/* Ratio Rows */}
                        {Object.entries(byCode).map(([code, items]) => (
                          <div
                            key={code}
                            className="grid px-2 py-1.5 hover:bg-slate-800/20 text-sm"
                            style={{ gridTemplateColumns: colGrid }}
                          >
                            <span className="text-slate-400">{items[0]?.ratio_name || code}</span>
                            {displayYears.map(year => {
                              const match = items.find((i: any) => i.fiscal_year === year)
                              const val = match?.value
                              const unit = match?.unit || "%"
                              return (
                                <span
                                  key={year}
                                  className={`text-right font-mono tabular-nums ${
                                    val !== undefined ? "text-white font-semibold" : "text-slate-600"
                                  }`}
                                >
                                  {val !== undefined ? `${Number(val).toFixed(2)}${unit}` : "—"}
                                </span>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Ratio Chart */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {ratios.length > 0 && (
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader className="py-3 px-4 border-b border-slate-700/50">
            <CardTitle className="text-base text-white">Ratio Trends</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <BankComparisonChart
              data={(() => {
                // Chart: show latest year ratios by category
                const latestYear = availableYears[0]
                const latestRatios = ratios.filter((r: any) => r.fiscal_year === latestYear)
                return latestRatios.map((r: any) => ({
                  name: r.ratio_name,
                  value: Number(r.value),
                }))
              })()}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
