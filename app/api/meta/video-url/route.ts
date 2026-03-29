import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { metaFetch } from "@/lib/meta/client"
import { getClientMetaCredentials } from "@/lib/meta/getClientToken"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const videoId = request.nextUrl.searchParams.get("video_id")
  const clientId = request.nextUrl.searchParams.get("client_id")

  if (!videoId || !clientId) {
    return NextResponse.json({ error: "video_id e client_id são obrigatórios" }, { status: 400 })
  }

  const creds = await getClientMetaCredentials(clientId)
  if ("error" in creds) {
    return NextResponse.json({ error: creds.error }, { status: creds.status })
  }

  try {
    const data = await metaFetch<{ source?: string; thumbnails?: { data: { uri: string }[] } }>({
      endpoint: `/${videoId}`,
      accessToken: creds.accessToken,
      params: { fields: "source,thumbnails" },
    })

    return NextResponse.json({
      source: data.source ?? null,
      thumbnail: data.thumbnails?.data?.[0]?.uri ?? null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar vídeo"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
