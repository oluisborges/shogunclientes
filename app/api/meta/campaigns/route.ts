import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { metaFetch, CAMPAIGN_FIELDS } from "@/lib/meta/client"
import type { MetaCampaign, MetaApiResponse } from "@/types/meta"

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("client_id")

  if (!clientId) {
    return NextResponse.json(
      { error: "Parâmetro client_id é obrigatório" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Check cache first
  const cacheKey = `campaigns_${new Date().toISOString().slice(0, 7)}`
  const { data: cached } = await supabase
    .from("meta_cache")
    .select("payload, expires_at")
    .eq("client_id", clientId)
    .eq("cache_key", cacheKey)
    .single()

  if (cached && new Date(cached.expires_at) > new Date()) {
    return NextResponse.json(cached.payload)
  }

  // Fetch client Meta credentials
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
    const data = await metaFetch<MetaApiResponse<MetaCampaign>>({
      endpoint: `/${client.meta_account_id}/campaigns`,
      accessToken: client.meta_access_token,
      params: { fields: CAMPAIGN_FIELDS, limit: "100" },
    })

    // Update cache (30 min expiry)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    await supabase.from("meta_cache").upsert(
      {
        client_id: clientId,
        cache_key: cacheKey,
        payload: data as unknown as Record<string, unknown>,
        fetched_at: new Date().toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: "client_id,cache_key" }
    )

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar campanhas"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
