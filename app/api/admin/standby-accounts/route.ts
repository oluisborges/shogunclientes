import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET /api/admin/standby-accounts - lista contas em stand by (com act_ mas sem profile_id)
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

    // Busca contas em stand by (com act_ mas sem profile_id)
    const { data: accounts, error } = await admin
      .from("clients")
      .select("id, meta_account_id, created_at")
      .not("meta_account_id", "is", null)
      .is("profile_id", null)
      .eq("active", true)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(accounts || [])
  } catch (err) {
    return NextResponse.json({ error: "Erro ao carregar contas em stand by" }, { status: 500 })
  }
}

// POST /api/admin/standby-accounts - cria conta em stand by (apenas com act_)
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
    const { meta_account_id } = body

    if (!meta_account_id) {
      return NextResponse.json(
        { error: "meta_account_id é obrigatório" },
        { status: 400 }
      )
    }

    // Cria conta em stand by
    const { data: account, error } = await admin
      .from("clients")
      .insert({
        meta_account_id: meta_account_id.trim(),
        profile_id: null, // Em stand by
        active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(account, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: "Erro ao criar conta em stand by" }, { status: 500 })
  }
}

// PUT /api/admin/standby-accounts - vincula conta em stand by a um usuário
export async function PUT(request: Request) {
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
    const { account_id, profile_id, business_name } = body

    if (!account_id || !profile_id || !business_name) {
      return NextResponse.json(
        { error: "account_id, profile_id e business_name são obrigatórios" },
        { status: 400 }
      )
    }

    // Vincula a conta ao usuário
    const { data: account, error } = await admin
      .from("clients")
      .update({
        business_name: business_name.trim(),
        profile_id,
      })
      .eq("id", account_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(account)
  } catch (err) {
    return NextResponse.json({ error: "Erro ao vincular conta" }, { status: 500 })
  }
}
