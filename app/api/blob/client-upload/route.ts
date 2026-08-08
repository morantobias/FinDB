/**
 * POST /api/blob/client-upload — Vercel Blob client upload handler.
 * Required by @vercel/blob/client upload() for multipart uploads.
 */
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json() as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["application/pdf"],
        tokenPayload: JSON.stringify({}),
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log(`✅ Blob upload complete: ${blob.url} (${blob.size} bytes)`)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    )
  }
}
