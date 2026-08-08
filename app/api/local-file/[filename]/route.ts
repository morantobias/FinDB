/**
 * GET /api/local-file/[filename] — Serve locally-stored files.
 */
import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  if (filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
  }

  const filePath = join(process.cwd(), "storage", filename)
  if (!existsSync(filePath)) return NextResponse.json({ error: "File not found" }, { status: 404 })

  const buffer = await readFile(filePath)
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(buffer.length),
      "Cache-Control": "public, max-age=3600",
    },
  })
}
