import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET /api/profile - retorna dados do perfil do usuário logado
export async function GET() {
  try {
    console.log("API Profile GET chamada")
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log("Usuário não autenticado")
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    console.log("Usuário autenticado:", user.id)

    const admin = createAdminClient()
    
    // Busca perfil
    const { data: profile, error } = await admin
      .from("profiles")
      .select("full_name, avatar_url, role")
      .eq("id", user.id)
      .single()

    console.log("Perfil encontrado:", { profile, error })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || null,
      avatar_url: profile?.avatar_url || null,
      role: profile?.role || null,
    })
  } catch (err) {
    console.error("Erro na API Profile:", err)
    return NextResponse.json({ error: "Erro ao carregar perfil" }, { status: 500 })
  }
}

// PUT /api/profile - atualiza dados do perfil
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { full_name } = body

    const admin = createAdminClient()

    const { error } = await admin
      .from("profiles")
      .update({ full_name: full_name?.trim() || null })
      .eq("id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 })
  }
}
