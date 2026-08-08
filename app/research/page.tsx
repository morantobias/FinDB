"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BankComparisonChart } from "@/components/charts"

export default function ResearchPage() {
  const [question, setQuestion] = useState("")
  const [response, setResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [queryHistory, setQueryHistory] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [comparisonCodes, setComparisonCodes] = useState("BS_TOTAL_ASSETS")
  const responseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/research", { method: "GET" })
      .then(r => r.json())
      .then(data => setQueryHistory(data.queries || []))
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!question.trim() || isLoading) return

    setIsLoading(true)
    setResponse(null)

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      if (data.response) {
        setResponse(data.response)
      } else {
        setResponse(`Error: ${data.error || "Unknown error"}`)
      }
    } catch (err) {
      setResponse("Failed to connect to research engine. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Link href="/" className="text-slate-400 hover:text-white text-sm mb-4 inline-block">← Back to Home</Link>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-white mb-3">AI Research Engine</h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Cross-bank analysis powered by AI. Ask complex questions across geographies, 
            compare banks, identify trends, and generate analyst-grade reports.
          </p>
        </div>

        {/* Suggested Queries */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Suggested Queries</h2>
          <div className="flex flex-wrap gap-2">
            {[
              "What are deposit trends across European banks?",
              "Compare CET1 ratios across North American banks",
              "Which banks have the highest CRE exposure?",
              "What are the funding mixes across APAC banks?",
              "Show me banks with the largest exposure to low-rate debt soon to roll off",
              "Compare NIM trends across all regions",
            ].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setQuestion(suggestion)}
                className="px-3 py-1.5 rounded-full text-xs bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <Card className="bg-slate-800/30 border-slate-700/50 mb-8">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Ask a research question — e.g., 'What are funding mixes across European banks?'"
                className="flex-1 bg-slate-700/50 border-slate-600 text-white text-lg py-6"
              />
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !question.trim()}
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 px-8"
              >
                {isLoading ? "Analyzing..." : "Research →"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card className="bg-slate-800/30 border-slate-700/50 mb-8">
            <CardContent className="p-12 text-center">
              <div className="flex justify-center gap-2 mb-4">
                <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
              <p className="text-slate-400">Analyzing across all banks and financial data...</p>
            </CardContent>
          </Card>
        )}

        {/* Response with Tabs */}
        {response && (
          <Tabs defaultValue="analysis" className="mb-8">
            <TabsList className="bg-slate-800/50 mb-4">
              <TabsTrigger value="analysis" className="data-[state=active]:bg-slate-700">📊 Analysis</TabsTrigger>
              <TabsTrigger value="charts" className="data-[state=active]:bg-slate-700">📈 Comparison Charts</TabsTrigger>
            </TabsList>
            <TabsContent value="analysis">
              <Card className="bg-slate-800/30 border-slate-700/50" ref={responseRef}>
                <CardHeader className="border-b border-slate-700/50 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Research Results</CardTitle>
                    <CardDescription className="text-slate-400">
                      Generated at {new Date().toLocaleString()}
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600"
                    onClick={() => {
                      const blob = new Blob([`# FinDB Research Report\n\n**Question:** ${question}\n\n**Generated:** ${new Date().toLocaleString()}\n\n---\n\n${response}`], { type: "text/markdown" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url; a.download = `findb-report-${Date.now()}.md`; a.click()
                    }}
                  >
                    ⬇️ Download Report
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {response}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="charts">
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Bank Comparison Charts</CardTitle>
                  <CardDescription className="text-slate-400">
                    Select standardized codes to compare across banks
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex gap-3 mb-4">
                    <select
                      value={comparisonCodes}
                      onChange={(e) => setComparisonCodes(e.target.value)}
                      className="rounded-md bg-slate-700 border border-slate-600 text-white text-sm px-3 py-2"
                    >
                      <option value="BS_TOTAL_ASSETS">Total Assets</option>
                      <option value="IS_NET_INCOME">Net Income</option>
                      <option value="BS_TOTAL_EQUITY">Total Equity</option>
                      <option value="BS_TOTAL_DEPOSITS">Total Deposits</option>
                      <option value="BS_NET_LOANS">Net Loans</option>
                      <option value="IS_NET_INTEREST_INCOME">Net Interest Income</option>
                      <option value="IS_TOTAL_REVENUE">Total Revenue</option>
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600"
                      onClick={async () => {
                        const res = await fetch(`/api/compare?codes=${comparisonCodes}`)
                        const data = await res.json()
                        if (data.results) {
                          setChartData(data.results.map((r: any) => ({
                            name: `${r.ticker || r.bank_name}`,
                            bank_name: r.bank_name,
                            value: Number(r.value) / 1e9, // Convert to billions
                          })).sort((a: any, b: any) => b.value - a.value).slice(0, 15))
                        }
                      }}
                    >
                      Compare →
                    </Button>
                  </div>
                  {chartData.length > 0 && (
                    <BankComparisonChart data={chartData} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* History */}
        {queryHistory.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Recent Research</h2>
            <div className="space-y-2">
              {queryHistory.map((q: any) => (
                <Card key={q.id} className="bg-slate-800/20 border-slate-700/30">
                  <CardContent className="p-3 flex items-center justify-between">
                    <span className="text-sm text-slate-300 truncate flex-1">{q.question}</span>
                    <Badge variant="secondary" className="text-xs ml-2">{q.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
