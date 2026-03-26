import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { metaFetch } from "@/lib/meta/client"
import { calculateWeeks } from "@/lib/metas/utils"

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

    // Buscar dados do cliente
    const adminClient = createAdminClient()
    const { data: client, error: clientError } = await adminClient
      .from("clients")
      .select("meta_account_id, meta_access_token")
      .eq("id", clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      )
    }

    // Retornar dados mock diretamente para teste
    console.log("Retornando dados mock para Meta API")
    return NextResponse.json([
      { trafego: 1200 },
      { trafego: 1500 },
      { trafego: 1100 },
      { trafego: 1800 },
      { trafego: 0 }
    ])
  } catch (error) {
    console.error("Erro ao buscar dados do Meta Ads:", error)
    return NextResponse.json(
      { error: "Erro interno ao buscar dados do Meta Ads" },
      { status: 500 }
    )
  }
}
