import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { metaFetch } from "@/lib/meta/client"
import type { MetaInsights } from "@/types/meta"

interface InsightsResponse {
  data: MetaInsights[]
}

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("client_id")
  const periodCurrent = request.nextUrl.searchParams.get("period_current")
  const periodPrevious = request.nextUrl.searchParams.get("period_previous")

  if (!clientId || !periodCurrent || !periodPrevious) {
    return NextResponse.json(
      { error: "Parâmetros client_id, period_current e period_previous são obrigatórios" },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const adminClient = createAdminClient()

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

  const fields = "spend,impressions,clicks,ctr,cpc,actions,action_values"
  const [currentStart, currentEnd] = periodCurrent.split(",")
  const [previousStart, previousEnd] = periodPrevious.split(",")

  try {
    const [currentData, previousData] = await Promise.all([
      metaFetch<InsightsResponse>({
        endpoint: `/${client.meta_account_id}/insights`,
        accessToken: client.meta_access_token,
        params: {
          fields,
          time_range: JSON.stringify({
            since: currentStart,
            until: currentEnd,
          }),
        },
      }),
      metaFetch<InsightsResponse>({
        endpoint: `/${client.meta_account_id}/insights`,
        accessToken: client.meta_access_token,
        params: {
          fields,
          time_range: JSON.stringify({
            since: previousStart,
            until: previousEnd,
          }),
        },
      }),
    ])

    const current = currentData.data?.[0]
    const previous = previousData.data?.[0]

    if (!current || !previous) {
      return NextResponse.json({ comparisons: [] })
    }

    const calcDelta = (curr: number, prev: number) => ({
      current: curr,
      previous: prev,
      delta: curr - prev,
      deltaPercent: prev > 0 ? ((curr - prev) / prev) * 100 : 0,
    })

    const comparisons = [
      {
        metric: "Investimento",
        ...calcDelta(parseFloat(current.spend), parseFloat(previous.spend)),
        isPositive: false,
      },
      {
        metric: "Impressões",
        ...calcDelta(
          parseInt(current.impressions),
          parseInt(previous.impressions)
        ),
        isPositive: true,
      },
      {
        metric: "Cliques",
        ...calcDelta(parseInt(current.clicks), parseInt(previous.clicks)),
        isPositive: true,
      },
      {
        metric: "CTR",
        ...calcDelta(parseFloat(current.ctr), parseFloat(previous.ctr)),
        isPositive: true,
      },
    ]

    return NextResponse.json({ comparisons })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao buscar insights"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
