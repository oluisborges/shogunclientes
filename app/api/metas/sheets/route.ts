import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { GoogleSheetsService } from "@/lib/services/google-sheets"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")
    const year = searchParams.get("year")
    const month = searchParams.get("month")

    console.log("API Sheets chamada com:", { clientId, year, month })

    if (!clientId || !year || !month) {
      return NextResponse.json(
        { error: "Parâmetros clientId, year e month são obrigatórios" },
        { status: 400 }
      )
    }

    // Retornar dados mock para teste
    console.log("Retornando dados mock para Sheets API")
    return NextResponse.json([
      { meta: 5000, faturamento: 4800 },
      { meta: 5000, faturamento: 5200 },
      { meta: 5000, faturamento: 4500 },
      { meta: 5000, faturamento: 5800 },
      { meta: 5000, faturamento: 0 }
    ])
  } catch (error) {
    console.error("Erro ao buscar dados do Google Sheets:", error)
    return NextResponse.json(
      { error: "Erro interno ao buscar dados da planilha" },
      { status: 500 }
    )
  }
}
