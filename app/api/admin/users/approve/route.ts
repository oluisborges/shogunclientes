import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single()
  return profile?.role === "admin" ? user : null
}

// POST /api/admin/users/approve — approve a pending registration
export async function POST(req: NextRequest) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id, meta_account_id, niche, gestor_id } = await req.json()

  if (!id || !meta_account_id?.trim()) {
    return NextResponse.json({ error: "id e meta_account_id são obrigatórios" }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get the pending registration
  const { data: reg, error: regError } = await admin
    .from("pending_registrations")
    .select("*")
    .eq("id", id)
    .single()

  if (regError || !reg) {
    return NextResponse.json({ error: "Registro pendente não encontrado" }, { status: 404 })
  }

  // 1. Create profile
  const { error: profileError } = await admin.from("profiles").insert({
    id:        reg.user_id,
    role:      "client",
    full_name: reg.full_name,
  })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  // 2. Create client record
  const { error: clientError } = await admin.from("clients").insert({
    profile_id:      reg.user_id,
    business_name:   reg.business_name,
    cnpj:            reg.cnpj || null,
    meta_account_id: meta_account_id.trim(),
    active:          true,
    niche:           niche || null,
    gestor_id:       gestor_id || null,
  })

  if (clientError) {
    await admin.from("profiles").delete().eq("id", reg.user_id)
    return NextResponse.json({ error: clientError.message }, { status: 500 })
  }

  // 3. Remove pending status from auth user metadata
  await admin.auth.admin.updateUserById(reg.user_id, {
    user_metadata: { status: "approved" },
  })

  // 4. Delete the pending registration record
  await admin.from("pending_registrations").delete().eq("id", id)

  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/users/approve?id=xxx — reject/delete a pending registration
export async function DELETE(req: NextRequest) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 })

  const admin = createAdminClient()

  const { data: reg } = await admin
    .from("pending_registrations")
    .select("user_id")
    .eq("id", id)
    .single()

  if (reg?.user_id) {
    await admin.auth.admin.deleteUser(reg.user_id)
  }

  await admin.from("pending_registrations").delete().eq("id", id)

  return NextResponse.json({ ok: true })
}
