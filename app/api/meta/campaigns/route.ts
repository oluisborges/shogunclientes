import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { metaFetch } from "@/lib/meta/client"

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("client_id")
  const dateStart = request.nextUrl.searchParams.get("date_start")
  const dateEnd = request.nextUrl.searchParams.get("date_end")

  console.log("Campaigns endpoint called with:", { clientId, dateStart, dateEnd })

  if (!clientId) {
    return NextResponse.json(
      { error: "Parâmetro client_id é obrigatório" },
      { status: 400 }
    )
  }

  const adminClient = createAdminClient()
  console.log("Admin client created")

  try {
    // Fetch client Meta credentials
    const { data: client, error: clientError } = await adminClient
      .from("clients")
      .select("meta_account_id, meta_access_token")
      .eq("id", clientId)
      .single()

    console.log("Client data:", {
      clientId,
      meta_account_id: client?.meta_account_id,
      has_token: !!client?.meta_access_token,
      token_length: client?.meta_access_token?.length
    })

    if (clientError || !client?.meta_account_id || !client?.meta_access_token) {
      return NextResponse.json(
        { error: "Cliente sem conta Meta configurada" },
        { status: 404 }
      )
    }

    // Buscar campanhas com métricas
    let fields = "id,name,status,objective,insights{spend,impressions,clicks,ctr,cpc,cpp,actions,action_values,reach,purchase_roas}"
    let params: any = { 
      fields, 
      limit: "50" 
    }

    // Adicionar filtro de data se fornecido
    if (dateStart && dateEnd) {
      params.time_range = { since: dateStart, until: dateEnd }
      fields = "id,name,status,objective,insights.time_range({\"since\":\"" + dateStart + "\",\"until\":\"" + dateEnd + "\"}){spend,impressions,clicks,ctr,cpc,cpp,actions,action_values,reach,purchase_roas}"
      params.fields = fields
      delete params.time_range // Remover time_range dos params e usar apenas no fields
    }

    const data = await metaFetch({
      endpoint: `/${client.meta_account_id}/campaigns`,
      accessToken: client.meta_access_token,
      params,
    })

    return NextResponse.json(data)
  } catch (err) {
    console.error("Erro campaigns:", err)
    const message = err instanceof Error ? err.message : "Erro ao buscar campanhas"
    
    // Verificar se é erro de token expirado
    if (message.includes("Session has expired") || message.includes("expired")) {
      return NextResponse.json({ 
        error: "Sessão Meta expirada. Por favor, reconecte sua conta.",
        requiresReauth: true 
      }, { status: 401 })
    }
    
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
