"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { REGION_LABELS, type BankRegion, type Bank } from "@/types/bank"

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeRegion, setActiveRegion] = useState<string>("all")

  useEffect(() => {
    fetch("/api/banks")
      .then(r => r.json())
      .then(data => setBanks(data.banks || []))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = banks.filter(b => {
    const matchesRegion = activeRegion === "all" || b.region === activeRegion
    const matchesSearch = !search || 
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.ticker || "").toLowerCase().includes(search.toLowerCase()) ||
      b.country.toLowerCase().includes(search.toLowerCase())
    return matchesRegion && matchesSearch
  })

  const regions = ["all", ...new Set(banks.map(b => b.region))]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8 bg-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-32 bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="text-slate-400 hover:text-white text-sm mb-2 inline-block">← Back to Home</Link>
            <h1 className="text-4xl font-black text-white">Global Banks</h1>
            <p className="text-slate-400 mt-2">{banks.length} banks across {new Set(banks.map(b => b.region)).size} regions</p>
          </div>
          <Link href="/research">
            <Button variant="outline" className="border-slate-700">AI Research →</Button>
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Input
            placeholder="Search banks by name, ticker, or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md bg-slate-800/50 border-slate-700 text-white"
          />
          <Tabs value={activeRegion} onValueChange={setActiveRegion} className="w-full">
            <TabsList className="bg-slate-800/50">
              {regions.map(r => (
                <TabsTrigger key={r} value={r} className="text-slate-400 data-[state=active]:text-white">
                  {r === "all" ? "All Regions" : REGION_LABELS[r as BankRegion] || r}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Bank Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(bank => (
            <Link key={bank.id} href={`/banks/${bank.id}`}>
              <Card className="bg-slate-800/30 border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg text-white group-hover:text-blue-400 transition-colors">
                        {bank.name}
                      </CardTitle>
                      <p className="text-sm text-slate-400 mt-1">
                        {bank.ticker ? `${bank.ticker} • ` : ""}{bank.country}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {REGION_LABELS[bank.region as BankRegion]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-slate-500">Total Assets</div>
                      <div className="text-white font-semibold">
                        {bank.total_assets ? `$${(bank.total_assets / 1e9).toFixed(0)}B` : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Employees</div>
                      <div className="text-white font-semibold">
                        {bank.employee_count ? bank.employee_count.toLocaleString() : "N/A"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            No banks found matching your criteria.
          </div>
        )}
      </div>
    </div>
  )
}
