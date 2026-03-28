import { NextRequest, NextResponse } from "next/server"
import { metaFetch } from "@/lib/meta/client"
import { getClientMetaCredentials } from "@/lib/meta/getClientToken"

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("client_id")
  const dateStart = request.nextUrl.searchParams.get("date_start")
  const dateEnd = request.nextUrl.searchParams.get("date_end")

  if (!clientId) {
    return NextResponse.json({ error: "Parâmetro client_id é obrigatório" }, { status: 400 })
  }

  const creds = await getClientMetaCredentials(clientId)
  if ("error" in creds) {
    return NextResponse.json({ error: creds.error }, { status: creds.status })
  }

  try {
    let fields = "id,name,status,adset_id,creative{thumbnail_url,title,body,video_id,effective_object_story_id,object_type,image_url,image_hash},insights{spend,impressions,clicks,ctr,cpc,cpp,actions,action_values,reach,purchase_roas}"
    const params: Record<string, string> = { fields, limit: "100" }

    if (dateStart && dateEnd) {
      fields = `id,name,status,adset_id,creative{thumbnail_url,title,body,video_id,effective_object_story_id,object_type,image_url,image_hash},insights.time_range({"since":"${dateStart}","until":"${dateEnd}"}){spend,impressions,clicks,ctr,cpc,cpp,actions,action_values,reach,purchase_roas}`
      params.fields = fields
    }

    const data = await metaFetch({
      endpoint: `/${creds.accountId}/ads`,
      accessToken: creds.accessToken,
      params,
    })

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar anúncios"
    if (message.includes("Session has expired") || message.includes("expired")) {
      return NextResponse.json({ error: "Sessão Meta expirada. Entre em contato pelo grupo do Shogun.", requiresReauth: true }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
