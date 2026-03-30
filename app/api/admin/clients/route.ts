import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET /api/admin/clients - lista todos os clientes para vincular
export async function GET() {
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

    // Busca todos os clientes ativos
    const { data: clients, error } = await admin
      .from("clients")
      .select("id, business_name, meta_account_id")
      .eq("active", true)
      .not("profile_id", "is", null)
      .order("business_name")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(clients || [])
  } catch (err) {
    return NextResponse.json({ error: "Erro ao carregar clientes" }, { status: 500 })
  }
}

// POST /api/admin/clients - cria um novo cliente
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
    const { business_name, meta_account_id, profile_id } = body

    if (!business_name || !meta_account_id) {
      return NextResponse.json(
        { error: "business_name e meta_account_id são obrigatórios" },
        { status: 400 }
      )
    }

    // Cria o cliente (profile_id pode ser null para contas compartilhadas)
    const { data: client, error } = await admin
      .from("clients")
      .insert({
        business_name: business_name.trim(),
        meta_account_id: meta_account_id.trim(),
        profile_id: profile_id || null, // Permite null
        active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(client, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 })
  }
}
