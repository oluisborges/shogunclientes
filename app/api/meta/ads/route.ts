import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { metaFetch, AD_FIELDS } from "@/lib/meta/client"
import type { MetaAd, MetaApiResponse } from "@/types/meta"

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("client_id")

  if (!clientId) {
    return NextResponse.json(
      { error: "Parâmetro client_id é obrigatório" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data: client, error: clientError } = await supabase
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

  try {
    const data = await metaFetch<MetaApiResponse<MetaAd>>({
      endpoint: `/${client.meta_account_id}/ads`,
      accessToken: client.meta_access_token,
      params: { fields: AD_FIELDS, limit: "100" },
    })

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar anúncios"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
