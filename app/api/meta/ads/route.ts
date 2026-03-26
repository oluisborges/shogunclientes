import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { metaFetch } from "@/lib/meta/client"

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("client_id")
  const dateStart = request.nextUrl.searchParams.get("date_start")
  const dateEnd = request.nextUrl.searchParams.get("date_end")

  if (!clientId) {
    return NextResponse.json(
      { error: "Parâmetro client_id é obrigatório" },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()

  try {
    const { data: client, error: clientError } = await adminClient
      .from("clients")
      .select("meta_account_id, meta_access_token")
      .eq("id", clientId)
      .single()

    if (clientError || !client?.meta_account_id || !client?.meta_access_token) {
      return NextResponse.json(
        { error: "Cliente sem conta Meta configurada" },
        { status: 404 }
      )
    }

    let fields = "id,name,status,adset_id,creative{thumbnail_url,title,body,video_id,effective_object_story_id,object_type,image_url,image_hash},insights{spend,impressions,clicks,ctr,cpc,cpp,actions,action_values,reach,purchase_roas}"
    let params: any = { 
      fields, 
      limit: "100" 
    }

    // Adicionar filtro de data se fornecido
    if (dateStart && dateEnd) {
      params.time_range = { since: dateStart, until: dateEnd }
      fields = "id,name,status,adset_id,creative{thumbnail_url,title,body,video_id,effective_object_story_id,object_type,image_url,image_hash},insights.time_range({\"since\":\"" + dateStart + "\",\"until\":\"" + dateEnd + "\"}){spend,impressions,clicks,ctr,cpc,cpp,actions,action_values,reach,purchase_roas}"
      params.fields = fields
      delete params.time_range // Remover time_range dos params e usar apenas no fields
    }

    const data = await metaFetch({
      endpoint: `/${client.meta_account_id}/ads`,
      accessToken: client.meta_access_token,
      params,
    })

    return NextResponse.json(data)
  } catch (err) {
    console.error("Erro ads:", err)
    const message = err instanceof Error ? err.message : "Erro ao buscar anúncios"
    
    if (message.includes("Session has expired") || message.includes("expired")) {
      return NextResponse.json({ 
        error: "Sessão Meta expirada. Por favor, reconecte sua conta.",
        requiresReauth: true 
      }, { status: 401 })
    }
    
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
