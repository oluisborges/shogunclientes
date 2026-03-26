import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getMetasForMonth } from "@/lib/services/google-sheets"

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

    // Buscar nome do cliente para encontrar a planilha no Drive
    const adminClient = createAdminClient()
    const { data: client, error: clientError } = await adminClient
      .from("clients")
      .select("business_name")
      .eq("id", clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      )
    }

    const weeks = await getMetasForMonth(client.business_name, parseInt(month))
    return NextResponse.json(weeks)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno"
    console.error("Erro ao buscar dados do Google Sheets:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
