"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileUpload } from "@/components/file-upload"
import { REGION_LABELS, type BankRegion, type Bank, type BankFiling } from "@/types/bank"
import { STANDARDIZED_CODES, type KeyRatio } from "@/types/financial"

export default function BankDetailPage() {
  const params = useParams()
  const bankId = params.bankId as string

  const [bank, setBank] = useState<Bank | null>(null)
  const [filings, setFilings] = useState<BankFiling[]>([])
  const [ratios, setRatios] = useState<KeyRatio[]>([])
  const [standardizedFinancials, setStandardizedFinancials] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/banks/${bankId}`)
      .then(r => r.json())
      .then(data => {
        setBank(data.bank)
        setFilings(data.filings || [])
        setRatios(data.ratios || [])
        setStandardizedFinancials(data.standardizedFinancials || [])
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [bankId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-96 mb-8 bg-slate-800" />
          <Skeleton className="h-64 w-full mb-8 bg-slate-800" />
        </div>
      </div>
    )
  }

  if (!bank) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Bank Not Found</h1>
          <Link href="/banks"><Button variant="outline">Back to Banks</Button></Link>
        </div>
      </div>
    )
  }

  // Group ratios by category
  const ratiosByCategory = ratios.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = []
    acc[r.category].push(r)
    return acc
  }, {} as Record<string, KeyRatio[]>)

  const latestPeriod = filings[0]?.period_end || "N/A"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Link href="/banks" className="text-slate-400 hover:text-white text-sm mb-4 inline-block">← Back to Banks</Link>

        {/* Bank Header */}
        <Card className="bg-slate-800/30 border-slate-700/50 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black text-white">{bank.name}</h1>
                  <Badge>{REGION_LABELS[bank.region as BankRegion]}</Badge>
                </div>
                <p className="text-slate-400">
                  {bank.ticker ? `${bank.ticker} • ` : ""}{bank.country}
                  {bank.headquarters ? ` • HQ: ${bank.headquarters}` : ""}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-right">
                <div>
                  <div className="text-slate-500 text-sm">Total Assets</div>
                  <div className="text-white font-bold text-xl">
                    {bank.total_assets ? `$${(bank.total_assets / 1e9).toFixed(1)}B` : "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-sm">Employees</div>
                  <div className="text-white font-bold text-xl">
                    {bank.employee_count?.toLocaleString() || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-sm">Filings</div>
                  <div className="text-white font-bold text-xl">{filings.length}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="filings" className="w-full">
          <TabsList className="bg-slate-800/50 mb-6">
            <TabsTrigger value="filings" className="data-[state=active]:bg-slate-700">Filings ({filings.length})</TabsTrigger>
            <TabsTrigger value="ratios" className="data-[state=active]:bg-slate-700">Key Ratios</TabsTrigger>
            <TabsTrigger value="financials" className="data-[state=active]:bg-slate-700">Standardized Financials</TabsTrigger>
          </TabsList>

          {/* Filings Tab */}
          <TabsContent value="filings">
            <div className="mb-6">
              <FileUpload bankId={bankId} bankName={bank.name} onUploadComplete={() => {
                // Refresh data after upload
                fetch(`/api/banks/${bankId}`)
                  .then(r => r.json())
                  .then(data => {
                    setFilings(data.filings || [])
                    setRatios(data.ratios || [])
                    setStandardizedFinancials(data.standardizedFinancials || [])
                  })
              }} />
            </div>
            {filings.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                No filings yet. Upload your first financial report above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filings.map(filing => (
                  <Link key={filing.id} href={`/banks/${bankId}/filings/${filing.id}`}>
                    <Card className="bg-slate-800/30 border-slate-700/50 hover:border-blue-500/50 transition-all cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-white">{filing.filing_type}</h3>
                            <p className="text-sm text-slate-400">
                              FY {filing.fiscal_year} • Period: {filing.period_end}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Filed: {new Date(filing.filing_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={filing.status === "extracted" ? "default" : "secondary"}>
                            {filing.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Ratios Tab */}
          <TabsContent value="ratios">
            {Object.keys(ratiosByCategory).length === 0 ? (
              <div className="text-center py-20 text-slate-400">No ratio data available.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(ratiosByCategory).map(([category, categoryRatios]) => (
                  <Card key={category} className="bg-slate-800/30 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-lg text-white capitalize">{category.replace(/_/g, " ")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {categoryRatios.slice(0, 8).map(ratio => (
                          <div key={ratio.id} className="flex justify-between items-center">
                            <span className="text-sm text-slate-400">{ratio.ratio_name}</span>
                            <span className="text-sm font-semibold text-white">
                              {ratio.value}{ratio.unit || "%"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Standardized Financials Tab */}
          <TabsContent value="financials">
            {standardizedFinancials.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                Standardized financial data not yet extracted. Upload and process filings to populate.
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {(["balance_sheet", "income_statement", "cash_flow"] as const).map(stmtType => {
                    const items = standardizedFinancials.filter((i: any) => {
                      const code = i.standardized_code
                      if (stmtType === "balance_sheet") return code.startsWith("BS_")
                      if (stmtType === "income_statement") return code.startsWith("IS_")
                      return code.startsWith("CF_")
                    })
                    if (items.length === 0) return null
                    return (
                      <Card key={stmtType} className="bg-slate-800/30 border-slate-700/50">
                        <CardHeader>
                          <CardTitle className="text-lg text-white capitalize">
                            {stmtType.replace(/_/g, " ")} ({latestPeriod})
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {items.map((item: any) => (
                              <div key={item.id} className="flex justify-between py-1 border-b border-slate-700/30">
                                <span className="text-sm text-slate-400">{item.standardized_label}</span>
                                <span className="text-sm font-semibold text-white">
                                  {item.value.toLocaleString()} {item.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
