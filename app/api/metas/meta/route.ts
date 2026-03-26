import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { metaFetch } from "@/lib/meta/client"
import { calculateWeeks } from "@/lib/metas/utils"

interface DailyInsight {
  date_start: string
  spend: string
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

    const adminClient = createAdminClient()
    const { data: client, error: clientError } = await adminClient
      .from("clients")
      .select("meta_account_id, meta_access_token")
      .eq("id", clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    // Sem conta Meta configurada — retorna zeros
    if (!client.meta_account_id || !client.meta_access_token) {
      return NextResponse.json(
        Array.from({ length: 5 }, () => ({ trafego: 0 }))
      )
    }

    // Calcula as semanas do mês para montar o time_range
    const selectedDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const weeks = calculateWeeks(selectedDate)

    const monthStart = toISO(weeks[0].start)
    const monthEnd = toISO(weeks[weeks.length - 1].end)

    // Busca gasto diário do mês inteiro de uma vez
    const accountId = client.meta_account_id.startsWith("act_")
      ? client.meta_account_id
      : `act_${client.meta_account_id}`

    const insights = await metaFetch<InsightsResponse>({
      endpoint: `/${accountId}/insights`,
      accessToken: client.meta_access_token,
      params: {
        fields: "spend,date_start",
        time_range: JSON.stringify({ since: monthStart, until: monthEnd }),
        time_increment: "1",
        level: "account",
        limit: "31",
      },
    })

    // Indexa gasto por data (YYYY-MM-DD → spend)
    const spendByDate = new Map<string, number>()
    for (const row of insights.data ?? []) {
      spendByDate.set(row.date_start, parseFloat(row.spend) || 0)
    }

    // Agrega por semana
    const result = weeks.map((week) => {
      let totalSpend = 0
      const cursor = new Date(week.start)
      while (cursor <= week.end) {
        totalSpend += spendByDate.get(toISO(cursor)) ?? 0
        cursor.setDate(cursor.getDate() + 1)
      }
      return { trafego: Math.round(totalSpend * 100) / 100 }
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
