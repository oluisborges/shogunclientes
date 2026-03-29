import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { metaFetch } from "@/lib/meta/client"
import { getClientMetaCredentials } from "@/lib/meta/getClientToken"

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

  // Strategy 1 — direct video node
  let metaError1 = ""
  try {
    const data = await metaFetch<VideoData>({
      endpoint: `/${videoId}`,
      accessToken: creds.accessToken,
      params: { fields: "source,embed_html,picture" },
    })

    if (data.source) return NextResponse.json({ type: "source", url: data.source })

    if (data.embed_html) {
      const embedUrl = extractIframeSrc(data.embed_html)
      if (embedUrl) return NextResponse.json({ type: "embed", url: embedUrl })
    }
  } catch (e) {
    metaError1 = e instanceof Error ? e.message : String(e)
  }

  // Strategy 2 — via ad account video library
  let metaError2 = ""
  try {
    const acctData = await metaFetch<{ data?: VideoData[] }>({
      endpoint: `/act_${creds.accountId}/advideos`,
      accessToken: creds.accessToken,
      params: {
        fields: "source,embed_html",
        filtering: JSON.stringify([{ field: "id", operator: "EQUAL", value: videoId }]),
      },
    })

    const item = acctData.data?.[0]
    if (item?.source) return NextResponse.json({ type: "source", url: item.source })

    if (item?.embed_html) {
      const embedUrl = extractIframeSrc(item.embed_html)
      if (embedUrl) return NextResponse.json({ type: "embed", url: embedUrl })
    }
  } catch (e) {
    metaError2 = e instanceof Error ? e.message : String(e)
  }

  // Return null with debug info so the client can log it
  return NextResponse.json({
    type: null,
    url: null,
    debug: { metaError1, metaError2, videoId, accountId: creds.accountId },
  })
}
