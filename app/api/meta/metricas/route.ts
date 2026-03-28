import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { metaFetch } from "@/lib/meta/client"

interface MetaAction {
  action_type: string
  value: string
}

interface MetaInsightsData {
  spend?: string
  impressions?: string
  reach?: string
  clicks?: string
  ctr?: string
  cpc?: string
  cpp?: string
  frequency?: string
  purchase_roas?: Array<{ action_type: string; value: string }>
  actions?: MetaAction[]
  action_values?: MetaAction[]
}

interface MetaInsightsResponse {
  data: MetaInsightsData[]
}

interface MetaGenderInsight {
  gender: string
  actions?: MetaAction[]
  action_values?: MetaAction[]
}

interface MetaGenderResponse {
  data: MetaGenderInsight[]
}

interface MetaCampaignsResponse {
  data: MetaCampaignItem[]
}

function extractAction(actions: MetaAction[] | undefined, type: string): number {
  if (!actions) return 0
  const found = actions.find((a) => a.action_type === type)
  return found ? parseFloat(found.value) : 0
}

function parseInsights(data: MetaInsightsData | undefined) {
  if (!data) {
    return {
      spend: 0,
      impressions: 0,
      reach: 0,
      clicks: 0,
      ctr: 0,
      cpc: 0,
      cpp: 0,
      frequency: 0,
      purchaseRoas: 0,
      linkClicks: 0,
      lpViews: 0,
      addToCart: 0,
      initiateCheckout: 0,
      purchases: 0,
      purchaseValue: 0,
      costPerPurchase: 0,
    }
  }

  const spend = parseFloat(data.spend || "0")
  const purchases = extractAction(data.actions, "purchase")
  const purchaseRoasArr = data.purchase_roas
  const purchaseRoas = purchaseRoasArr && purchaseRoasArr.length > 0
    ? parseFloat(purchaseRoasArr[0].value)
    : 0

  return {
    spend,
    impressions: parseFloat(data.impressions || "0"),
    reach: parseFloat(data.reach || "0"),
    clicks: parseFloat(data.clicks || "0"),
    ctr: parseFloat(data.ctr || "0"),
    cpc: parseFloat(data.cpc || "0"),
    cpp: parseFloat(data.cpp || "0"),
    frequency: parseFloat(data.frequency || "0"),
    purchaseRoas,
    linkClicks: extractAction(data.actions, "link_click"),
    lpViews: extractAction(data.actions, "landing_page_view"),
    addToCart: extractAction(data.actions, "add_to_cart"),
    initiateCheckout: extractAction(data.actions, "initiate_checkout"),
    purchases,
    purchaseValue: extractAction(data.action_values, "purchase"),
    costPerPurchase: purchases > 0 ? spend / purchases : 0,
  }
}

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("client_id")
  const dateStart = request.nextUrl.searchParams.get("date_start")
  const dateEnd = request.nextUrl.searchParams.get("date_end")
  const prevStart = request.nextUrl.searchParams.get("prev_start")
  const prevEnd = request.nextUrl.searchParams.get("prev_end")

  if (!clientId) {
    return NextResponse.json(
      { error: "Parâmetro client_id é obrigatório" },
      { status: 400 }
    )
  }

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

  const { meta_account_id: accountId, meta_access_token: accessToken } = client
  const insightFields =
    "spend,impressions,reach,clicks,ctr,cpc,cpp,frequency,purchase_roas,actions,action_values"

  try {
    // Build time range strings for insights
    const currentTimeRange =
      dateStart && dateEnd
        ? JSON.stringify({ since: dateStart, until: dateEnd })
        : undefined
    const prevTimeRange =
      prevStart && prevEnd
        ? JSON.stringify({ since: prevStart, until: prevEnd })
        : undefined

    const currentParams: Record<string, string> = {
      fields: insightFields,
      level: "account",
    }
    if (currentTimeRange) currentParams.time_range = currentTimeRange

    const prevParams: Record<string, string> = {
      fields: insightFields,
      level: "account",
    }
    if (prevTimeRange) prevParams.time_range = prevTimeRange

    const genderParams: Record<string, string> = {
      fields: "actions,action_values",
      breakdowns: "gender",
      level: "account",
    }
    if (currentTimeRange) genderParams.time_range = currentTimeRange

    const [currentInsights, prevInsights, campaignsData, accountData, genderData] =
      await Promise.all([
        metaFetch<MetaInsightsResponse>({
          endpoint: `/${accountId}/insights`,
          accessToken,
          params: currentParams,
        }),
        prevTimeRange
          ? metaFetch<MetaInsightsResponse>({
              endpoint: `/${accountId}/insights`,
              accessToken,
              params: prevParams,
            })
          : Promise.resolve({ data: [] } as MetaInsightsResponse),
        metaFetch<MetaCampaignsResponse>({
          endpoint: `/${accountId}/campaigns`,
          accessToken,
          params: { fields: "id,name,status", limit: "200" },
        }),
        fetch(
          `https://graph.facebook.com/v19.0/${accountId}?` +
            `fields=balance,amount_spent,spend_cap,currency&` +
            `access_token=${accessToken}`
        ).then((r) => r.json()),
        metaFetch<MetaGenderResponse>({
          endpoint: `/${accountId}/insights`,
          accessToken,
          params: genderParams,
        }).catch(() => ({ data: [] } as MetaGenderResponse)),
      ])

    // Compute balance
    const amountSpent = parseFloat(accountData.amount_spent || "0") / 100
    let balance = 0
    if (accountData.spend_cap) {
      const spendCap = parseFloat(accountData.spend_cap) / 100
      balance = spendCap - amountSpent
    } else {
      balance = Math.abs(parseFloat(accountData.balance || "0")) / 100
    }

    const current = parseInsights(currentInsights.data[0])
    const previous = parseInsights(prevInsights.data[0])

    // Gender breakdown for purchases
    const genderStats = (genderData.data || []).map((g) => ({
      gender: g.gender,
      purchases: extractAction(g.actions, "purchase"),
      purchaseValue: extractAction(g.action_values, "purchase"),
    })).filter((g) => g.gender !== "unknown" && g.purchases > 0)

    return NextResponse.json({
      balance,
      current,
      previous,
      campaigns: campaignsData.data || [],
      genderStats,
    })
  } catch (err) {
    console.error("Métricas API error:", err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Erro ao buscar métricas",
      },
      { status: 502 }
    )
  }
}
