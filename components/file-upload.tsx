"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { upload } from "@vercel/blob/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface FileUploadProps {
  bankId: string
  bankName: string
  onUploadComplete?: (result: any) => void
}

export function FileUpload({ bankId, bankName, onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [filingType, setFilingType] = useState("Annual Report")
  const [periodEnd, setPeriodEnd] = useState("")
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear().toString())
  const router = useRouter()

  const handleUpload = useCallback(async (file: File) => {
    if (!file) return
    setIsUploading(true)
    setError(null)
    setUploadProgress(0)
    setUploadStatus("Uploading file...")

    try {
      // Step 1: Upload file to blob storage
      setUploadProgress(10)
      let blobUrl: string

      try {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/blob/client-upload",
          multipart: true,
        })
        blobUrl = blob.url
      } catch (blobError: any) {
        // Fallback to local storage
        setUploadStatus("Uploading to local storage...")
        const formData = new FormData()
        formData.append("file", file)
        const localResponse = await fetch("/api/local-upload", { method: "POST", body: formData })
        if (!localResponse.ok) throw new Error("Local upload failed")
        const localResult = await localResponse.json()
        blobUrl = localResult.url
      }

      // Step 2: Register filing in database
      setUploadStatus("Registering filing...")
      setUploadProgress(60)

      const filingResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl,
          originalFilename: file.name,
          bankId,
          filingType,
          periodEnd: periodEnd || new Date().toISOString().split('T')[0],
          fiscalYear: parseInt(fiscalYear),
          filingDate: new Date().toISOString().split('T')[0],
        }),
      })

      const filingResult = await filingResponse.json()
      if (!filingResult.success) throw new Error(filingResult.error || "Filing registration failed")

      setUploadProgress(80)
      setUploadStatus("Extracting financial data...")

      // Step 3: Process filing (extract financials with AI)
      const processResponse = await fetch("/api/process-filing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filingId: filingResult.data.filingId }),
      })

      const processResult = await processResponse.json()
      if (!processResult.success) {
        console.warn("Financial extraction incomplete:", processResult.error)
      }

      setUploadProgress(100)
      setUploadStatus("Complete!")
      if (onUploadComplete) onUploadComplete(filingResult.data)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Upload failed")
      setUploadStatus("Failed")
    } finally {
      setIsUploading(false)
    }
  }, [bankId, filingType, periodEnd, fiscalYear, onUploadComplete, router])

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (file.type !== "application/pdf") { setError("Only PDF files are supported"); return }
    if (file.size > 50 * 1024 * 1024) { setError("File exceeds 50MB limit"); return }
    handleUpload(file)
  }, [handleUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  return (
    <Card className="bg-slate-800/30 border-slate-700/50">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Upload Filing for {bankName}</h3>

        {/* Filing metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Filing Type</label>
            <select
              value={filingType}
              onChange={(e) => setFilingType(e.target.value)}
              className="w-full rounded-md bg-slate-700 border border-slate-600 text-white text-sm px-3 py-2"
            >
              <option>Annual Report</option>
              <option>10-K</option>
              <option>10-Q</option>
              <option>Pillar 3 Report</option>
              <option>Earnings Release</option>
              <option>Investor Presentation</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Period End</label>
            <Input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Fiscal Year</label>
            <Input
              type="number"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white text-sm"
            />
          </div>
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${isDragging ? "border-blue-500 bg-blue-500/10" : "border-slate-600 hover:border-slate-500"}
            ${isUploading ? "pointer-events-none opacity-50" : ""}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => document.getElementById("filing-upload-input")?.click()}
        >
          <input
            id="filing-upload-input"
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          {isUploading ? (
            <div className="space-y-3">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-slate-400 text-sm">{uploadStatus}</p>
              <p className="text-slate-500 text-xs">{uploadProgress}%</p>
            </div>
          ) : (
            <div>
              <p className="text-slate-400">📄 Drag & drop a PDF here, or click to browse</p>
              <p className="text-slate-500 text-sm mt-1">Annual reports, 10-K, 10-Q, Pillar 3 — max 50MB</p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
