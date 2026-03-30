import { NextRequest, NextResponse } from "next/server"
import { metaFetch } from "@/lib/meta/client"
import { getClientMetaCredentials } from "@/lib/meta/getClientToken"

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

interface MetaAgeInsight {
  age: string
  actions?: MetaAction[]
  action_values?: MetaAction[]
}

interface MetaAgeResponse {
  data: MetaAgeInsight[]
}

interface MetaDailyInsight {
  date_start: string
  spend?: string
  actions?: MetaAction[]
  action_values?: MetaAction[]
}

interface MetaDailyResponse {
  data: MetaDailyInsight[]
}

interface MetaCampaignItem {
  id: string
  name: string
  status: string
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

  const creds = await getClientMetaCredentials(clientId)
  if ("error" in creds) {
    return NextResponse.json({ error: creds.error }, { status: creds.status })
  }

  const { accountId, accessToken } = creds
  const insightFields =
    "spend,impressions,reach,clicks,ctr,cpc,cpp,frequency,purchase_roas,actions,action_values"

  try {
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

    const dailyParams: Record<string, string> = {
      fields: "spend,actions,action_values",
      level: "account",
      time_increment: "1",
    }
    if (currentTimeRange) dailyParams.time_range = currentTimeRange

    const ageParams: Record<string, string> = {
      fields: "actions,action_values",
      breakdowns: "age",
      level: "account",
    }
    if (currentTimeRange) ageParams.time_range = currentTimeRange

    const [currentInsights, prevInsights, campaignsData, accountData, genderData, ageData] =
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
        metaFetch<MetaAgeResponse>({
          endpoint: `/${accountId}/insights`,
          accessToken,
          params: ageParams,
        }).catch(() => ({ data: [] } as MetaAgeResponse)),
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

    // Gender breakdown
    const genderStats = (genderData.data || [])
      .map((g) => ({
        gender: g.gender,
        purchases: extractAction(g.actions, "purchase"),
        purchaseValue: extractAction(g.action_values, "purchase"),
        lpViews: extractAction(g.actions, "landing_page_view"),
      }))
      .filter((g) => g.gender !== "unknown" && g.purchases > 0)

    // Buscar dados diários em chunks menores para evitar limitação do Meta API
    const dailyMap = new Map<string, { spend: number; purchases: number; purchaseValue: number }>()
    
    if (dateStart && dateEnd) {
      const startDate = new Date(dateStart)
      const endDate = new Date(dateEnd)
      
      // Dividir em chunks de 7 dias para evitar limitação do Meta API
      const chunkSize = 7 // dias
      let currentChunkStart = new Date(startDate)
      
      while (currentChunkStart <= endDate) {
        const currentChunkEnd = new Date(currentChunkStart)
        currentChunkEnd.setDate(currentChunkEnd.getDate() + chunkSize - 1)
        if (currentChunkEnd > endDate) {
          currentChunkEnd.setTime(endDate.getTime())
        }
        
        const chunkTimeRange = JSON.stringify({ 
          since: currentChunkStart.toISOString().split('T')[0], 
          until: currentChunkEnd.toISOString().split('T')[0] 
        })
        
        // Buscar dados deste chunk
        const chunkDailyParams: Record<string, string> = {
          fields: "spend,actions,action_values",
          level: "account",
          time_increment: "1",
          time_range: chunkTimeRange,
        }
        
        const chunkDailyInsights = await metaFetch<MetaDailyResponse>({
          endpoint: `/${accountId}/insights`,
          accessToken,
          params: chunkDailyParams,
        }).catch(() => ({ data: [] } as MetaDailyResponse))
        
        // Adicionar dados do chunk ao mapa
        for (const d of chunkDailyInsights.data || []) {
          dailyMap.set(d.date_start, {
            spend: parseFloat(d.spend || "0"),
            purchases: extractAction(d.actions, "purchase"),
            purchaseValue: extractAction(d.action_values, "purchase"),
          })
        }
        
        // Próximo chunk
        currentChunkStart.setDate(currentChunkStart.getDate() + chunkSize)
      }
    }

    const dailyData: Array<{ date: string; spend: number; purchases: number; purchaseValue: number }> = []
    if (dateStart && dateEnd) {
      const cur = new Date(dateStart)
      const end = new Date(dateEnd)
      while (cur <= end) {
        const dateStr = cur.toISOString().split("T")[0]
        const entry = dailyMap.get(dateStr)
        dailyData.push({
          date: dateStr,
          spend: entry?.spend ?? 0,
          purchases: entry?.purchases ?? 0,
          purchaseValue: entry?.purchaseValue ?? 0,
        })
        cur.setDate(cur.getDate() + 1)
      }
    }

    // Age breakdown
    const ageStats = (ageData.data || [])
      .map((a) => ({
        age: a.age,
        purchases: extractAction(a.actions, "purchase"),
        lpViews: extractAction(a.actions, "landing_page_view"),
      }))
      .filter((a) => a.purchases > 0 || a.lpViews > 0)
      .sort((a, b) => parseInt(a.age) - parseInt(b.age))

    return NextResponse.json({
      balance,
      current,
      previous,
      campaigns: campaignsData.data || [],
      genderStats,
      dailyData,
      ageStats,
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
