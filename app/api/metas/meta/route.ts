import { NextResponse } from "next/server"
import { metaFetch } from "@/lib/meta/client"
import { calculateWeeks } from "@/lib/metas/utils"
import { getClientMetaCredentials } from "@/lib/meta/getClientToken"

interface ActionValue {
  action_type: string
  value: string
}

interface DailyInsight {
  date_start: string
  action_values?: ActionValue[]
}

interface InsightsResponse {
  data: DailyInsight[]
  paging?: { cursors?: { after?: string }; next?: string }
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")
    const year = searchParams.get("year")
    const month = searchParams.get("month")

    if (!clientId || !year || !month) {
      return NextResponse.json(
        { error: "Parâmetros clientId, year e month são obrigatórios" },
        { status: 400 }
      )
    }

    const creds = await getClientMetaCredentials(clientId)
    if ("error" in creds) {
      // Sem conta Meta configurada — retorna zeros
      return NextResponse.json(
        Array.from({ length: 5 }, () => ({ trafego: 0 }))
      )
    }

    const { accountId: rawAccountId, accessToken } = creds

    // Calcula as semanas do mês para montar o time_range
    const selectedDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const weeks = calculateWeeks(selectedDate)

    const monthStart = toISO(weeks[0].start)
    const monthEnd = toISO(weeks[weeks.length - 1].end)

    // Busca gasto diário do mês inteiro de uma vez
    const accountId = rawAccountId.startsWith("act_")
      ? rawAccountId
      : `act_${rawAccountId}`

    const insights = await metaFetch<InsightsResponse>({
      endpoint: `/${accountId}/insights`,
      accessToken,
      params: {
        fields: "action_values,date_start",
        time_range: JSON.stringify({ since: monthStart, until: monthEnd }),
        time_increment: "1",
        level: "account",
        limit: "31",
      },
    })

    // Indexa faturamento por data (YYYY-MM-DD → omni_purchase value)
    const revenueByDate = new Map<string, number>()
    for (const row of insights.data ?? []) {
      const purchaseValue = row.action_values?.find(
        (a) => a.action_type === "omni_purchase" || a.action_type === "purchase"
      )
      revenueByDate.set(row.date_start, parseFloat(purchaseValue?.value ?? "0") || 0)
    }

    // Agrega por semana
    const result = weeks.map((week) => {
      let totalRevenue = 0
      const cursor = new Date(week.start)
      while (cursor <= week.end) {
        totalRevenue += revenueByDate.get(toISO(cursor)) ?? 0
        cursor.setDate(cursor.getDate() + 1)
      }
      return { trafego: Math.round(totalRevenue * 100) / 100 }
    })

    // Garante sempre 5 semanas
    while (result.length < 5) result.push({ trafego: 0 })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    console.error("Erro ao buscar dados do Meta Ads:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
