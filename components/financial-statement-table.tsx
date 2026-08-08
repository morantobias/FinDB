"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

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

interface FinancialData {
  [code: string]: {
    value: number
    unit: string
    period_end: string
    fiscal_year: number
  } | undefined
}

interface StatementTableProps {
  bankId: string
  bankName: string
}

export function FinancialStatementTable({ bankId, bankName }: StatementTableProps) {
  const [activeStatement, setActiveStatement] = useState("balance_sheet")
  const [activePeriod, setActivePeriod] = useState("latest")
  const [viewMode, setViewMode] = useState<"standardized" | "reported">("standardized")
  const [isLoading, setIsLoading] = useState(true)
  const [templateLines, setTemplateLines] = useState<TemplateLineItem[]>([])
  const [financialData, setFinancialData] = useState<FinancialData>({})
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [bankId, activeStatement])

  async function loadData() {
    setIsLoading(true)
    try {
      // Get template lines for this statement type
      const templateRes = await fetch(`/api/templates?type=${activeStatement}`)
      const templateData = await templateRes.json()
      setTemplateLines(templateData.lines || [])

      // Get financial data for this bank
      const codes = (templateData.lines || []).map((l: TemplateLineItem) => l.standardized_code).join(",")
      const finRes = await fetch(`/api/banks/${bankId}/financials?codes=${codes}`)
      const finData = await finRes.json()

      // Build lookup map
      const dataMap: FinancialData = {}
      const periods = new Set<string>()
      if (finData.financials) {
        for (const code of Object.keys(finData.financials)) {
          const items = finData.financials[code] || []
          if (items.length > 0) {
            const latest = items[0]
            dataMap[code] = {
              value: Number(latest.value),
              unit: latest.unit,
              period_end: latest.period_end,
              fiscal_year: latest.fiscal_year,
            }
            items.forEach((i: any) => periods.add(`${i.fiscal_year}|${i.period_end}`))
          }
        }
      }
      setFinancialData(dataMap)
      setAvailablePeriods(Array.from(periods).sort().reverse())
    } catch (err) {
      console.error("Failed to load financial data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatValue = (val: number): string => {
    if (Math.abs(val) >= 1_000_000) return (val / 1_000_000).toFixed(2) + "T"
    if (Math.abs(val) >= 1_000) return (val / 1_000).toFixed(1) + "B"
    if (Math.abs(val) >= 1) return val.toFixed(1) + "M"
    return val.toFixed(2) + "M"
  }

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      assets: "text-blue-400",
      liabilities: "text-red-400",
      equity: "text-green-400",
      capital: "text-purple-400",
      revenue: "text-emerald-400",
      expenses: "text-orange-400",
    }
    return colors[category] || "text-slate-300"
  }

  if (isLoading) {
    return (
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardContent className="p-8 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-6 bg-slate-700" style={{ width: `${60 + Math.random() * 40}%` }} />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Statement Selector */}
        <select
          value={activeStatement}
          onChange={(e) => setActiveStatement(e.target.value)}
          className="rounded-md bg-slate-700 border border-slate-600 text-white text-sm px-3 py-2"
        >
          <option value="balance_sheet">Balance Sheet</option>
          <option value="income_statement">Income Statement</option>
          <option value="cash_flow">Cash Flow</option>
        </select>

        {/* View Mode: Standardized vs As Reported */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "standardized" | "reported")}>
          <TabsList className="bg-slate-800/50 h-8">
            <TabsTrigger value="standardized" className="text-xs h-7 data-[state=active]:bg-slate-700">Standardized</TabsTrigger>
            <TabsTrigger value="reported" className="text-xs h-7 data-[state=active]:bg-slate-700">As Reported</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1" />

        {/* Export */}
        <Button size="sm" variant="outline" className="border-slate-600 text-xs h-8">
          ⬇️ Export
        </Button>
      </div>

      {/* Statement Table */}
      <Card className="bg-slate-800/30 border-slate-700/50 overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-slate-700/50">
          <CardTitle className="text-base text-white flex items-center gap-2">
            {activeStatement === "balance_sheet" ? "Balance Sheet" :
             activeStatement === "income_statement" ? "Income Statement" : "Cash Flow"}
            <Badge variant="secondary" className="text-xs">
              {viewMode === "standardized" ? "Standardized" : "As Reported"}
            </Badge>
            <span className="text-slate-500 text-xs font-normal ml-auto">{bankName}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Column Headers */}
          <div className="grid grid-cols-[1fr_140px] px-4 py-2 bg-slate-800/50 border-b border-slate-700/30 text-xs text-slate-500 uppercase tracking-wider">
            <span>Line Item</span>
            <span className="text-right">FY {financialData[Object.keys(financialData)[0]]?.fiscal_year || "—"} (USD M)</span>
          </div>

          {/* Line Items */}
          <div className="divide-y divide-slate-700/20 max-h-[600px] overflow-auto">
            {templateLines.map((line) => {
              const data = financialData[line.standardized_code]
              const hasValue = data && data.value !== undefined && data.value !== 0

              return (
                <div
                  key={line.id}
                  className={`grid grid-cols-[1fr_140px] px-4 py-1.5 hover:bg-slate-800/30 transition-colors ${
                    line.is_total ? "bg-slate-800/40 border-t border-b border-slate-600/50" : ""
                  } ${line.is_subtotal ? "bg-slate-800/20" : ""}`}
                  style={{ paddingLeft: `${12 + line.indent_level * 20}px` }}
                >
                  <span className={`text-sm truncate ${
                    line.is_bold || line.is_total ? "font-bold text-white" :
                    line.is_subtotal ? "font-semibold text-slate-200" :
                    getCategoryColor(line.category)
                  }`}>
                    {line.is_total ? "" : line.is_subtotal ? "" : ""}
                    {line.line_label}
                  </span>
                  <span className={`text-sm text-right font-mono tabular-nums ${
                    line.is_total || line.is_bold ? "font-bold text-white" :
                    line.is_subtotal ? "font-semibold text-slate-200" :
                    hasValue ? "text-slate-300" : "text-slate-600"
                  }`}>
                    {hasValue ? formatValue(data!.value) : "—"}
                  </span>
                </div>
              )
            })}
          </div>

          {templateLines.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <p className="mb-2">No financial data available for this statement.</p>
              <p className="text-sm">
                {viewMode === "standardized"
                  ? "Standardized data is populated automatically from SEC filings and other sources."
                  : "Reported data comes from uploaded or auto-imported filings."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
