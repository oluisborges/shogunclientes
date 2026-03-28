import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Não autorizado", status: 401 as const }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return { error: "Acesso restrito a administradores", status: 403 as const }
  }

  return { userId: user.id }
}

// GET /api/admin/users — lista todos os usuários com perfil e cliente
export async function GET() {
  const check = await requireAdmin()
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const admin = createAdminClient()

  // Busca profiles + clients em paralelo
  const [profilesResult, clientsResult] = await Promise.all([
    admin.from("profiles").select("id, role, full_name, created_at").order("created_at"),
    admin.from("clients").select("id, profile_id, business_name, cnpj, meta_account_id, active, niche, gestor_id"),
  ])

  if (profilesResult.error) {
    return NextResponse.json({ error: profilesResult.error.message }, { status: 500 })
  }

  // Busca e-mails dos usuários via Auth Admin API
  const { data: authData, error: authError } =
    await admin.auth.admin.listUsers({ perPage: 1000 })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  const authMap = new Map(authData.users.map((u) => [u.id, u.email ?? ""]))
  const clientMap = new Map(
    (clientsResult.data ?? []).map((c) => [c.profile_id, c])
  )

  const users = (profilesResult.data ?? []).map((profile) => ({
    id: profile.id,
    email: authMap.get(profile.id) ?? "",
    full_name: profile.full_name,
    role: profile.role,
    created_at: profile.created_at,
    client: clientMap.get(profile.id) ?? null,
  }))

  return NextResponse.json(users)
}

// POST /api/admin/users — cria usuário + perfil + cliente
export async function POST(request: Request) {
  const check = await requireAdmin()
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const body = await request.json()
  const { email, password, full_name, business_name, cnpj, meta_account_id, meta_access_token, niche, gestor_id } = body

  if (!email || !password || !business_name) {
    return NextResponse.json(
      { error: "email, password e business_name são obrigatórios" },
      { status: 400 }
    )
  }

  const admin = createAdminClient()

  // 1. Cria o usuário no Supabase Auth
  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

  if (authError || !authUser.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Erro ao criar usuário" },
      { status: 400 }
    )
  }

  const userId = authUser.user.id

  // 2. Cria o perfil com role "client"
  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    role: "client",
    full_name: full_name || null,
  })

  if (profileError) {
    // Rollback: remove auth user
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // 3. Cria o registro de cliente
  const { data: client, error: clientError } = await admin
    .from("clients")
    .insert({
      profile_id: userId,
      business_name,
      cnpj: cnpj || null,
      meta_account_id:  meta_account_id  || null,
      meta_access_token: meta_access_token || null,
      active: true,
      niche: niche || null,
      gestor_id: gestor_id || null,
    })
    .select()
    .single()

  if (clientError) {
    // Rollback: remove profile + auth user
    await admin.from("profiles").delete().eq("id", userId)
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: clientError.message }, { status: 500 })
  }

  return NextResponse.json({ userId, client }, { status: 201 })
}

// DELETE /api/admin/users?userId=xxx — desativa ou remove usuário
export async function DELETE(request: Request) {
  const check = await requireAdmin()
  if ("error" in check) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  if (!userId) {
    return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 })
  }

  const admin = createAdminClient()

  // Desativa o cliente em vez de deletar para preservar histórico
  await admin.from("clients").update({ active: false }).eq("profile_id", userId)
  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
