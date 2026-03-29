import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { metaFetch } from "@/lib/meta/client"
import { getClientMetaCredentials } from "@/lib/meta/getClientToken"

/** Extract the src attribute from an embed_html string */
function extractIframeSrc(html: string): string | null {
  const match = html.match(/src="([^"]+)"/)
  return match?.[1] ? match[1].replace(/&amp;/g, "&") : null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const videoId  = request.nextUrl.searchParams.get("video_id")
  const clientId = request.nextUrl.searchParams.get("client_id")

  if (!videoId || !clientId) {
    return NextResponse.json({ error: "video_id e client_id são obrigatórios" }, { status: 400 })
  }

  const creds = await getClientMetaCredentials(clientId)
  if ("error" in creds) {
    return NextResponse.json({ error: creds.error }, { status: creds.status })
  }

  interface VideoData {
    source?: string
    embed_html?: string
    picture?: string
  }

  let data: VideoData = {}

  // Strategy 1 — direct video node with all useful fields
  try {
    data = await metaFetch<VideoData>({
      endpoint: `/${videoId}`,
      accessToken: creds.accessToken,
      params: { fields: "source,embed_html,picture" },
    })
  } catch {
    // Strategy 2 — query through the ad account context
    try {
      const acctData = await metaFetch<{ data?: VideoData[] }>({
        endpoint: `/act_${creds.accountId}/advideos`,
        accessToken: creds.accessToken,
        params: {
          fields: "source,embed_html,picture",
          filtering: JSON.stringify([{ field: "id", operator: "EQUAL", value: videoId }]),
        },
      })
      data = acctData.data?.[0] ?? {}
    } catch {
      // both failed — return null
    }
  }

  // source → client plays with <video>
  if (data.source) {
    return NextResponse.json({ type: "source", url: data.source })
  }

  // embed_html → extract iframe src → client renders <iframe>
  if (data.embed_html) {
    const embedUrl = extractIframeSrc(data.embed_html)
    if (embedUrl) {
      return NextResponse.json({ type: "embed", url: embedUrl })
    }
  }

  return NextResponse.json({ type: null, url: null })
}
