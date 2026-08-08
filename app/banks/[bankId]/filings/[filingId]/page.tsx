"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function FilingViewerPage() {
  const params = useParams()
  const bankId = params.bankId as string
  const filingId = params.filingId as string

  const [filing, setFiling] = useState<any>(null)
  const [bank, setBank] = useState<any>(null)
  const [lineItems, setLineItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/filings/${filingId}`)
      .then(r => r.json())
      .then(data => {
        setFiling(data.filing)
        setBank(data.bank)
        setLineItems(data.reportedLineItems || [])
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [filingId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || isChatLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
    }
    setMessages(prev => [...prev, userMsg])
    setInputValue("")
    setIsChatLoading(true)

    try {
      const response = await fetch(`/api/filings/${filingId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: inputValue }),
      })
      const data = await response.json()
      if (data.response) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: data.response }])
      } else if (data.error) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: `Error: ${data.error}` }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: "Failed to get response. Please try again." }])
    } finally {
      setIsChatLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <Skeleton className="h-12 w-96 mb-8 bg-slate-800" />
        <Skeleton className="h-96 w-full bg-slate-800" />
      </div>
    )
  }

  if (!filing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Filing Not Found</h1>
          <Link href={`/banks/${bankId}`}><Button variant="outline">Back to Bank</Button></Link>
        </div>
      </div>
    )
  }

  const balanceSheet = lineItems.filter((i: any) => i.statement_type === "balance_sheet")
  const incomeStatement = lineItems.filter((i: any) => i.statement_type === "income_statement")
  const cashFlow = lineItems.filter((i: any) => i.statement_type === "cash_flow")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Link href={`/banks/${bankId}`} className="text-slate-400 hover:text-white text-sm mb-4 inline-block">
          ← Back to {bank?.name || "Bank"}
        </Link>

        {/* Filing Header */}
        <Card className="bg-slate-800/30 border-slate-700/50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">
                  {bank?.name} — {filing.filing_type}
                </h1>
                <p className="text-slate-400 mt-1">
                  FY {filing.fiscal_year} • Period Ending {filing.period_end} • Filed {new Date(filing.filing_date).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={filing.status === "extracted" ? "default" : "secondary"}>
                {filing.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Split View: Financial Data + Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Financial Data */}
          <div>
            <Tabs defaultValue="balance_sheet">
              <TabsList className="bg-slate-800/50 mb-4">
                <TabsTrigger value="balance_sheet" className="data-[state=active]:bg-slate-700 text-xs">Balance Sheet</TabsTrigger>
                <TabsTrigger value="income_statement" className="data-[state=active]:bg-slate-700 text-xs">Income Statement</TabsTrigger>
                <TabsTrigger value="cash_flow" className="data-[state=active]:bg-slate-700 text-xs">Cash Flow</TabsTrigger>
              </TabsList>

              {(["balance_sheet", "income_statement", "cash_flow"] as const).map(stmtType => {
                const items = stmtType === "balance_sheet" ? balanceSheet :
                  stmtType === "income_statement" ? incomeStatement : cashFlow
                return (
                  <TabsContent key={stmtType} value={stmtType}>
                    <Card className="bg-slate-800/30 border-slate-700/50">
                      <ScrollArea className="h-[600px]">
                        <CardContent className="p-0">
                          {items.length === 0 ? (
                            <div className="text-center py-20 text-slate-500">No data extracted yet.</div>
                          ) : (
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-slate-800">
                                <tr>
                                  <th className="text-left p-3 text-slate-400 font-medium">Line Item</th>
                                  <th className="text-right p-3 text-slate-400 font-medium">Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item: any) => (
                                  <tr key={item.id} className="border-t border-slate-700/30 hover:bg-slate-800/20">
                                    <td className="p-3 text-slate-300">{item.line_item}</td>
                                    <td className="p-3 text-right text-white font-mono">
                                      {Number(item.value).toLocaleString()} <span className="text-slate-500 text-xs">{item.unit}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </CardContent>
                      </ScrollArea>
                    </Card>
                  </TabsContent>
                )
              })}
            </Tabs>
          </div>

          {/* Right: Chat */}
          <Card className="bg-slate-800/30 border-slate-700/50 flex flex-col h-[700px]">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-lg text-white">💬 Ask About This Filing</CardTitle>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 py-20">
                  <p className="mb-2">Ask questions about the financial data in this filing.</p>
                  <p className="text-sm">Try: "What was net income?" or "Compare total assets to last year."</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-200"
                      }`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-700 rounded-lg p-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </ScrollArea>
            <div className="p-4 border-t border-slate-700/50">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about this filing..."
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Button onClick={handleSend} disabled={isChatLoading || !inputValue.trim()}>
                  Send
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
