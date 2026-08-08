/**
 * LlamaParse Service — async v2 REST API for PDF parsing.
 *
 * Flow:
 *   1. submitAsyncParseJob()  — POST PDF to LlamaCloud /api/v2/parse/upload
 *   2. checkAsyncParseJobStatus() — GET /api/v2/parse/{jobId}?expand=markdown
 *   3. Returns per-page markdown with real page numbers (1:1 PDF mapping)
 *
 * Tier: 'agentic' for best results on complex financial documents.
 */
interface ParsedPage {
  pageNumber: number
  content: string
  metadata: {
    pageType?: string
    hasTable?: boolean
    wordCount: number
    charCount: number
  }
}

export class LlamaParseService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.LLAMAPARSE_API_KEY || ""
    if (!this.apiKey) {
      throw new Error("LLAMAPARSE_API_KEY environment variable is required")
    }
  }

  async submitAsyncParseJob(pdfBuffer: Buffer, filename: string): Promise<string> {
    console.log(`🦙 LlamaParse v2: submitting ${filename} (${(pdfBuffer.length / 1024 / 1024).toFixed(1)}MB)`)

    const configuration = JSON.stringify({
      tier: 'agentic',
      version: 'latest',
      output_options: {
        markdown: {
          annotate_links: false,
          tables: { compact_markdown_tables: false, output_tables_as_markdown: true, merge_continued_tables: true },
        },
      },
      processing_options: { ocr_parameters: { languages: ['en'] } },
    })

    const formData = new FormData()
    formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), filename)
    formData.append('configuration', configuration)

    const response = await fetch('https://api.cloud.llamaindex.ai/api/v2/parse/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`LlamaParse v2 upload failed (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    const jobId = data.id || data.job_id
    console.log(`✅ LlamaParse v2 job submitted: ${jobId}`)
    return jobId
  }

  async checkAsyncParseJobStatus(jobId: string): Promise<{
    status: 'PENDING' | 'SUCCESS' | 'ERROR'
    pages?: ParsedPage[]
    error?: string
  }> {
    console.log(`🔄 Checking LlamaParse v2 job: ${jobId}`)

    const statusResponse = await fetch(
      `https://api.cloud.llamaindex.ai/api/v2/parse/${jobId}?expand=markdown`,
      { headers: { 'Authorization': `Bearer ${this.apiKey}` } }
    )

    if (!statusResponse.ok) {
      throw new Error(`LlamaParse v2 status check failed (${statusResponse.status})`)
    }

    const statusData = await statusResponse.json()
    const status = statusData.status

    if (status === 'ERROR') {
      return { status: 'ERROR', error: statusData.error || 'Unknown parsing error' }
    }

    if (status === 'PENDING') {
      return { status: 'PENDING' }
    }

    // SUCCESS — extract pages from markdown
    if (status === 'SUCCESS' && statusData.markdown) {
      const markdown = statusData.markdown
      const pages = this.splitMarkdownIntoPages(markdown)
      console.log(`✅ LlamaParse v2 complete: ${pages.length} pages extracted`)
      return { status: 'SUCCESS', pages }
    }

    return { status: 'PENDING' }
  }

  private splitMarkdownIntoPages(markdown: string): ParsedPage[] {
    // LlamaParse uses "--- Page X ---" or "\f" to separate pages
    const pageSeparator = /\n--- Page (\d+) ---\n|\n\f\n/
    const parts = markdown.split(pageSeparator).filter(Boolean)

    const pages: ParsedPage[] = []
    let currentPageNum = 1

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim()
      const pageNumMatch = part.match(/^(\d+)$/)
      if (pageNumMatch && part.length < 10) {
        currentPageNum = parseInt(pageNumMatch[1], 10)
        continue
      }
      if (part.length > 20) {
        const hasTable = /\|.*\|/.test(part) || /\t/.test(part)
        pages.push({
          pageNumber: currentPageNum,
          content: part,
          metadata: {
            pageType: hasTable ? 'financial_table' : 'text',
            hasTable,
            wordCount: part.split(/\s+/).filter(w => w.length > 0).length,
            charCount: part.length,
          },
        })
        currentPageNum++
      }
    }

    return pages
  }
}
