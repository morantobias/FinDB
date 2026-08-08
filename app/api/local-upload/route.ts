/**
 * POST /api/local-upload — Local filesystem upload fallback.
 */
import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"

const STORAGE_DIR = join(process.cwd(), "storage")
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Only PDF files supported" }, { status: 400 })
    if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "File exceeds 50MB limit" }, { status: 400 })

    await mkdir(STORAGE_DIR, { recursive: true })
    const uniqueName = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    const filePath = join(STORAGE_DIR, uniqueName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const url = `${BASE_URL}/api/local-file/${uniqueName}`
    return NextResponse.json({ success: true, url, filename: file.name, size: file.size })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}
