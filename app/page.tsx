"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { REGION_LABELS, type BankRegion } from "@/types/bank"

interface BankSummary {
  id: string
  bank_code: string | null
  name: string
  ticker: string | null
  country: string
  region: BankRegion
  total_assets: number | null
}

export default function HomePage() {
  const [banks, setBanks] = useState<BankSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({ totalBanks: 0, totalFilings: 0, regions: 0 })

  useEffect(() => {
    fetch("/api/banks")
      .then(r => r.json())
      .then(data => {
        const bankList = data.banks || []
        setBanks(bankList)
        const regions = new Set(bankList.map((b: BankSummary) => b.region))
        setStats({
          totalBanks: bankList.length,
          totalFilings: 0,
          regions: regions.size,
        })
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const banksByRegion = banks.reduce((acc, bank) => {
    if (!acc[bank.region]) acc[bank.region] = []
    acc[bank.region].push(bank)
    return acc
  }, {} as Record<string, BankSummary[]>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5" />
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Institutional-Grade Financial Database
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white mb-6 tracking-tight">
              Fin<span className="text-blue-400">DB</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Global bank financial database — reported & standardized financials,
              key ratios, AI-powered research. Compete with S&P Capital IQ.
            </p>
            <div className="flex items-center justify-center gap-4 mt-10">
              <Link href="/banks">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-6 text-lg">
                  Explore Banks →
                </Button>
              </Link>
              <Link href="/research">
                <Button size="lg" variant="outline" className="border-slate-700 text-slate-300 hover:text-white px-8 py-6 text-lg">
                  AI Research →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white">{stats.totalBanks}</div>
              <div className="text-slate-400 mt-1">Global Banks</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white">{stats.totalFilings}</div>
              <div className="text-slate-400 mt-1">Filings Indexed</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-white">{stats.regions}</div>
              <div className="text-slate-400 mt-1">Regions Covered</div>
            </CardContent>
          </Card>
        </div>

        {/* Region Sections */}
        {isLoading ? (
          <div className="text-center text-slate-400 py-20">Loading database...</div>
        ) : banks.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white mb-4">No Banks Yet</h2>
            <p className="text-slate-400 mb-6">Seed the database to get started with the top 50 global banks.</p>
            <Link href="/banks">
              <Button variant="outline" className="border-slate-700">Go to Bank Setup →</Button>
            </Link>
          </div>
        ) : (
          Object.entries(banksByRegion).map(([region, regionBanks]) => (
            <div key={region} className="mb-10">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                {REGION_LABELS[region as BankRegion] || region}
                <Badge variant="outline" className="ml-2">{regionBanks.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regionBanks.slice(0, 10).map(bank => (
                  <Link key={bank.id} href={`/banks/${bank.id}`}>
                    <Card className="bg-slate-800/30 border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {bank.bank_code && <span className="text-blue-400 font-mono text-xs mr-1.5">{bank.bank_code}</span>}
                              {bank.name}
                            </h3>
                            <p className="text-sm text-slate-400 mt-0.5">
                              {bank.ticker ? `${bank.ticker} • ` : ""}{bank.country}
                            </p>
                          </div>
                          {bank.total_assets && (
                            <Badge variant="secondary" className="text-xs">
                              ${(bank.total_assets / 1e9).toFixed(0)}B
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
