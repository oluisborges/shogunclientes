import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET /api/admin/client-access - lista todos os acessos ou de um usuário específico
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verifica se é admin
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin" && profile?.role !== "moderador") {
      return NextResponse.json({ error: "Acesso restrito a administradores e moderadores" }, { status: 403 })
    }

    // Verifica se tem filtro por user_id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Simplificar query sem joins complexos
    const { data: access, error } = await admin
      .from("user_client_access")
      .select("*")
      .eq("user_id", userId)

    if (error) {
      console.error("Query error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Buscar informações separadamente
    const formattedAccess = []
    for (const item of access) {
      // Buscar dados do usuário
      const { data: userData } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", item.user_id)
        .single()
      
      // Buscar dados do cliente
      const { data: clientData } = await admin
        .from("clients")
        .select("business_name, meta_account_id")
        .eq("id", item.client_id)
        .single()
      
      formattedAccess.push({
        id: item.id,
        user_id: item.user_id,
        client_id: item.client_id,
        access_level: item.access_level,
        created_at: item.created_at,
        created_by: item.created_by,
        user: {
          full_name: userData?.full_name || null
        },
        client: clientData ? {
          business_name: clientData.business_name,
          meta_account_id: clientData.meta_account_id
        } : null
      })
    }

    return NextResponse.json(formattedAccess)
  } catch (err) {
    console.error("CLIENT-ACCESS API ERROR:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: "Erro ao carregar acessos" }, { status: 500 })
  }
}

// POST /api/admin/client-access - cria um novo acesso de usuário a cliente
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verifica se é admin
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin" && profile?.role !== "moderador") {
      return NextResponse.json({ error: "Acesso restrito a administradores e moderadores" }, { status: 403 })
    }

    const body = await request.json()
    const { user_id, client_id, access_level } = body

    if (!user_id || !client_id || !access_level) {
      return NextResponse.json(
        { error: "user_id, client_id e access_level são obrigatórios" },
        { status: 400 }
      )
    }

    if (!["viewer", "editor", "admin"].includes(access_level)) {
      return NextResponse.json(
        { error: "access_level deve ser viewer, editor ou admin" },
        { status: 400 }
      )
    }

    // Verifica se o acesso já existe
    const { data: existing } = await admin
      .from("user_client_access")
      .select("id")
      .eq("user_id", user_id)
      .eq("client_id", client_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: "Usuário já tem acesso a este cliente" },
        { status: 409 }
      )
    }

    // Cria o acesso
    const { data: access, error } = await admin
      .from("user_client_access")
      .insert({
        user_id,
        client_id,
        access_level,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(access, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: "Erro ao criar acesso" }, { status: 500 })
  }
}

// DELETE /api/admin/client-access - remove um acesso de usuário a cliente
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verifica se é admin
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin" && profile?.role !== "moderador") {
      return NextResponse.json({ error: "Acesso restrito a administradores e moderadores" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const accessId = searchParams.get("id")

    if (!accessId) {
      return NextResponse.json(
        { error: "ID do acesso é obrigatório" },
        { status: 400 }
      )
    }

    // Remove o acesso
    const { error } = await admin
      .from("user_client_access")
      .delete()
      .eq("id", accessId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: "Erro ao remover acesso" }, { status: 500 })
  }
}
