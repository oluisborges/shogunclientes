import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token não fornecido" },
        { status: 400 }
      )
    }

    // Salvar refresh token em uma tabela de configurações
    const adminClient = createAdminClient()
    
    const { error: upsertError } = await adminClient
      .from("system_settings")
      .upsert({
        key: "google_calendar_refresh_token",
        value: refreshToken,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "key"
      })

    if (upsertError) {
      console.error("Erro ao salvar refresh token:", upsertError)
      return NextResponse.json(
        { error: "Erro ao salvar refresh token" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Erro ao salvar token:", error)
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const adminClient = createAdminClient()
    
    const { data, error } = await adminClient
      .from("system_settings")
      .select("value")
      .eq("key", "google_calendar_refresh_token")
      .single()

    if (error || !data) {
      return NextResponse.json({ refreshToken: null })
    }

    return NextResponse.json({ refreshToken: data.value })

  } catch (error) {
    console.error("Erro ao buscar token:", error)
    return NextResponse.json({ refreshToken: null })
  }
}
