import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { metaFetch } from "@/lib/meta/client"
import { getClientMetaCredentials } from "@/lib/meta/getClientToken"

/** Extract the src from the first iframe in an HTML string */
function extractIframeSrc(html: string): string | null {
  const match = html.match(/src="([^"]+)"/)
  return match?.[1] ? match[1].replace(/&amp;/g, "&") : null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const adId    = request.nextUrl.searchParams.get("ad_id")
  const clientId = request.nextUrl.searchParams.get("client_id")

  if (!adId || !clientId) {
    return NextResponse.json({ error: "ad_id e client_id são obrigatórios" }, { status: 400 })
  }

  const creds = await getClientMetaCredentials(clientId)
  if ("error" in creds) {
    return NextResponse.json({ error: creds.error }, { status: creds.status })
  }

  try {
    const data = await metaFetch<{ data: { body: string }[] }>({
      endpoint: `/${adId}/previews`,
      accessToken: creds.accessToken,
      params: { ad_format: "MOBILE_FEED_STANDARD" },
    })

    const body = data.data?.[0]?.body
    if (!body) return NextResponse.json({ previewUrl: null })

    const previewUrl = extractIframeSrc(body)
    return NextResponse.json({ previewUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[ad-preview]", msg)
    return NextResponse.json({ previewUrl: null, error: msg })
  }
}
